import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (error.code === 'P2002') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: 'Email already registered',
        statusCode: 400,
      });
    }

    return response.status(HttpStatus.BAD_REQUEST).json({
      message: 'Database error',
      statusCode: 400,
    });
  }
}
