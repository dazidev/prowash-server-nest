import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [MembershipsController],
  providers: [MembershipsService],
  imports: [PrismaModule, AuthModule],
})
export class MembershipsModule {}
