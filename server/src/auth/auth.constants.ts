import type { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken';

// server/.env(.example)의 JWT_REFRESH_EXPIRES_IN(기본 30일)과 맞춰야 한다 — 쿠키가 토큰보다
// 먼저 만료되면 아직 유효한 리프레시 토큰인데도 브라우저가 안 보내는 문제가 생긴다.
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** /auth 경로에만 쿠키를 보내도록 스코프를 좁혀, /save 등 다른 요청에 불필요하게 실리지 않게 한다. */
export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}
