import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/interfaces';
import { AdvertisingService } from './advertising.service';
import { CreateAdvertisingDto } from './dto/create-advertising.dto';
import { UploadAdvertisingImageDto } from './dto/upload-advertising-image.dto';
import { AttachAdvertisingImageDto } from './dto/attach-advertising-image.dto';
import { DeleteAdvertisingDto } from './dto/delete-advertising.dto';

@Controller('advertising')
export class AdvertisingController {
  constructor(private readonly advertisingService: AdvertisingService) {}

  @Get()
  findAll() {
    return this.advertisingService.findAll();
  }

  @Post('create')
  @Auth(ValidRoles.admin)
  create(@Body() dto: CreateAdvertisingDto) {
    return this.advertisingService.create(dto);
  }

  @Post(':id/upload/image')
  @Auth(ValidRoles.admin)
  createUploadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadAdvertisingImageDto,
  ) {
    return this.advertisingService.createUploadUrl(id, dto);
  }

  @Post(':id/image/attach')
  @Auth(ValidRoles.admin)
  attachImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachAdvertisingImageDto,
    @Query(
      'image',
      new ParseIntPipe({ optional: true }),
      new DefaultValuePipe(1),
    )
    position: number,
  ) {
    return this.advertisingService.attachImage(id, dto.key, position);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeleteAdvertisingDto,
  ) {
    return this.advertisingService.remove(id, dto?.keys ?? []);
  }
}
