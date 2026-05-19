import { IsString } from "class-validator";

export class CreatePackageServiceDto {

  @IsString()
  readonly name!: string;
}