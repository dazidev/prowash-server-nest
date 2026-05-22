import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ServicesInOrderDto } from './services-in-order.dto';

export class CreatePackageOrderDto {
  @IsString()
  readonly name!: string;

  @IsNumber()
  readonly initialPrice!: number;

  @IsNumber()
  readonly range!: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ServicesInOrderDto)
  readonly services!: ServicesInOrderDto[];
}
