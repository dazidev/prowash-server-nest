import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

interface CreateSignedUploadUrlParams {
  userId: string;
  mime: string;
  ext: string;
  size: number;
}

@Injectable()
export class R2Service {
  private readonly r2: S3Client;
  private readonly bucket: string;
  private readonly maxUploadBytes: number;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.getOrThrow<string>('CF_ACCOUNT_ID');

    this.bucket = this.configService.getOrThrow<string>('R2_BUCKET');

    this.maxUploadBytes = Number(
      this.configService.getOrThrow<string>('MAX_UPLOAD_BYTES'),
    );

    this.r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'R2_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async createSignedUploadUrl({
    userId,
    mime,
    ext,
    size,
  }: CreateSignedUploadUrlParams) {
    try {
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/jpg',
      ];

      if (!allowedMimes.includes(mime)) {
        throw new BadRequestException('INVALID_MIME');
      }

      if (!ext || ext.length > 8) {
        throw new BadRequestException('INVALID_EXT');
      }

      if (!size || size > this.maxUploadBytes) {
        throw new BadRequestException('INVALID_SIZE');
      }

      const cleanExt = ext.replace('.', '').toLowerCase();

      const key = `houses/images/${userId}/${Date.now()}-${randomUUID()}.${cleanExt}`;

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mime,
      });

      const uploadUrl = await getSignedUrl(this.r2, command, {
        expiresIn: 600,
      });

      return {
        uploadUrl,
        key,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.log(error);
      throw new InternalServerErrorException('Error generating upload URL');
    }
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.r2.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return true;
    } catch {
      return false;
    }
  }

  async validateObjectExists(key: string): Promise<void> {
    const exists = await this.objectExists(key);

    if (!exists) {
      throw new NotFoundException('Object not found');
    }
  }

  async deleteByKey(key: string) {
    try {
      await this.r2.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return {
        success: true,
        key,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('ERROR_DELETING_OBJECT');
    }
  }

  async deleteMany(keys: string[]) {
    try {
      if (!keys.length) {
        return {
          success: true,
          deleted: 0,
        };
      }

      await this.r2.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: keys.map((key) => ({
              Key: key,
            })),
          },
        }),
      );

      return {
        success: true,
        deleted: keys.length,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('ERROR_DELETING_OBJECTS');
    }
  }

  async createAdvertisingUploadUrl({
    advertisingId,
    mime,
    ext,
    size,
  }: {
    advertisingId: string;
    mime: string;
    ext: string;
    size: number;
  }) {
    const extensions: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/jpg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
    };

    if (!extensions[mime]?.includes(ext)) {
      throw new BadRequestException('INVALID_IMAGE_FORMAT');
    }

    if (!Number.isInteger(size) || size < 1 || size > this.maxUploadBytes) {
      throw new BadRequestException('INVALID_SIZE');
    }

    const key = `advertising/images/${advertisingId}/${Date.now()}-${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mime,
    });

    try {
      const uploadUrl = await getSignedUrl(this.r2, command, {
        expiresIn: 600,
      });

      return { uploadUrl, key };
    } catch {
      throw new InternalServerErrorException('Error generating upload URL');
    }
  }

  async validateAdvertisingImage(key: string): Promise<void> {
    const metadata = await this.r2
      .send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      .catch((error: unknown) => {
        const status = (error as { $metadata?: { httpStatusCode?: number } })
          ?.$metadata?.httpStatusCode;

        if (status === 404) {
          throw new NotFoundException('Image not found in R2');
        }

        throw new InternalServerErrorException('Unable to verify image in R2');
      });

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const size = metadata.ContentLength ?? 0;

    if (!allowedMimes.includes(metadata.ContentType ?? '')) {
      throw new BadRequestException('INVALID_MIME');
    }

    if (size < 1 || size > this.maxUploadBytes) {
      throw new BadRequestException('INVALID_SIZE');
    }
  }
}
