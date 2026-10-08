import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserHouseDto } from './dto/create-user-house.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client/client';
import { AttachPhotoHouseDto } from './dto/attach-photo-house.dto';
import { R2Service } from 'src/infrastructure/services/r2.service';
import { CreatePackageOrderDto } from './dto/create-package-order.dto';
import {
  RespondUserQuoteDto,
  UserQuoteResponseAction,
} from './dto/respond-user-quote.dto';
import { RegisterPushDeviceDto } from './dto/register-push-device.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly r2Service: R2Service,
  ) {}

  async createUserHouse(
    userId: string,
    createUserHouseDto: CreateUserHouseDto,
  ) {
    try {
      const { name, street, complementStreet, city, state, zipcode } =
        createUserHouseDto;

      const house = await this.prisma.userHouse.create({
        data: {
          name,
          street,
          complementStreet,
          city,
          state,
          zipcode,
          userId,
        },
      });

      return house;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async getUserHouses(userId: string) {
    try {
      const houses = await this.prisma.userHouse.findMany({
        where: { userId },
      });

      return houses;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async attachPhotoUserHouse(
    userId: string,
    houseId: string,
    attachPhotoHouseDto: AttachPhotoHouseDto,
  ) {
    try {
      const house = await this.prisma.userHouse.findUnique({
        where: { id: houseId, userId },
        select: { id: true },
      });

      if (!house) {
        throw new NotFoundException('House not found');
      }

      const { key } = attachPhotoHouseDto;
      const keyPrefix = `houses/images/${userId}/`;

      if (!key.startsWith(keyPrefix) || key.length === keyPrefix.length) {
        throw new BadRequestException('Invalid image key');
      }

      await this.r2Service.validateObjectExists(key);

      const result = await this.prisma.userHouse.updateMany({
        where: { id: houseId, userId },
        data: { imageUrl: key },
      });

      if (result.count !== 1) {
        throw new NotFoundException('House not found');
      }
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.handleDBErrors(error);
    }
  }

  async deleteUserHouse(houseId: string, userId: string) {
    try {
      const deleteHouse = await this.prisma.userHouse.delete({
        where: { id: houseId, userId },
        select: { imageUrl: true },
      });

      if (deleteHouse.imageUrl) {
        await this.r2Service.deleteByKey(deleteHouse.imageUrl);
      }
      return;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async createPackageOrder(
    userId: string,
    houseId: string,
    createPackageOrderDto: CreatePackageOrderDto,
  ) {
    try {
      const { packageId, initialPrice, range } = createPackageOrderDto;

      const house = await this.prisma.userHouse.findUnique({
        where: { id: houseId, userId },
      });

      if (!house) throw new NotFoundException('House not found');

      const packageInfo = await this.prisma.package.findUnique({
        where: { id: packageId },
        select: {
          name: true,
          ServiceOnPackage: {
            select: {
              amount: true,
              service: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!packageInfo) throw new NotFoundException('Package not found');

      const servicesSnapshot = packageInfo.ServiceOnPackage.map((item) => ({
        name: item.service.name,
        quantity: item.amount,
      }));

      const order = await this.prisma.packageOrder.create({
        data: {
          name: packageInfo.name,
          initialPrice,
          range,
          userId,
          houseId,
          services: servicesSnapshot,
        },
      });

      return order;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async getUserQuotes(userId: string) {
    try {
      const quotes = await this.prisma.packageOrder.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          initialPrice: true,
          finalPrice: true,
          range: true,
          purchaseStatus: true,
          services: true,
          appointmentAt: true,
          appointmentTimeZone: true,
          appointmentAcceptedAt: true,
          appointmentVersion: true,
          createdAt: true,
          updatedAt: true,
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

  async respondUserQuote(
    userId: string,
    quoteId: string,
    dto: RespondUserQuoteDto,
  ) {
    const select = {
      id: true,
      purchaseStatus: true,
      appointmentAt: true,
      appointmentTimeZone: true,
      appointmentAcceptedAt: true,
      appointmentVersion: true,
      updatedAt: true,
    } satisfies Prisma.PackageOrderSelect;

    return this.prisma.$transaction(async (tx) => {
      const quote = await tx.packageOrder.findFirst({
        where: {
          id: quoteId,
          userId,
        },
        select,
      });

      if (!quote) {
        throw new NotFoundException('App quote request not found');
      }

      if (quote.appointmentVersion !== dto.expectedAppointmentVersion) {
        throw new ConflictException(
          'The appointment has changed. Refresh the quote and try again.',
        );
      }

      if (quote.purchaseStatus === 'CANCELLED') {
        if (dto.action === UserQuoteResponseAction.CANCEL_QUOTE) {
          return quote;
        }

        throw new BadRequestException('This quote has been cancelled');
      }

      let data: Prisma.PackageOrderUpdateManyMutationInput;

      switch (dto.action) {
        case UserQuoteResponseAction.ACCEPT_APPOINTMENT: {
          const canAccept =
            quote.purchaseStatus === 'ASSIGNED_APPOINTMENT' ||
            quote.purchaseStatus === 'QUOTED' ||
            quote.purchaseStatus === 'PAID';

          if (
            !canAccept ||
            !quote.appointmentAt ||
            !quote.appointmentTimeZone
          ) {
            throw new BadRequestException(
              'There is no assigned appointment available to accept',
            );
          }

          if (quote.appointmentAcceptedAt) {
            return quote;
          }

          data = {
            appointmentAcceptedAt: new Date(),
          };

          break;
        }

        case UserQuoteResponseAction.REQUEST_RESCHEDULE: {
          if (quote.purchaseStatus === 'APPOINTMENT_RESCHEDULE_REQUESTED') {
            return quote;
          }

          if (
            quote.purchaseStatus !== 'ASSIGNED_APPOINTMENT' ||
            !quote.appointmentAt ||
            !quote.appointmentTimeZone
          ) {
            throw new BadRequestException(
              'There is no assigned appointment available to reschedule',
            );
          }

          data = {
            purchaseStatus: 'APPOINTMENT_RESCHEDULE_REQUESTED',
            appointmentAcceptedAt: null,
          };

          break;
        }

        case UserQuoteResponseAction.CANCEL_QUOTE: {
          if (quote.purchaseStatus === 'PAID') {
            throw new BadRequestException(
              'A paid order cannot be cancelled through the quote flow',
            );
          }

          data = {
            purchaseStatus: 'CANCELLED',
            appointmentAcceptedAt: null,
          };

          break;
        }

        default:
          throw new BadRequestException('Invalid quote response action');
      }

      const result = await tx.packageOrder.updateMany({
        where: {
          id: quoteId,
          userId,
          appointmentVersion: dto.expectedAppointmentVersion,
          purchaseStatus: quote.purchaseStatus,
          appointmentAcceptedAt: quote.appointmentAcceptedAt,
        },
        data,
      });

      if (result.count !== 1) {
        throw new ConflictException(
          'The quote has changed. Refresh it and try again.',
        );
      }

      return tx.packageOrder.findFirstOrThrow({
        where: {
          id: quoteId,
          userId,
        },
        select,
      });
    });
  }

  async registerPushDevice(
    userId: string,
    sessionId: string | undefined,
    dto: RegisterPushDeviceDto,
  ) {
    if (!sessionId) {
      throw new UnauthorizedException(
        'Refresh your access token or sign in again',
      );
    }

    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const session = await tx.userSession.findFirst({
              where: {
                id: sessionId,
                userId,
                isRevoked: false,
                expiresAt: {
                  gt: new Date(),
                },
                user: {
                  status: 'ACTIVE',
                },
              },
              select: {
                id: true,
                deviceId: true,
                createdAt: true,
              },
            });

            if (!session) {
              throw new UnauthorizedException('Session expired or revoked');
            }

            const existingDevice = await tx.pushDevice.findUnique({
              where: {
                deviceId: session.deviceId,
              },
              select: {
                sessionId: true,
                session: {
                  select: {
                    createdAt: true,
                  },
                },
              },
            });

            if (
              existingDevice &&
              existingDevice.sessionId !== session.id &&
              existingDevice.session.createdAt > session.createdAt
            ) {
              throw new ConflictException(
                'A newer session already registered this device',
              );
            }

            const data = {
              deviceId: session.deviceId,
              fcmToken: dto.fcmToken,
              platform: dto.platform,
              userId,
              sessionId: session.id,
              isActive: true,
              lastSeenAt: new Date(),
            };

            return tx.pushDevice.upsert({
              where: {
                deviceId: session.deviceId,
              },
              create: data,
              update: data,
              select: {
                id: true,
                deviceId: true,
                platform: true,
                isActive: true,
                lastSeenAt: true,
                updatedAt: true,
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error: unknown) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2034' || error.code === 'P2002');

        if (retryable && attempt < maxAttempts - 1) {
          continue;
        }

        if (retryable) {
          throw new ConflictException(
            'Unable to register the device. Please try again.',
          );
        }

        throw error;
      }
    }

    throw new ConflictException('Unable to register the device');
  }

  async deactivatePushDevice(userId: string, sessionId: string | undefined) {
    if (!sessionId) {
      throw new UnauthorizedException(
        'Refresh your access token or sign in again',
      );
    }

    await this.prisma.pushDevice.updateMany({
      where: {
        userId,
        sessionId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    return {
      deactivated: true,
    };
  }

  private handleDBErrors(error): never {
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
