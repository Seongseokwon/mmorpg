import type { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken';

// server/.env(.example)의 JWT_REFRESH_EXPIRES_IN(기본 30일)과 맞춰야 한다 — 쿠키가 토큰보다
// 먼저 만료되면 아직 유효한 리프레시 토큰인데도 브라우저가 안 보내는 문제가 생긴다.
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** /auth 경로에만 쿠키를 보내도록 스코프를 좁혀, /save 등 다른 요청에 불필요하게 실리지 않게 한다. */
export function refreshCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    // 프론트(Vercel)와 백엔드(Render)가 서로 다른 도메인에 떠 있으면 브라우저 기준 "cross-site"
    // 요청이 된다. SameSite=Lax는 cross-site fetch/XHR에는 쿠키를 안 실어 보내므로(최상위 탐색
    // GET에만 실림) /auth/refresh가 항상 401이 나 로그인 세션 복원이 불가능해진다. 로컬 개발은
    // 프론트/백엔드가 다른 포트일 뿐 같은 origin("localhost")이라 Lax로도 문제없이 동작한다.
    sameSite: isProduction ? 'none' : 'lax',
    // Firefox(그리고 곧 다른 브라우저도)는 CHIPS(Cookies Having Independent Partitioned State)
    // 정책에 따라 Partitioned 속성 없는 cross-site(SameSite=None) 쿠키를 거부/경고한다. 이 쿠키는
    // 항상 우리 프론트 origin 하나에서만 호출되므로 파티셔닝해도 동작에는 영향 없다.
    partitioned: isProduction,
    path: '/auth',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}
