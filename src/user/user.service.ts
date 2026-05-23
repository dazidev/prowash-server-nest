import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserHouseDto } from './dto/create-user-house.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client/client';
import { AttachPhotoHouseDto } from './dto/attach-photo-house.dto';
import { R2Service } from 'src/infrastructure/services/r2.service';
import { CreatePackageOrderDto } from './dto/create-package-order.dto';

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
    houseId: string,
    attachPhotoHouseDto: AttachPhotoHouseDto,
  ) {
    try {
      const { key } = attachPhotoHouseDto;
      await this.r2Service.validateObjectExists(key);

      const exists = await this.prisma.userHouse.findUnique({
        where: { id: houseId },
      });

      if (!exists) throw new NotFoundException('House not found');

      const imageUrl = `${key}`;

      await this.prisma.userHouse.update({
        data: {
          imageUrl,
        },
        where: { id: houseId },
      });
      return;
    } catch (error: unknown) {
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

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
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
