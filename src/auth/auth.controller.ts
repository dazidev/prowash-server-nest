import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto, RefreshWebDto } from './dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetRealIP, GetUser, RawHeaders } from './decorators';
import { User } from './interfaces/user';
import { UserRoleGuard } from './guards/user-role.guard';
import { RoleProtected } from './decorators/role-protected.decorator';
import { AuthStrategy, ValidRoles } from './interfaces';
import { Auth } from './decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  //* WEB AUTHENTICATION
  @Post('login-web')
  async loginUserWeb(@Body() loginUserDto: LoginUserDto, @GetRealIP() ip: string) {
    return await this.authService.loginWeb(loginUserDto, ip);
  }

  @Post('logout-web')
  @UseGuards(AuthGuard(AuthStrategy.REFRESH))
  @HttpCode(HttpStatus.OK)
  async logoutUserWeb(
    @GetUser() user: User,
    @GetUser('sessionId') sessionId: string,
  ) {
    return await this.authService.logoutWeb(user, sessionId);
  }

  @Post('refresh-web')
  @UseGuards(AuthGuard(AuthStrategy.REFRESH))
  async getRefreshTokenWeb(
    @GetUser() user: User,
    @GetUser('sessionId') sessionId: string,
    @Body() refreshWebDto: RefreshWebDto,
  ) {
    return this.authService.getRefreshTokenWeb(user, sessionId, refreshWebDto);
  }

  //* MOBILE AUTHENTICATION
  @Post('login-mobile')
  async loginUserMobile(@Body() loginUserDto: LoginUserDto, @GetRealIP() ip: string) {
    return await this.authService.loginMobile(loginUserDto, ip);
  }

  @Post('logout-mobile')
  @UseGuards(AuthGuard(AuthStrategy.REFRESH))
  @HttpCode(HttpStatus.OK)
  async logoutUserMobile(
    @GetUser() user: User,
    @GetUser('sessionId') sessionId: string,
  ) {
    return await this.authService.logoutWeb(user, sessionId);
  }

  @Post('refresh-mobile')
  @UseGuards(AuthGuard(AuthStrategy.REFRESH))
  async getRefreshTokenMobile(
    @GetUser() user: User,
    @GetUser('sessionId') sessionId: string,
    @Body() refreshWebDto: RefreshWebDto,
  ) {
    return this.authService.getRefreshTokenWeb(user, sessionId, refreshWebDto);
  }

  @Get('check-status')
  @Auth()
  checkStatus(@GetUser() user: User) {
    return user;
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    // @Req() request: Express.Request,
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    @RawHeaders() rawHeaders: string[],
  ) {
    return {
      ok: true,
      message: 'Hola Mundo Private',
      user,
      userEmail,
      rawHeaders,
    };
  }

  // @SetMetadata('role', 'USER')

  @Get('private2')
  @RoleProtected(ValidRoles.user)
  @UseGuards(AuthGuard(), UserRoleGuard)
  privateRoute2(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  @Get('private3')
  @Auth(ValidRoles.admin)
  privateRoute3(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
