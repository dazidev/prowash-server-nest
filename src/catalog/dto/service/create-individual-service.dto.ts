import { IsNumber, IsString } from 'class-validator';

export class CreateIndividualServiceDto {
  @IsString()
  readonly serviceId!: string;

  @IsNumber()
  readonly initialPrice!: number;
}
