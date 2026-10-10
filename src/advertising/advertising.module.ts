import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdvertisingController } from './advertising.controller';
import { AdvertisingService } from './advertising.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [AuthModule, PrismaModule, InfrastructureModule],
  controllers: [AdvertisingController],
  providers: [AdvertisingService],
})
export class AdvertisingModule {}
