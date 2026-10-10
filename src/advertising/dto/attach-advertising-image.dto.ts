import { IsNotEmpty, IsString } from 'class-validator';

export class AttachAdvertisingImageDto {
  @IsString()
  @IsNotEmpty()
  key!: string;
}
