const DEFAULT_REGION_CODE = 'KR'
const MIN_NICKNAME_LENGTH = 2
const MAX_NICKNAME_LENGTH = 12

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0')
}

/**
 * 캐릭터 생성 시 자동 배정되는 닉네임. 지역코드 + 초 단위 타임스탬프 + 3자리 난수로 구성해
 * 동시 가입자가 많아도 실질적으로 겹치지 않는다(같은 초에 가입 + 1/1000 난수 일치까지 겹쳐야
 * 충돌). 사용자가 나중에 원하는 닉네임으로 바꿀 수 있다.
 */
export function generateDefaultNickname(region: string = DEFAULT_REGION_CODE): string {
  const now = new Date()
  const y = now.getFullYear()
  const mo = pad(now.getMonth() + 1, 2)
  const d = pad(now.getDate(), 2)
  const h = pad(now.getHours(), 2)
  const mi = pad(now.getMinutes(), 2)
  const s = pad(now.getSeconds(), 2)
  const rand = pad(Math.floor(Math.random() * 1000), 3)
  return `#${region}${y}${mo}${d}${h}${mi}${s}${rand}`
}

/** 유효하면 null, 아니면 사용자에게 보여줄 에러 메시지를 반환한다. */
export function validateNickname(nickname: string): string | null {
  if (nickname !== nickname.trim()) {
    return '닉네임 앞뒤에 공백을 넣을 수 없습니다.'
  }
  if (nickname.length < MIN_NICKNAME_LENGTH) {
    return `닉네임은 ${MIN_NICKNAME_LENGTH}자 이상이어야 합니다.`
  }
  if (nickname.length > MAX_NICKNAME_LENGTH) {
    return `닉네임은 ${MAX_NICKNAME_LENGTH}자 이하여야 합니다.`
  }
  return null
}
