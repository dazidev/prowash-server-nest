import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PackageOrderPurchaseStatus } from '../../generated/prisma/client/client';

export class GetUserQuotesQueryDto {
  @IsOptional()
  @IsEnum(PackageOrderPurchaseStatus)
  readonly purchaseStatus?: PackageOrderPurchaseStatus;
}

export class UpdateUserQuoteStatusDto {
  @IsEnum(PackageOrderPurchaseStatus)
  readonly purchaseStatus!: PackageOrderPurchaseStatus;

  @IsEnum(PackageOrderPurchaseStatus)
  readonly expectedPurchaseStatus!: PackageOrderPurchaseStatus;

  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/, {
    message: 'expectedUpdatedAt must include a time and timezone offset',
  })
  readonly expectedUpdatedAt!: string;
}

export class AssignUserQuoteAppointmentDto {
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/, {
    message: 'appointmentAt must include a time and timezone offset',
  })
  readonly appointmentAt!: string;

  @IsInt()
  @Min(0)
  readonly expectedAppointmentVersion!: number;
}

export class SetUserQuoteFinalPriceDto {
  @IsInt()
  @Min(0)
  @Max(2147483647)
  readonly finalPrice!: number;

  @IsInt()
  @Min(0)
  readonly expectedAppointmentVersion!: number;

  @ValidateIf((_object: unknown, value: unknown) => value !== null)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  readonly expectedFinalPrice!: number | null;
}
