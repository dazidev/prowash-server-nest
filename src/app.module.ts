import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PublicModule } from './public/public.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from '@nestjs/config';
import { CatalogModule } from './catalog/catalog.module';
import { UserModule } from './user/user.module';
import { MembershipsModule } from './memberships/memberships.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    PublicModule,
    AdminModule,
    CatalogModule,
    UserModule,
    MembershipsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
