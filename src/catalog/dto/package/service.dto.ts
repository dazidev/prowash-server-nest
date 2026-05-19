import { IsNumber, IsUUID, Min } from 'class-validator';

export class ServiceDto {
  @IsUUID()
  readonly serviceId!: string;

  @IsNumber()
  @Min(0)
  readonly amount!: number;
}
