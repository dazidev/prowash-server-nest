import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { AdTypes } from '../../generated/prisma/client/client';

export class CreateAdvertisingDto {
  @IsEnum(AdTypes)
  type!: AdTypes;

  @IsInt()
  @Min(1)
  @Max(5)
  order!: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ValidateIf((dto: CreateAdvertisingDto) => dto.type === AdTypes.VIDEO)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  video?: string;
}
