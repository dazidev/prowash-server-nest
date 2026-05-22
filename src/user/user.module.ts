import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [AuthModule, PrismaModule, InfrastructureModule],
})
export class UserModule {}
