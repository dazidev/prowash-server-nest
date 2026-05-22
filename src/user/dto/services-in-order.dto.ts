import { IsNumber, IsString } from 'class-validator';

export class ServicesInOrderDto {
  @IsString()
  readonly name!: string;

  @IsNumber()
  readonly quantity!: number;
}
