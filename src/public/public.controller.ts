import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  Delete,
} from '@nestjs/common';
import { PublicService } from './public.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('reviews')
  getReviews() {
    return this.publicService.getReviews();
  }

  @Post('contact')
  saveContact(@Body() createContactDto: CreateContactDto) {
    return this.publicService.saveContact(createContactDto);
  }

  @Get('contacts')
  @Auth(ValidRoles.mod, ValidRoles.admin)
  getContacts() {
    return this.publicService.getContacts();
  }

  @Patch('contact/:id/status')
  @Auth(ValidRoles.mod, ValidRoles.admin)
  changeContactStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.publicService.changeContactStatus(id);
  }

  @Delete('contact/:id')
  @Auth(ValidRoles.mod, ValidRoles.admin)
  deleteContact(@Param('id', ParseUUIDPipe) id: string) {
    return this.publicService.deleteContact(id);
  }
}
