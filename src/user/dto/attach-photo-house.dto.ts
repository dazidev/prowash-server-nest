import { IsString } from 'class-validator';

export class AttachPhotoHouseDto {
  @IsString()
  readonly key!: string;
}
