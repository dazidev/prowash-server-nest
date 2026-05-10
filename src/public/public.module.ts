import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [PublicController],
  providers: [PublicService],
  imports: [PrismaModule, AuthModule],
})
export class PublicModule {}
