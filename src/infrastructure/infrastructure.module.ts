import { Module } from '@nestjs/common';
import { BrevoService } from './services/brevo.service';
import { R2Service } from './services/r2.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [BrevoService, R2Service],
  exports: [BrevoService, R2Service],
})
export class InfrastructureModule {}
