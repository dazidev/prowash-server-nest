import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

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
