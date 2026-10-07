import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces';
import {
  GetWebQuotesQueryDto,
  UpdateWebQuoteStatusDto,
} from 'src/public/dto/web-quotes.dto';

@Auth(ValidRoles.admin)
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('quotes')
  getUserQuotes() {
    return this.membershipsService.getUserQuotes();
  }

  @Get('web-quotes')
  @Auth(ValidRoles.admin)
  getWebQuotes(@Query() query: GetWebQuotesQueryDto) {
    return this.membershipsService.getWebQuotes(query);
  }

  @Get('web-quotes/:id')
  @Auth(ValidRoles.admin)
  getWebQuote(@Param('id', ParseUUIDPipe) id: string) {
    return this.membershipsService.getWebQuote(id);
  }

  @Patch('web-quotes/:id/status')
  @Auth(ValidRoles.admin)
  updateWebQuoteStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWebQuoteStatusDto: UpdateWebQuoteStatusDto,
  ) {
    return this.membershipsService.updateWebQuoteStatus(
      id,
      updateWebQuoteStatusDto,
    );
  }
}
