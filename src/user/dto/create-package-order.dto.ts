import { IsNumber, IsUUID } from 'class-validator';

export class CreatePackageOrderDto {
  @IsUUID()
  readonly packageId!: string;

  @IsNumber()
  readonly initialPrice!: number;

  @IsNumber()
  readonly range!: number;
}
