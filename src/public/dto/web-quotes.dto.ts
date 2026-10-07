import { IsEnum, IsOptional } from 'class-validator';
import { WebQuoteRequestStatus } from '../../generated/prisma/client/client';

export class GetWebQuotesQueryDto {
  @IsOptional()
  @IsEnum(WebQuoteRequestStatus)
  readonly status?: WebQuoteRequestStatus;
}

export class UpdateWebQuoteStatusDto {
  @IsEnum(WebQuoteRequestStatus)
  readonly status!: WebQuoteRequestStatus;
}
