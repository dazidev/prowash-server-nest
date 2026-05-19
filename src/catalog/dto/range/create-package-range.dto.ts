import { IsString } from 'class-validator';

export class CreatePackageRangeDto {
  @IsString()
  readonly description!: string;

  @IsString()
  readonly unit!: string;
}
