import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateWebQuoteDto } from './dto/create-web-quote.dto';

const mapPackage = (r: any): object => ({
  id: r.id,
  name: r.name,
  services: (r.ServiceOnPackage ?? []).map((service: any) => ({
    id: service.id,
    serviceId: service.serviceId,
    name: service.service.name,
    amount: service.amount,
  })),
  prices: (r.PackagePrice ?? []).map((price: any) => ({
    id: price.id,
    price: price.price,
    name: price.range.description,
    unit: price.range.unit,
  })),
});

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getReviews() {
    try {
      const reviews = await this.prisma.review.findMany();

      if (!reviews) throw new Error('Reviews not found');

      return reviews;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async saveContact(createContactDto: CreateContactDto) {
    try {
      const { name, lastname, email, zipcode, phone, comments } =
        createContactDto;
      const contact = await this.prisma.contact.create({
        data: {
          name,
          lastname,
          email,
          zipcode,
          phone,
          comments,
          status: 'NOT_ATTENDED',
        },
      });

      if (!contact) throw new Error('Contact not saved');

      return;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async getContacts() {
    try {
      const contacts = await this.prisma.contact.findMany();

      if (!contacts) throw new Error('Contacts not found');

      return contacts;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async changeContactStatus(id: string) {
    try {
      const contact = await this.prisma.contact.findUnique({
        where: { id },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }

      const update = await this.prisma.contact.update({
        data: {
          status: 'ATTENDED',
        },
        where: { id },
      });

      if (!update) throw new Error('Contact not updated');

      return contact;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async deleteContact(id: string) {
    try {
      const contact = await this.prisma.contact.findUnique({
        where: { id },
      });

      if (!contact) {
        throw new NotFoundException('Contact not found');
      }

      const update = await this.prisma.contact.delete({
        where: { id },
      });

      if (!update) throw new Error('Contact not deleted');

      return;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async getPackages() {
    try {
      const packages = await this.prisma.package.findMany({
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

      const data = packages.map(mapPackage);

      return data;
    } catch (error: unknown) {
      this.handleDBErrors(error);
    }
  }

  async createWebQuote(createWebQuoteDto: CreateWebQuoteDto) {
    const {
      name,
      lastname,
      email,
      phone,
      zipcode,
      comments,
      packageId,
      packagePriceId,
    } = createWebQuoteDto;

    const selectedPrice = await this.prisma.packagePrice.findFirst({
      where: {
        id: packagePriceId,
        packageId,
      },
      select: {
        id: true,
        price: true,
        range: {
          select: {
            description: true,
            unit: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            ServiceOnPackage: {
              select: {
                serviceId: true,
                amount: true,
                service: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!selectedPrice) {
      throw new NotFoundException(
        'The selected package or price is no longer available.',
      );
    }

    const services = selectedPrice.package.ServiceOnPackage.map((item) => ({
      serviceId: item.serviceId,
      name: item.service.name,
      amount: item.amount,
    }));

    return this.prisma.webQuoteRequest.create({
      data: {
        name,
        lastname,
        email,
        phone,
        zipcode,
        comments,

        packageId: selectedPrice.package.id,
        packagePriceId: selectedPrice.id,

        packageName: selectedPrice.package.name,
        initialPrice: selectedPrice.price,
        rangeName: selectedPrice.range.description,
        rangeUnit: selectedPrice.range.unit,
        services,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });
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
