import { Injectable } from '@nestjs/common';

import { QuoteNotificationType } from '../generated/prisma/client/client';

import type { Prisma } from '../generated/prisma/client/client';

interface AppointmentNotificationQuote {
  id: string;
  userId: string;
  appointmentVersion: number;
  appointmentAt: Date | null;
}

interface FinalPriceNotificationQuote {
  id: string;
  userId: string;
  finalPriceVersion: number;
  finalPrice: number | null;
}

@Injectable()
export class QuoteNotificationOutboxService {
  async enqueueAppointment(
    tx: Prisma.TransactionClient,
    quote: AppointmentNotificationQuote,
  ): Promise<{ id: string }> {
    if (!quote.appointmentAt) {
      throw new Error(
        'An appointment notification requires an appointment date',
      );
    }

    return tx.quoteNotificationOutbox.upsert({
      where: {
        quoteId_type_version: {
          quoteId: quote.id,
          type: QuoteNotificationType.APPOINTMENT_ASSIGNED,
          version: quote.appointmentVersion,
        },
      },
      create: {
        userId: quote.userId,
        quoteId: quote.id,
        type: QuoteNotificationType.APPOINTMENT_ASSIGNED,
        version: quote.appointmentVersion,
        appointmentAt: quote.appointmentAt,
      },
      update: {},
      select: {
        id: true,
      },
    });
  }

  async enqueueFinalPrice(
    tx: Prisma.TransactionClient,
    quote: FinalPriceNotificationQuote,
  ): Promise<{ id: string }> {
    if (quote.finalPrice === null) {
      throw new Error('A final price notification requires a final price');
    }

    return tx.quoteNotificationOutbox.upsert({
      where: {
        quoteId_type_version: {
          quoteId: quote.id,
          type: QuoteNotificationType.FINAL_PRICE_ASSIGNED,
          version: quote.finalPriceVersion,
        },
      },
      create: {
        userId: quote.userId,
        quoteId: quote.id,
        type: QuoteNotificationType.FINAL_PRICE_ASSIGNED,
        version: quote.finalPriceVersion,
        finalPrice: quote.finalPrice,
      },
      update: {},
      select: {
        id: true,
      },
    });
  }
}
