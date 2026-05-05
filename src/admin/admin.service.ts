import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  create(createAdminDto: CreateAdminDto) {
    return 'This action adds a new admin';
  }

  async findAll() {
    const admins = await this.prisma.user.findMany({
      where: { roles: { has: 'ADMIN' } },
      omit: {
        password: true,
      },
    });

    if (admins.length === 0) throw new NotFoundException('Admins not found');

    return admins;
  }

  findOne(id: number) {
    return `This action returns a #${id} admin`;
  }

  update(id: number, updateAdminDto: UpdateAdminDto) {
    return `This action updates a #${id} admin`;
  }

  remove(id: number) {
    return `This action removes a #${id} admin`;
  }
}
