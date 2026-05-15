import { Module } from "@nestjs/common";
import { BrevoService } from "./services/brevo.service";

@Module({
  providers: [BrevoService],
  exports: [BrevoService],
})
export class InfrastructureModule {}