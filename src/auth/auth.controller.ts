import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto, RefreshWebDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { GetRealIP, GetUser, RawHeaders } from './decorators';
import { User } from './interfaces/user';
import { AuthStrategy } from './interfaces';
import { Auth } from './decorators/auth.decorator';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';

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
    return await this.authService.logoutMobile(user, sessionId);
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

  @Post('send-email-code')
  @Auth()
  sendEmailCode(@GetUser() user: User) {
    return this.authService.sendEmailCode(user);
  }

  @Post('verify-email-code')
  @Auth()
  verifyEmailCode(@Body() verifyEmailCodeDto: VerifyEmailCodeDto, @GetUser() user: User) {
    return this.authService.verifyEmailCode(user, verifyEmailCodeDto);
  }
}
