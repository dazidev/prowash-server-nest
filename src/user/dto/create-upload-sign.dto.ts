import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUploadSignDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
  readonly mime!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  readonly ext!: string;

  @IsNumber()
  readonly size!: number;
}
