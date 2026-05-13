import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { PrismaService } from 'src/prisma/prisma.service';

import * as bcrypt from 'bcrypt';
import { Prisma, UserRole } from '../generated/prisma/client/client';
import { UpdateAdminPasswordDto } from './dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async create(createAdminDto: CreateAdminDto) {
    try {
      const { name, lastname, email, password, roles } = createAdminDto;

      const hashedPassword = await bcrypt.hash(password, 10);

      console.log(createAdminDto);

      const admin = await this.prisma.user.create({
        data: {
          name,
          lastname,
          email,
          password: hashedPassword,
          roles: [roles],
        },
      });

      return admin;
    } catch (error) {
      console.log(error);
      this.handleDBErrors(error);
    }
  }

  async findAll() {
    const admins = await this.prisma.user.findMany({
      where: { roles: { hasSome: [UserRole.ADMIN, UserRole.MOD] } },
      omit: {
        password: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    if (admins.length === 0) throw new NotFoundException('Admins not found');

    return admins;
  }

  async updatePassword(
    id: string,
    updateAdminPasswordDto: UpdateAdminPasswordDto,
  ) {
    const { password } = updateAdminPasswordDto;

    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
      await this.prisma.user.update({
        data: {
          password: hashedPassword,
        },
        where: { id },
      });

      return;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} admin`;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto) {
    const { name, lastname, email, roles } = updateAdminDto;
    try {
      await this.prisma.user.update({
        data: {
          name,
          lastname,
          email,
          roles: [roles],
        },
        where: { id },
      });

      return;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return;
    } catch (error) {
      this.handleDBErrors(error);
    }
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
