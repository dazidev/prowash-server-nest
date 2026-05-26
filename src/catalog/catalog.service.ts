import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateIndividualServiceDto,
  CreatePackageDto,
  CreatePackageRangeDto,
  CreatePackageServiceDto,
  UpdatePackageRangeDto,
  UpdatePackageServiceDto,
} from './dto';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  //* PACKAGE SERVICES
  async createPackageService(createPackageServiceDto: CreatePackageServiceDto) {
    try {
      const { name } = createPackageServiceDto;

      const service = await this.prisma.packageService.create({
        data: { name },
      });

      return service;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async getPackageServices() {
    try {
      const services = await this.prisma.packageService.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return services;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async updatePackageService(
    id: string,
    updatePackageServiceDto: UpdatePackageServiceDto,
  ) {
    try {
      const { name } = updatePackageServiceDto;

      const service = await this.prisma.packageService.update({
        data: { name },
        where: { id },
      });

      return service;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async deletePackageService(id: string) {
    try {
      await this.prisma.packageService.delete({ where: { id } });
      return;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  //*PACKAGE RANGES
  async getPackageRanges() {
    try {
      const ranges = await this.prisma.packageRange.findMany({
        orderBy: {
          description: 'asc',
        },
      });

      return ranges;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async createPackageRange(createPackageRangeDto: CreatePackageRangeDto) {
    try {
      const { description, unit } = createPackageRangeDto;

      const range = await this.prisma.packageRange.create({
        data: { description, unit },
      });

      return range;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async updatePackageRange(
    id: string,
    updatePackageRangeDto: UpdatePackageRangeDto,
  ) {
    try {
      const { description, unit } = updatePackageRangeDto;

      const range = await this.prisma.packageRange.update({
        data: { description, unit },
        where: { id },
      });

      return range;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async deletePackageRange(id: string) {
    try {
      await this.prisma.packageRange.delete({ where: { id } });
      return;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  //* PACKAGES

  async getPackages() {
    try {
      const packages = await this.prisma.package.findMany({
        include: {
          ServiceOnPackage: true,
          PackagePrice: true,
        },
      });

      return packages;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async createPackage(createPackageDto: CreatePackageDto) {
    const { name, services, ranges } = createPackageDto;
    try {
      const serviceIds = services.map((service) => service.serviceId);
      const rangeIds = ranges.map((range) => range.rangeId);

      const existingServices = await this.prisma.packageService.findMany({
        select: {
          id: true,
        },
        where: {
          id: {
            in: serviceIds,
          },
        },
      });

      const existingRanges = await this.prisma.packageRange.findMany({
        select: {
          id: true,
        },
        where: {
          id: {
            in: rangeIds,
          },
        },
      });

      if (existingServices.length !== serviceIds.length) {
        throw new Error('One or more services do not exist');
      }

      if (existingRanges.length !== rangeIds.length) {
        throw new Error('One or more ranges do not exist');
      }

      const packageResult = await this.prisma.package.create({
        data: {
          name,
          ServiceOnPackage: {
            create: services.map((service) => ({
              serviceId: service.serviceId,
              amount: service.amount,
            })),
          },
          PackagePrice: {
            create: ranges.map((range) => ({
              rangeId: range.rangeId,
              price: range.price,
            })),
          },
        },
        include: {
          ServiceOnPackage: {
            include: {
              service: true,
            },
          },
          PackagePrice: {
            include: {
              range: true,
            },
          },
        },
      });

      return packageResult;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async deletePackage(id: string) {
    try {
      await this.prisma.package.delete({ where: { id } });
      return;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  //* INDIVIDUAL SERVICES

  async getIndividualServices() {
    try {
      const services = await this.prisma.individualService.findMany({
        select: {
          id: true,
          initialPrice: true,
          service: {
            select: {
              name: true,
            },
          },
        },
      });

      return services;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async createIndividualService(
    createIndividualServiceDto: CreateIndividualServiceDto,
  ) {
    try {
      const { serviceId, initialPrice } = createIndividualServiceDto;

      const individualService = await this.prisma.individualService.create({
        data: {
          serviceId,
          initialPrice,
        },
      });

      return individualService;
    } catch (error: unknown) {
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
