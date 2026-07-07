import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { parseExpiresInSeconds } from './utils/duration';

const PASSWORD_HASH_ROUNDS = 10;
const DEFAULT_ACCESS_EXPIRES_SECONDS = 15 * 60;
const DEFAULT_REFRESH_EXPIRES_SECONDS = 30 * 24 * 60 * 60;

export interface AuthTokens {
  user: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string): Promise<AuthTokens> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
    const user = await this.users.create(email, passwordHash);
    return this.issueTokens(user);
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return this.issueTokens(user);
  }

  async refresh(userId: string): Promise<AuthTokens> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.issueTokens(user);
  }

  private issueTokens(user: User): AuthTokens {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: parseExpiresInSeconds(
        this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        DEFAULT_ACCESS_EXPIRES_SECONDS,
      ),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: parseExpiresInSeconds(
        this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
        DEFAULT_REFRESH_EXPIRES_SECONDS,
      ),
    });

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    };
  }
}
