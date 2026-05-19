import {
  ArrayMinSize,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ServiceDto } from './service.dto';
import { Type } from 'class-transformer';
import { RangeDto } from './range.dto';

export class CreatePackageDto {
  @IsString()
  readonly name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  readonly services!: ServiceDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RangeDto)
  readonly ranges!: RangeDto[];
}
