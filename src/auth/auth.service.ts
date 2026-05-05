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

import * as bcrypt from 'bcrypt';
import { Prisma } from 'src/generated/prisma/client';
import { JwtAccessPayload, JwtRefreshPayload, User } from './interfaces';
import { RefreshWebDto } from './dto/refresh-web.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
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

  async loginWeb(loginUserDto: LoginUserDto, ip: string) {
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

  async logoutWeb(user: User, sessionId: string) {
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

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
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
