import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  controllers: [MembershipsController],
  providers: [MembershipsService],
  imports: [PrismaModule, AuthModule, NotificationsModule],
})
export class MembershipsModule {}
