import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import type { CurrentUserPayload } from '../decorators/current-user.decorator';
import { REFRESH_COOKIE_NAME } from '../auth.constants';

interface JwtPayload {
  sub: string;
  email: string;
}

function extractRefreshTokenFromCookie(req: Request): string | null {
  const cookies = req?.cookies as Record<string, string> | undefined;
  return cookies?.[REFRESH_COOKIE_NAME] ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractRefreshTokenFromCookie,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  validate(payload: JwtPayload): CurrentUserPayload {
    return { userId: payload.sub, email: payload.email };
  }
}
