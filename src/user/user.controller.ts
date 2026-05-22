import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUploadSignDto } from './dto/create-upload-sign.dto';
import { R2Service } from 'src/infrastructure/services/r2.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateUserHouseDto } from './dto/create-user-house.dto';
import { AttachPhotoHouseDto } from './dto/attach-photo-house.dto';
import { GetUser } from 'src/auth/decorators';
import { CreatePackageDto } from 'src/catalog/dto';
import { CreatePackageOrderDto } from './dto/create-package-order.dto';

@Auth()
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly r2Service: R2Service,
  ) {}

  @Get('houses')
  getUserHouses(@GetUser('id') id: string) {
    return this.userService.getUserHouses(id);
  }

  @Post('house')
  createUserHouse(
    @GetUser('id') id: string,
    @Body() createUserHouseDto: CreateUserHouseDto,
  ) {
    return this.userService.createUserHouse(id, createUserHouseDto);
  }

  @Post('uploads-sign')
  createHouseImageUploadSign(
    @GetUser('id') id: string,
    @Body() createUploadSignDto: CreateUploadSignDto,
  ) {
    return this.r2Service.createSignedUploadUrl({
      userId: id,
      mime: createUploadSignDto.mime,
      ext: createUploadSignDto.ext,
      size: createUploadSignDto.size,
    });
  }

  @Post('house/:houseId/photo-attach')
  attachPhotoUserHouse(
    @Param('houseId', ParseUUIDPipe) houseId: string,
    @Body() attachPhotoHouseDto: AttachPhotoHouseDto,
  ) {
    return this.userService.attachPhotoUserHouse(houseId, attachPhotoHouseDto);
  }

  @Delete('house/:houseId')
  deleteUserHouse(
    @GetUser('id') id: string,
    @Param('houseId', ParseUUIDPipe) houseId: string,
  ) {
    return this.userService.deleteUserHouse(houseId, id);
  }

  @Post('order-package/:houseId')
  createPackageOrder(
    @GetUser('id') id: string,
    @Param('houseId', ParseUUIDPipe) houseId: string,
    @Body() createPackageOrderDto: CreatePackageOrderDto,
  ) {
    return this.userService.createPackageOrder(
      id,
      houseId,
      createPackageOrderDto,
    );
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
