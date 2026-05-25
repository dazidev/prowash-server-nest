import { Controller, Get } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces';

@Auth(ValidRoles.admin)
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('quotes')
  getUserQuotes() {
    return this.membershipsService.getUserQuotes();
  }
}
