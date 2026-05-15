import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto, LoginUserDto } from './dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';

import path from 'path';
import fs from "fs";
import * as bcrypt from 'bcrypt';
import { JwtAccessPayload, JwtRefreshPayload, User } from './interfaces';
import { RefreshWebDto } from './dto/refresh-web.dto';
import { Prisma } from '../generated/prisma/client/client';
import { encryptToString } from 'src/common';
import { BrevoService } from 'src/infrastructure/services/brevo.service';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { getTemplatePath } from 'src/common/helpers/get-template-path.helper';


@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private readonly brevoService: BrevoService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { name, lastname, email, password } = createUserDto;
    try {
      const user = await this.prisma.user.create({
        data: {
          name: name.trim(),
          lastname: lastname.trim(),
          email: email.trim().toLowerCase(),
          password: bcrypt.hashSync(password, 10),
        },
        select: {
          id: true,
          name: true,
          lastname: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        ...user,
        token: this.generateJwtAccessToken({ id: user.id }),
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  //* WEB AUTHENTICATION
  async loginWeb(loginUserDto: LoginUserDto, ip: string) {
    const data = await this.login(loginUserDto, ip);

    return data;
  }

  async logoutWeb(user: User, sessionId: string) {
    return await this.logout(user, sessionId);
  }

  async getRefreshTokenWeb(
    user: User,
    sessionId: string,
    refreshWebDto: RefreshWebDto,
  ) {
    try {
      const accessTokenExpiresIn =
        parseInt(this.configService.get('TIME_ACCESS_TOKEN') ?? '20m') * 60; // SECONDS

      const refreshTokenExpiresIn =
        parseInt(this.configService.get('TIME_REFRESH_TOKEN') ?? '7d') *
        60 *
        60 *
        24; // SECONDS

      const expiresAt = new Date(Date.now() + 1000 * refreshTokenExpiresIn);

      const refreshToken = this.generateJwtRefreshToken({
        userId: user.id,
        sessionId: sessionId,
      });

      const session = await this.prisma.userSession.update({
        data: { refreshToken: bcrypt.hashSync(refreshToken, 10), expiresAt },
        where: { id: sessionId },
      });

      if (!session) throw new Error('session not updated');

      const accessToken = this.generateJwtAccessToken({
        id: user.id,
      });

      return {
        accessToken,
        refreshToken,
        accessTokenExpiresIn,
        refreshTokenExpiresIn,
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  //* MOBILE AUTHENTICATION
  async loginMobile(loginUserDto: LoginUserDto, ip: string) {
    const data = await this.login(loginUserDto, ip);

    return {
      user: data.user,
      tokens: {
        access: data.accessToken,
        refresh: data.refreshToken,
      },
      expiresIn: {
        access: data.accessTokenExpiresIn,
        refresh: data.refreshTokenExpiresIn
      }
    };
  }

  async logoutMobile(user: User, sessionId: string) {
    return await this.logout(user, sessionId);
  }

  async sendEmailCode(user: User) {
    const { email, name, lastname, id } = user;

    const templatePath = getTemplatePath('auth-email.template.html');

    let html = fs.readFileSync(templatePath, "utf8");
    const code = Math.floor(1000 + Math.random() * 9000)
      .toString()
      .slice(0, 4);
    html = html
      .replace("{{name}}", `${name} ${lastname}`)
      .replace("{{code}}", code);

    const hashedCode = encryptToString(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    try {
      const code = await this.prisma.emailVerificationCodes.create({
        data: {
          userId: id,
          hashedCode,
          expiresAt,
          purpose: "EMAIL_VERIFY",
          status: "PENDING",
        }
      })

      if (!code) throw new Error("Code not sent")

      await this.brevoService.sendEmail(email, "Verification code", html)

      return;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async verifyEmailCode(user: User, verifyEmailCodeDto: VerifyEmailCodeDto) {
    const { id } = user;
    const { code } = verifyEmailCodeDto;

    const hashedCode = encryptToString(code);
    try {
      const storeCode = await this.prisma.emailVerificationCodes.findUnique({
        where: {
          userId_hashedCode_purpose: {
            userId: id,
            hashedCode,
            purpose: "EMAIL_VERIFY"
          }
        }
      })

      if (!storeCode) throw new Error("Code not found")
      
      const nowDate = Date.now();

      const diffInMinutes =
        (nowDate - new Date(storeCode.expiresAt).getTime()) / 1000 / 60;
      if (diffInMinutes >= 0) throw new Error("Code expired");

      await this.prisma.emailVerificationCodes.update({
        data: {
          consumedAt: new Date(nowDate),
          status: "USED",
        },
        where: { id: storeCode.id }
      })

      await this.prisma.user.update({
        where: { id },
        data: {
          isEmailVerified: true,
        }
      })

      return;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  private async login(loginUserDto: LoginUserDto, ip: string) {
    try {
      const { email, password: pass, deviceId, deviceInfo } = loginUserDto;

      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) throw new Error('Credentials are not valid');

      if (!bcrypt.compareSync(pass, user.password))
        throw new Error('Credentials are not valid');

      const accessTokenExpiresIn =
        parseInt(this.configService.get('TIME_ACCESS_TOKEN') ?? '20m') * 60; // SECONDS

      const refreshTokenExpiresIn =
        parseInt(this.configService.get('TIME_REFRESH_TOKEN') ?? '7d') *
        60 *
        60 *
        24; // SECONDS

      const expiresAt = new Date(Date.now() + 1000 * refreshTokenExpiresIn);

      const initialSession = await this.prisma.userSession.create({
        data: {
          deviceId,
          deviceInfo,
          ipAddress: ip,
          userId: user.id,
          refreshToken: '',
          expiresAt,
        },
      });
      if (!initialSession) throw new Error('session not created');

      const payload: JwtRefreshPayload = {
        userId: user.id,
        sessionId: initialSession.id,
      };

      const refreshToken = this.generateJwtRefreshToken(payload);

      const session = await this.prisma.userSession.update({
        data: { refreshToken: bcrypt.hashSync(refreshToken, 10) },
        where: { id: initialSession.id },
      });

      if (!session) throw new Error('session not updated');

      const { password, lastLogin, createdAt, updatedAt, ...result } = user;

      return {
        user: { ...result },
        accessToken: this.generateJwtAccessToken({ id: user.id }),
        refreshToken,
        accessTokenExpiresIn,
        refreshTokenExpiresIn,
        sessionId: session.id,
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async logout(user: User, sessionId: string) {
    try {
      const session = await this.prisma.userSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) throw new Error('session not found');
      if (session.userId !== user.id) throw new Error('unauthorized session');
      if (session.isRevoked) return;

      await this.prisma.userSession.update({
        where: { id: sessionId },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'logout',
        },
      });
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  private generateJwtAccessToken(payload: JwtAccessPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private generateJwtRefreshToken(payload: JwtRefreshPayload) {
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('TIME_REFRESH_TOKEN') ?? '7d',
    });
    return token;
  }

  private handleDBErrors(error: unknown): never {
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
