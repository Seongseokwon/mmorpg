import { Body, Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from './auth.constants';
import { CurrentUser, type CurrentUserPayload } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAccessGuard } from './guards/jwt-access.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.auth.register(dto.email, dto.password);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    return { user, accessToken };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken } = await this.auth.login(dto.email, dto.password);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    return { user, accessToken };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.auth.refresh(user.userId);
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    return { accessToken };
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  }
}
