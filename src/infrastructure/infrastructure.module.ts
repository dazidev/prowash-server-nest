import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { BrevoService } from './services/brevo.service';
import { R2Service } from './services/r2.service';
import { FirebaseAdminService } from './services/firebase-admin.service';

@Module({
  imports: [ConfigModule],
  providers: [BrevoService, R2Service, FirebaseAdminService],
  exports: [BrevoService, R2Service, FirebaseAdminService],
})
export class InfrastructureModule {}
