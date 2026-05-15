import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PublicModule } from './public/public.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PublicModule,
    AdminModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
