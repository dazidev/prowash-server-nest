import { Injectable, Logger } from '@nestjs/common';

import type { BatchResponse, Message } from 'firebase-admin/messaging';
import type { Prisma } from '../generated/prisma/client/client';

import { PrismaService } from '../prisma/prisma.service';
import { FirebaseAdminService } from '../infrastructure/services/firebase-admin.service';

import { QuotePushType } from './interfaces/quote-push.interface';
import type {
  QuotePushMessage,
  QuotePushResult,
} from './interfaces/quote-push.interface';

const MAX_BATCH_SIZE = 500;

const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

const QUOTE_NOTIFICATIONS: Record<
  QuotePushType,
  { title: string; body: string }
> = {
  [QuotePushType.APPOINTMENT_ASSIGNED]: {
    title: 'Appointment scheduled',
    body: 'Your appointment has been scheduled. Open ProWash365 to review the date and time.',
  },
  [QuotePushType.FINAL_PRICE_ASSIGNED]: {
    title: 'Your quote is ready',
    body: 'The final price has been assigned to your quote. Open ProWash365 to review it.',
  },
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {}

  async sendQuoteNotification(
    message: QuotePushMessage,
    excludedDeviceIds: string[] = [],
  ): Promise<QuotePushResult> {
    const result: QuotePushResult = {
      acceptedDeviceIds: [],
      retryDeviceIds: [],
      invalidDeviceIds: [],
      skippedDeviceIds: [],
    };

    const quoteWhere: Prisma.PackageOrderWhereInput = {
      id: message.quoteId,
      userId: message.userId,
    };

    if (message.type === QuotePushType.APPOINTMENT_ASSIGNED) {
      quoteWhere.appointmentAt = { not: null };
      quoteWhere.purchaseStatus = {
        in: ['ASSIGNED_APPOINTMENT', 'QUOTED', 'PAID'],
      };
    } else {
      quoteWhere.finalPrice = { not: null };
      quoteWhere.purchaseStatus = {
        in: ['QUOTED', 'PAID'],
      };
    }

    const quote = await this.prisma.packageOrder.findFirst({
      where: quoteWhere,
      select: { id: true },
    });

    if (!quote) {
      return result;
    }

    const eligibleWhere: Prisma.PushDeviceWhereInput = {
      userId: message.userId,
      isActive: true,
      platform: 'ANDROID',
      id: {
        notIn: excludedDeviceIds,
      },
      user: {
        status: 'ACTIVE',
        isEmailVerified: true,
      },
      session: {
        userId: message.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    };

    const candidates = await this.prisma.pushDevice.findMany({
      where: eligibleWhere,
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    for (let offset = 0; offset < candidates.length; offset += MAX_BATCH_SIZE) {
      const candidateIds = candidates
        .slice(offset, offset + MAX_BATCH_SIZE)
        .map((device) => device.id);

      const devices = await this.prisma.pushDevice.findMany({
        where: {
          ...eligibleWhere,
          id: { in: candidateIds },
          session: {
            userId: message.userId,
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
        },
        select: {
          id: true,
          fcmToken: true,
          sessionId: true,
          updatedAt: true,
        },
      });

      const activeIds = new Set(devices.map((device) => device.id));

      result.skippedDeviceIds.push(
        ...candidateIds.filter((id) => !activeIds.has(id)),
      );

      if (devices.length === 0) {
        continue;
      }

      let response: BatchResponse;

      try {
        response = await this.firebaseAdmin.getMessaging().sendEach(
          devices.map(
            (device): Message => ({
              token: device.fcmToken,
              notification: QUOTE_NOTIFICATIONS[message.type],
              data: {
                type: message.type,
                quoteId: message.quoteId,
                userId: message.userId,
                eventId: message.eventId,
              },
              android: {
                priority: 'high',
                notification: {
                  tag: message.eventId,
                },
              },
            }),
          ),
        );
      } catch (error: unknown) {
        this.logger.warn(`FCM batch failed: ${this.getErrorCode(error)}`);

        result.retryDeviceIds.push(...devices.map((device) => device.id));

        continue;
      }

      for (const [index, delivery] of response.responses.entries()) {
        const device = devices[index];

        if (delivery.success) {
          result.acceptedDeviceIds.push(device.id);
          continue;
        }

        const errorCode = this.getErrorCode(delivery.error);

        if (INVALID_TOKEN_CODES.has(errorCode)) {
          try {
            await this.prisma.pushDevice.updateMany({
              where: {
                id: device.id,
                userId: message.userId,
                sessionId: device.sessionId,
                fcmToken: device.fcmToken,
                updatedAt: device.updatedAt,
                isActive: true,
              },
              data: {
                isActive: false,
              },
            });

            result.invalidDeviceIds.push(device.id);
          } catch {
            this.logger.warn('Unable to deactivate an invalid push token.');

            result.retryDeviceIds.push(device.id);
          }

          continue;
        }

        this.logger.warn(`FCM delivery failed: ${errorCode}`);
        result.retryDeviceIds.push(device.id);
      }
    }

    return result;
  }

  private getErrorCode(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      return error.code;
    }

    return 'unknown';
  }
}
