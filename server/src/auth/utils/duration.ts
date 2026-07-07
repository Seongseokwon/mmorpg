const UNIT_SECONDS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

/**
 * "15m"/"30d" 같은 표기를 초 단위 숫자로 바꾼다. @nestjs/jwt의 expiresIn이 브랜드 문자열
 * 타입(StringValue)을 요구해서 .env에서 읽은 일반 string을 그대로 넘기면 타입 에러가 나기
 * 때문에, 숫자(초)로 변환해 넘기는 쪽을 택했다.
 */
export function parseExpiresInSeconds(value: string, fallbackSeconds: number): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return fallbackSeconds;

  const amount = Number(match[1]);
  const unitSeconds = UNIT_SECONDS[match[2]] ?? 1;
  return amount * unitSeconds;
}
