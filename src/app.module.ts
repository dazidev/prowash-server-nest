import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [PrismaModule, AuthModule, PublicModule],
})
export class AppModule {}
