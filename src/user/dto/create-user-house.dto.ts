import { IsOptional, IsString } from 'class-validator';

export class CreateUserHouseDto {
  @IsString()
  readonly name!: string;

  @IsString()
  readonly street!: string;

  @IsOptional()
  @IsString()
  readonly complementStreet?: string;

  @IsString()
  readonly city!: string;

  @IsString()
  readonly state!: string;

  @IsString()
  readonly zipcode!: string;
}
