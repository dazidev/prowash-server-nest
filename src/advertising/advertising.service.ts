import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdTypes, Prisma } from '../generated/prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../infrastructure/services/r2.service';
import { CreateAdvertisingDto } from './dto/create-advertising.dto';
import { UploadAdvertisingImageDto } from './dto/upload-advertising-image.dto';
import { parseVimeoVideo } from './utils/parse-vimeo-video';

@Injectable()
export class AdvertisingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly r2: R2Service,
  ) {}

  async findAll() {
    const data = await this.prisma.advertising.findMany({
      orderBy: { order: 'asc' },
    });

    return { success: true, data };
  }

  async create(dto: CreateAdvertisingDto) {
    const video =
      dto.type === AdTypes.VIDEO ? parseVimeoVideo(dto.video ?? '') : null;

    if (dto.type === AdTypes.VIDEO && !video) {
      throw new BadRequestException('Enter a valid Vimeo ID or URL.');
    }

    try {
      const data = await this.prisma.advertising.create({
        data: {
          type: dto.type,
          order: dto.order,
          text: dto.text,
          video: video?.watchUrl ?? null,
        },
      });

      return { success: true, data };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This advertising position is already occupied.',
        );
      }

      throw error;
    }
  }

  private async findOne(id: string) {
    const advertising = await this.prisma.advertising.findUnique({
      where: { id },
    });

    if (!advertising) {
      throw new NotFoundException('Advertising not found');
    }

    return advertising;
  }

  async createUploadUrl(id: string, dto: UploadAdvertisingImageDto) {
    const advertising = await this.findOne(id);

    if (
      advertising.type !== AdTypes.IMAGE &&
      advertising.type !== AdTypes.IMAGE_CAROUSEL
    ) {
      throw new BadRequestException('This advertising does not accept images');
    }

    const data = await this.r2.createAdvertisingUploadUrl({
      advertisingId: id,
      ...dto,
    });

    return { success: true, data };
  }

  async attachImage(id: string, key: string, position: number) {
    const advertising = await this.findOne(id);

    if (
      !Number.isInteger(position) ||
      position < 1 ||
      position > 5 ||
      (advertising.type === AdTypes.IMAGE && position !== 1) ||
      (advertising.type !== AdTypes.IMAGE &&
        advertising.type !== AdTypes.IMAGE_CAROUSEL)
    ) {
      throw new BadRequestException(
        'Invalid image position or advertising type',
      );
    }

    if (!key.startsWith(`advertising/images/${id}/`)) {
      throw new BadRequestException(
        'Image does not belong to this advertising',
      );
    }

    const field = `image${position}` as
      | 'image1'
      | 'image2'
      | 'image3'
      | 'image4'
      | 'image5';

    if (advertising[field] && advertising[field] !== key) {
      throw new ConflictException('This image position is already occupied');
    }

    await this.r2.validateAdvertisingImage(key);

    await this.prisma.advertising.update({
      where: { id },
      data: { [field]: key },
    });

    return { success: true };
  }

  async remove(id: string, extraKeys: string[] = []) {
    const advertising = await this.findOne(id);

    const keys = [
      advertising.image1,
      advertising.image2,
      advertising.image3,
      advertising.image4,
      advertising.image5,
      ...extraKeys,
    ].filter((key): key is string => Boolean(key));

    if (keys.some((key) => !key.startsWith(`advertising/images/${id}/`))) {
      throw new BadRequestException('Invalid advertising image key');
    }

    for (const key of new Set(keys)) {
      await this.r2.deleteByKey(key);
    }

    await this.prisma.advertising.delete({ where: { id } });

    return { success: true };
  }
}
