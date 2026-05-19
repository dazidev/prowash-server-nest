import { IsNumber, IsUUID, Min } from 'class-validator';

export class RangeDto {
  @IsUUID()
  readonly rangeId!: string;

  @IsNumber()
  @Min(0)
  readonly price!: number;
}
