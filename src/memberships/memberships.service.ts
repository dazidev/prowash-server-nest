import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client/client';
import {
  GetWebQuotesQueryDto,
  UpdateWebQuoteStatusDto,
} from 'src/public/dto/web-quotes.dto';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async getUserQuotes() {
    try {
      const quotes = await this.prisma.packageOrder.findMany({
        where: {
          purchaseStatus: 'PENDING_REVIEW',
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          name: true,
          initialPrice: true,
          finalPrice: true,
          range: true,
          purchaseStatus: true,
          services: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              lastname: true,
              email: true,
              phoneNumber: true,
            },
          },
          userHouse: {
            select: {
              id: true,
              name: true,
              street: true,
              complementStreet: true,
              city: true,
              state: true,
              zipcode: true,
            },
          },
        },
      });

      return quotes;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async getWebQuotes(query: GetWebQuotesQueryDto) {
    return this.prisma.webQuoteRequest.findMany({
      where: {
        status: query.status,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getWebQuote(id: string) {
    const quote = await this.prisma.webQuoteRequest.findUnique({
      where: { id },
    });

    if (!quote) {
      throw new NotFoundException('Web quote request not found');
    }

    return quote;
  }

  async updateWebQuoteStatus(
    id: string,
    updateWebQuoteStatusDto: UpdateWebQuoteStatusDto,
  ) {
    try {
      return await this.prisma.webQuoteRequest.update({
        where: { id },
        data: {
          status: updateWebQuoteStatusDto.status,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Web quote request not found');
      }

      throw error;
    }
  }

  private handleDBErrors(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      if (
        Array.isArray(error.meta?.target) &&
        error.meta?.target.includes('email')
      ) {
        throw new BadRequestException('Email already registered');
      }
      throw new BadRequestException('Insert fail');
    } else if (error instanceof Error) {
      throw new BadRequestException(error.message);
    }
    throw new InternalServerErrorException('Unknown error');
  }
}
