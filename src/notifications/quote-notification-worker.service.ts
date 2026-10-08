import { Injectable, Logger } from '@nestjs/common';
import type { OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import { QuoteNotificationType } from '../generated/prisma/client/client';

import type {
  Prisma,
  QuoteNotificationOutbox,
} from '../generated/prisma/client/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { QuotePushType } from './interfaces/quote-push.interface';

const POLL_INTERVAL_MS = 5_000;
const LEASE_DURATION_MS = 5 * 60_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

const MAX_ATTEMPTS = 6;
const EVENTS_PER_CYCLE = 10;

@Injectable()
export class QuoteNotificationWorkerService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(QuoteNotificationWorkerService.name);

  private timer?: ReturnType<typeof setInterval>;
  private currentRun?: Promise<void>;
  private stopping = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushNotifications: NotificationsService,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => this.startCycle(), POLL_INTERVAL_MS);

    this.startCycle();
  }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true;

    if (this.timer) {
      clearInterval(this.timer);
    }

    await this.currentRun;
  }

  private startCycle(): void {
    if (this.stopping || this.currentRun) {
      return;
    }

    const task = this.processPending().catch(() => {
      this.logger.error('Unable to process pending quote notifications.');
    });

    this.currentRun = task;

    void task.then(() => {
      if (this.currentRun === task) {
        this.currentRun = undefined;
      }
    });
  }

  private readyWhere(now: Date): Prisma.QuoteNotificationOutboxWhereInput {
    return {
      OR: [
        {
          status: 'PENDING',
          availableAt: { lte: now },
        },
        {
          status: 'PROCESSING',
          lockedUntil: { lte: now },
        },
      ],
    };
  }

  private ownedWhere(
    id: string,
    lockToken: string,
  ): Prisma.QuoteNotificationOutboxWhereInput {
    return {
      id,
      status: 'PROCESSING',
      lockToken,
      lockedUntil: { gt: new Date() },
    };
  }

  private async processPending(): Promise<void> {
    const candidates = await this.prisma.quoteNotificationOutbox.findMany({
      where: this.readyWhere(new Date()),
      orderBy: [{ availableAt: 'asc' }, { createdAt: 'asc' }],
      take: EVENTS_PER_CYCLE,
      select: { id: true },
    });

    for (const candidate of candidates) {
      if (this.stopping) {
        break;
      }

      const lockToken = randomUUID();

      const claimed = await this.prisma.quoteNotificationOutbox.updateMany({
        where: {
          id: candidate.id,
          ...this.readyWhere(new Date()),
        },
        data: {
          status: 'PROCESSING',
          lockToken,
          lockedUntil: new Date(Date.now() + LEASE_DURATION_MS),
          attempts: { increment: 1 },
        },
      });

      if (claimed.count !== 1) {
        continue;
      }

      const event = await this.prisma.quoteNotificationOutbox.findFirst({
        where: {
          id: candidate.id,
          lockToken,
          status: 'PROCESSING',
        },
      });

      if (event) {
        await this.processEvent(event, lockToken);
      }
    }
  }

  private async processEvent(
    event: QuoteNotificationOutbox,
    lockToken: string,
  ): Promise<void> {
    let leaseLost = false;
    let outdated = false;
    let interrupted = false;

    let completedDeviceIds = event.completedDeviceIds;
    let renewing: Promise<void> | undefined;

    const renewLease = async (): Promise<void> => {
      const result = await this.prisma.quoteNotificationOutbox.updateMany({
        where: this.ownedWhere(event.id, lockToken),
        data: {
          lockedUntil: new Date(Date.now() + LEASE_DURATION_MS),
        },
      });

      if (result.count !== 1) {
        leaseLost = true;
      }
    };

    const heartbeat = setInterval(() => {
      if (renewing || leaseLost) {
        return;
      }

      renewing = renewLease()
        .catch(() => {
          leaseLost = true;
        })
        .finally(() => {
          renewing = undefined;
        });
    }, HEARTBEAT_INTERVAL_MS);

    try {
      if (!(await this.isCurrent(event))) {
        await this.save(event.id, lockToken, {
          status: 'SKIPPED',
          completedAt: new Date(),
          lastError: 'OUTDATED_QUOTE_NOTIFICATION',
        });

        return;
      }

      if (event.attempts > MAX_ATTEMPTS) {
        await this.save(event.id, lockToken, {
          status: 'FAILED',
          completedAt: new Date(),
          lastError: 'RETRY_LIMIT_REACHED',
        });

        return;
      }

      const result = await this.pushNotifications.sendQuoteNotification(
        {
          eventId: event.id,
          userId: event.userId,
          quoteId: event.quoteId,
          type:
            event.type === QuoteNotificationType.APPOINTMENT_ASSIGNED
              ? QuotePushType.APPOINTMENT_ASSIGNED
              : QuotePushType.FINAL_PRICE_ASSIGNED,
        },
        completedDeviceIds,
        async () => {
          if (this.stopping) {
            interrupted = true;
            return false;
          }

          if (leaseLost) {
            return false;
          }

          await renewLease();

          if (leaseLost) {
            return false;
          }

          outdated = !(await this.isCurrent(event));

          return !outdated;
        },
      );

      completedDeviceIds = [
        ...new Set([...completedDeviceIds, ...result.acceptedDeviceIds]),
      ];

      if (leaseLost) {
        return;
      }

      if (outdated || !(await this.isCurrent(event))) {
        await this.save(event.id, lockToken, {
          status: 'SKIPPED',
          completedDeviceIds,
          completedAt: new Date(),
          lastError: 'OUTDATED_QUOTE_NOTIFICATION',
        });

        return;
      }

      if (result.hasPermanentFailure) {
        await this.save(event.id, lockToken, {
          status: 'FAILED',
          completedDeviceIds,
          completedAt: new Date(),
          lastError: 'FCM_PERMANENT_ERROR',
        });

        return;
      }

      if (interrupted || result.retryDeviceIds.length > 0) {
        await this.scheduleRetry(
          event,
          lockToken,
          completedDeviceIds,
          interrupted ? 'WORKER_SHUTTING_DOWN' : 'FCM_RETRY_REQUIRED',
        );

        return;
      }

      const hasAcceptedDevices = completedDeviceIds.length > 0;

      await this.save(event.id, lockToken, {
        status: hasAcceptedDevices ? 'SENT' : 'SKIPPED',
        completedDeviceIds,
        completedAt: new Date(),
        lastError: hasAcceptedDevices ? null : 'NO_ELIGIBLE_DEVICE',
      });
    } catch (error: unknown) {
      if (!leaseLost) {
        await this.scheduleRetry(
          event,
          lockToken,
          completedDeviceIds,
          this.getErrorCode(error),
        );
      }
    } finally {
      clearInterval(heartbeat);
      await renewing;
    }
  }

  private async isCurrent(event: QuoteNotificationOutbox): Promise<boolean> {
    const where: Prisma.PackageOrderWhereInput = {
      id: event.quoteId,
      userId: event.userId,
    };

    if (event.type === QuoteNotificationType.APPOINTMENT_ASSIGNED) {
      if (!event.appointmentAt) {
        return false;
      }

      where.appointmentVersion = event.version;
      where.appointmentAt = event.appointmentAt;
      where.purchaseStatus = {
        in: ['ASSIGNED_APPOINTMENT', 'QUOTED', 'PAID'],
      };
    } else {
      if (event.finalPrice === null) {
        return false;
      }

      where.finalPriceVersion = event.version;
      where.finalPrice = event.finalPrice;
      where.purchaseStatus = {
        in: ['QUOTED', 'PAID'],
      };
    }

    const quote = await this.prisma.packageOrder.findFirst({
      where,
      select: { id: true },
    });

    return quote !== null;
  }

  private async scheduleRetry(
    event: QuoteNotificationOutbox,
    lockToken: string,
    completedDeviceIds: string[],
    reason: string,
  ): Promise<void> {
    const exhausted = event.attempts >= MAX_ATTEMPTS;

    const baseDelay = Math.min(60_000 * 2 ** (event.attempts - 1), 30 * 60_000);

    const jitter = Math.floor(Math.random() * 10_000);

    await this.save(event.id, lockToken, {
      status: exhausted ? 'FAILED' : 'PENDING',
      completedDeviceIds,
      availableAt: new Date(Date.now() + baseDelay + jitter),
      completedAt: exhausted ? new Date() : null,
      lastError: exhausted ? 'RETRY_LIMIT_REACHED' : reason.slice(0, 256),
    });
  }

  private async save(
    id: string,
    lockToken: string,
    data: Prisma.QuoteNotificationOutboxUpdateManyMutationInput,
  ): Promise<void> {
    await this.prisma.quoteNotificationOutbox.updateMany({
      where: this.ownedWhere(id, lockToken),
      data: {
        ...data,
        lockToken: null,
        lockedUntil: null,
      },
    });
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

    return 'OUTBOX_PROCESSING_ERROR';
  }
}
