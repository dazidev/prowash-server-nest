import { Transform } from 'class-transformer';
import { IsIn, IsInt, Min } from 'class-validator';

export class UploadAdvertisingImageDto {
  @IsIn(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
  mime!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(['jpg', 'jpeg', 'png', 'webp'])
  ext!: string;

  @IsInt()
  @Min(1)
  size!: number;
}
