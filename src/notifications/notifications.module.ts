import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { NotificationsService } from './notifications.service';
import { QuoteNotificationOutboxService } from './quote-notification-outbox.service';
import { QuoteNotificationWorkerService } from './quote-notification-worker.service';

@Module({
  imports: [PrismaModule, InfrastructureModule],
  providers: [
    NotificationsService,
    QuoteNotificationOutboxService,
    QuoteNotificationWorkerService,
  ],
  exports: [NotificationsService, QuoteNotificationOutboxService],
})
export class NotificationsModule {}
