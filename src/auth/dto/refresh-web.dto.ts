import { IsString } from 'class-validator';

export class RefreshWebDto {
  @IsString()
  readonly refreshToken!: string;
}
