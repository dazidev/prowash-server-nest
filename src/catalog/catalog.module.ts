import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService],
  imports: [AuthModule, PrismaModule]
})
export class CatalogModule {}
