import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [PublicController],
  providers: [PublicService],
  imports: [PrismaModule],
})
export class PublicModule {}
