import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PackageOrderPurchaseStatus,
  Prisma,
} from 'src/generated/prisma/client/client';
import {
  GetWebQuotesQueryDto,
  UpdateWebQuoteStatusDto,
} from 'src/public/dto/web-quotes.dto';
import {
  AssignUserQuoteAppointmentDto,
  GetUserQuotesQueryDto,
  SetUserQuoteFinalPriceDto,
  UpdateUserQuoteStatusDto,
} from './dto/user-quotes.dto';

const APPOINTMENT_TIME_ZONE = 'America/New_York';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async getUserQuotes(query: GetUserQuotesQueryDto) {
    try {
      const quotes = await this.prisma.packageOrder.findMany({
        where: {
          purchaseStatus: query.purchaseStatus,
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          name: true,
          initialPrice: true,
          finalPrice: true,
          range: true,
          purchaseStatus: true,
          services: true,
          appointmentAt: true,
          appointmentTimeZone: true,
          appointmentAcceptedAt: true,
          appointmentVersion: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              lastname: true,
              email: true,
              phoneNumber: true,
            },
          },
          userHouse: {
            select: {
              id: true,
              name: true,
              street: true,
              complementStreet: true,
              city: true,
              state: true,
              zipcode: true,
            },
          },
        },
      });

      return quotes;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async assignUserQuoteAppointment(
    id: string,
    dto: AssignUserQuoteAppointmentDto,
  ) {
    const appointmentAt = new Date(dto.appointmentAt);

    if (Number.isNaN(appointmentAt.getTime())) {
      throw new BadRequestException('Invalid appointment date');
    }

    const select = {
      id: true,
      purchaseStatus: true,
      appointmentAt: true,
      appointmentTimeZone: true,
      appointmentAcceptedAt: true,
      appointmentVersion: true,
      updatedAt: true,
    } satisfies Prisma.PackageOrderSelect;

    return this.prisma.$transaction(async (tx) => {
      const quote = await tx.packageOrder.findUnique({
        where: { id },
        select,
      });

      if (!quote) {
        throw new NotFoundException('App quote request not found');
      }

      if (quote.purchaseStatus === 'CANCELLED') {
        throw new BadRequestException(
          'Cannot assign an appointment to a cancelled quote',
        );
      }

      if (quote.appointmentVersion !== dto.expectedAppointmentVersion) {
        throw new ConflictException(
          'The appointment has changed. Refresh the quote and try again.',
        );
      }

      const sameDate =
        quote.appointmentAt?.getTime() === appointmentAt.getTime();

      const sameTimeZone = quote.appointmentTimeZone === APPOINTMENT_TIME_ZONE;

      if (
        sameDate &&
        quote.purchaseStatus === 'APPOINTMENT_RESCHEDULE_REQUESTED'
      ) {
        throw new BadRequestException(
          'Select a different date or time to resolve the reschedule request',
        );
      }

      if (
        sameDate &&
        sameTimeZone &&
        quote.purchaseStatus !== 'PENDING_REVIEW'
      ) {
        return quote;
      }

      const nextStatus =
        quote.purchaseStatus === 'QUOTED' || quote.purchaseStatus === 'PAID'
          ? quote.purchaseStatus
          : PackageOrderPurchaseStatus.ASSIGNED_APPOINTMENT;

      const result = await tx.packageOrder.updateMany({
        where: {
          id,
          appointmentVersion: dto.expectedAppointmentVersion,
          purchaseStatus: quote.purchaseStatus,
        },
        data: {
          appointmentAt,
          appointmentTimeZone: APPOINTMENT_TIME_ZONE,
          appointmentAcceptedAt: null,
          appointmentVersion: {
            increment: 1,
          },
          purchaseStatus: nextStatus,
        },
      });

      if (result.count !== 1) {
        throw new ConflictException(
          'The quote has changed. Refresh it and try again.',
        );
      }

      return tx.packageOrder.findUniqueOrThrow({
        where: { id },
        select,
      });
    });
  }

  async setUserQuoteFinalPrice(id: string, dto: SetUserQuoteFinalPriceDto) {
    const select = {
      id: true,
      initialPrice: true,
      finalPrice: true,
      purchaseStatus: true,
      appointmentAt: true,
      appointmentTimeZone: true,
      appointmentAcceptedAt: true,
      appointmentVersion: true,
      updatedAt: true,
    } satisfies Prisma.PackageOrderSelect;

    return this.prisma.$transaction(async (tx) => {
      const quote = await tx.packageOrder.findUnique({
        where: { id },
        select,
      });

      if (!quote) {
        throw new NotFoundException('App quote request not found');
      }

      if (
        quote.purchaseStatus === 'CANCELLED' ||
        quote.purchaseStatus === 'PAID'
      ) {
        throw new BadRequestException(
          'Cannot change the final price of a cancelled or paid quote',
        );
      }

      if (quote.purchaseStatus === 'APPOINTMENT_RESCHEDULE_REQUESTED') {
        throw new BadRequestException(
          'Assign a new appointment before setting the final price',
        );
      }

      if (
        quote.purchaseStatus !== 'ASSIGNED_APPOINTMENT' &&
        quote.purchaseStatus !== 'QUOTED'
      ) {
        throw new BadRequestException(
          'Assign an appointment before setting the final price',
        );
      }

      if (
        quote.purchaseStatus === 'ASSIGNED_APPOINTMENT' &&
        (!quote.appointmentAt || !quote.appointmentTimeZone)
      ) {
        throw new BadRequestException(
          'The appointment must have a date, time and timezone',
        );
      }

      if (
        quote.appointmentVersion !== dto.expectedAppointmentVersion ||
        quote.finalPrice !== dto.expectedFinalPrice
      ) {
        throw new ConflictException(
          'The quote has changed. Refresh it and try again.',
        );
      }

      if (
        quote.purchaseStatus === 'QUOTED' &&
        quote.finalPrice === dto.finalPrice
      ) {
        return quote;
      }

      const result = await tx.packageOrder.updateMany({
        where: {
          id,
          purchaseStatus: quote.purchaseStatus,
          appointmentVersion: dto.expectedAppointmentVersion,
          finalPrice: dto.expectedFinalPrice,
        },
        data: {
          finalPrice: dto.finalPrice,
          purchaseStatus: 'QUOTED',
        },
      });

      if (result.count !== 1) {
        throw new ConflictException(
          'The quote has changed. Refresh it and try again.',
        );
      }

      return tx.packageOrder.findUniqueOrThrow({
        where: { id },
        select,
      });
    });
  }

  async updateUserQuoteStatus(
    id: string,
    updateUserQuoteStatusDto: UpdateUserQuoteStatusDto,
  ) {
    const restrictedStatuses: PackageOrderPurchaseStatus[] = [
      PackageOrderPurchaseStatus.ASSIGNED_APPOINTMENT,
      PackageOrderPurchaseStatus.APPOINTMENT_RESCHEDULE_REQUESTED,
      PackageOrderPurchaseStatus.QUOTED,
    ];

    if (restrictedStatuses.includes(updateUserQuoteStatusDto.purchaseStatus)) {
      throw new BadRequestException(
        'Use the corresponding appointment, reschedule or final price action',
      );
    }

    try {
      return await this.prisma.packageOrder.update({
        where: { id },
        data: {
          purchaseStatus: updateUserQuoteStatusDto.purchaseStatus,
        },
        select: {
          id: true,
          purchaseStatus: true,
          updatedAt: true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('App quote request not found');
      }

      throw error;
    }
  }

  async getWebQuotes(query: GetWebQuotesQueryDto) {
    return this.prisma.webQuoteRequest.findMany({
      where: {
        status: query.status,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getWebQuote(id: string) {
    const quote = await this.prisma.webQuoteRequest.findUnique({
      where: { id },
    });

    if (!quote) {
      throw new NotFoundException('Web quote request not found');
    }

    return quote;
  }

  async updateWebQuoteStatus(
    id: string,
    updateWebQuoteStatusDto: UpdateWebQuoteStatusDto,
  ) {
    try {
      return await this.prisma.webQuoteRequest.update({
        where: { id },
        data: {
          status: updateWebQuoteStatusDto.status,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Web quote request not found');
      }

      throw error;
    }
  }

  private handleDBErrors(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      if (
        Array.isArray(error.meta?.target) &&
        error.meta?.target.includes('email')
      ) {
        throw new BadRequestException('Email already registered');
      }
      throw new BadRequestException('Insert fail');
    } else if (error instanceof Error) {
      throw new BadRequestException(error.message);
    }
    throw new InternalServerErrorException('Unknown error');
  }
}
