import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { PushDevicePlatform } from '../../generated/prisma/client/client';

export class RegisterPushDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  @Matches(/^[!-~]+$/, {
    message: 'fcmToken must contain printable ASCII characters without spaces',
  })
  readonly fcmToken!: string;

  @IsEnum(PushDevicePlatform)
  readonly platform!: PushDevicePlatform;
}
