import { IsEnum, IsOptional } from 'class-validator';
import { PackageOrderPurchaseStatus } from '../../generated/prisma/client/client';

export class GetUserQuotesQueryDto {
  @IsOptional()
  @IsEnum(PackageOrderPurchaseStatus)
  readonly purchaseStatus?: PackageOrderPurchaseStatus;
}

export class UpdateUserQuoteStatusDto {
  @IsEnum(PackageOrderPurchaseStatus)
  readonly purchaseStatus!: PackageOrderPurchaseStatus;
}
