import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;

        if (Array.isArray(target) && target.includes('email')) {
          throw new BadRequestException('Email already registered');
        }

        throw new BadRequestException('Unique constraint failed');
      }
    }

    if (error instanceof Error) {
      throw new BadRequestException(error.message);
    }

    throw new InternalServerErrorException('Unknown error');
  }
}
