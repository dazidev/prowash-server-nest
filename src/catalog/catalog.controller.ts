import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import {
  CreateIndividualServiceDto,
  CreatePackageDto,
  CreatePackageRangeDto,
  CreatePackageServiceDto,
  UpdatePackageRangeDto,
  UpdatePackageServiceDto,
} from './dto';
import { CatalogService } from './catalog.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces';

@Auth(ValidRoles.admin)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  //* PACKAGE SERVICES
  @Get('services')
  getPackageServices() {
    return this.catalogService.getPackageServices();
  }

  @Post('service')
  createPackageService(
    @Body() createPackageServiceDto: CreatePackageServiceDto,
  ) {
    return this.catalogService.createPackageService(createPackageServiceDto);
  }

  @Patch('service/:id')
  updatePackageService(
    @Param('id') id: string,
    @Body() updatePackageServiceDto: UpdatePackageServiceDto,
  ) {
    return this.catalogService.updatePackageService(
      id,
      updatePackageServiceDto,
    );
  }

  @Delete('service/:id')
  deletePackageService(@Param('id') id: string) {
    return this.catalogService.deletePackageService(id);
  }

  //* PACKAGE RANGES
  @Get('ranges')
  getPackageRanges() {
    return this.catalogService.getPackageRanges();
  }

  @Post('range')
  createPackageRange(@Body() createPackageRangeDto: CreatePackageRangeDto) {
    return this.catalogService.createPackageRange(createPackageRangeDto);
  }

  @Patch('range/:id')
  updatePackageRange(
    @Param('id') id: string,
    @Body() updatePackageRangeDto: UpdatePackageRangeDto,
  ) {
    return this.catalogService.updatePackageRange(id, updatePackageRangeDto);
  }

  @Delete('range/:id')
  deletePackageRange(@Param('id') id: string) {
    return this.catalogService.deletePackageRange(id);
  }

  //* PACKAGES
  @Get('packages')
  getPackages() {
    return this.catalogService.getPackages();
  }

  @Post('package')
  createPackage(@Body() createPackageDto: CreatePackageDto) {
    return this.catalogService.createPackage(createPackageDto);
  }

  @Delete('package/:id')
  deletePackage(@Param('id') id: string) {
    return this.catalogService.deletePackage(id);
  }

  //* INDIVIDUAL SERVICES

  @Get('individual-services')
  getIndividualServices() {
    return this.catalogService.getIndividualServices();
  }

  @Post('individual-service')
  createIndividualService(
    @Body() createIndividualServiceDto: CreateIndividualServiceDto,
  ) {
    return this.catalogService.createIndividualService(
      createIndividualServiceDto,
    );
  }
}
