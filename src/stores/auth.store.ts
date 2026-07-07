import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as authApi from '@/api/auth'
import { ApiError } from '@/api/http'
import type { AuthUser } from '@/api/auth'

/** accessToken은 XSS로 탈취되면 그대로 노출되는 localStorage에 두지 않고 메모리(Pinia)에만 보관한다. */
function decodeAccessToken(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = JSON.parse(atob(base64)) as { sub: string; email: string }
    return { id: json.sub, email: json.email }
  } catch {
    return null
  }
}

// 로그인한 적이 한 번도 없는 게스트는 애초에 refreshToken 쿠키가 존재할 수 없다. 이 힌트가 없으면
// restoreSession()이 /auth/refresh를 아예 호출하지 않아, 대다수인 게스트 플레이에서 매번 401을
// 만들어 콘솔에 에러로 찍히고 불필요한 네트워크 왕복이 생기는 것을 막는다.
const SESSION_HINT_KEY = 'mmorpg:hasSession'

function markSessionHint(): void {
  try {
    localStorage.setItem(SESSION_HINT_KEY, '1')
  } catch {
    // Safari 프라이빗 모드 등 localStorage 접근 불가 — 힌트 없이도 동작에는 지장 없다.
  }
}

function clearSessionHint(): void {
  try {
    localStorage.removeItem(SESSION_HINT_KEY)
  } catch {
    // 위와 동일한 이유로 무시
  }
}

function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    return false
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return '이미 가입된 이메일입니다.'
    if (error.status === 401) return '이메일 또는 비밀번호가 올바르지 않습니다.'
    if (error.status === 400) return '입력값을 확인해주세요.'
    return error.message || '요청 처리 중 오류가 발생했습니다.'
  }
  return '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)
  const isRestoring = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => user.value !== null && accessToken.value !== null)

  function setSession(session: authApi.AuthResponse): void {
    user.value = session.user
    accessToken.value = session.accessToken
    error.value = null
    markSessionHint()
  }

  function clearSession(): void {
    user.value = null
    accessToken.value = null
  }

  async function register(email: string, password: string): Promise<boolean> {
    error.value = null
    try {
      setSession(await authApi.registerAccount(email, password))
      return true
    } catch (e) {
      error.value = toErrorMessage(e)
      return false
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    error.value = null
    try {
      setSession(await authApi.login(email, password))
      return true
    } catch (e) {
      error.value = toErrorMessage(e)
      return false
    }
  }

  async function logout(): Promise<void> {
    const token = accessToken.value
    clearSession()
    clearSessionHint()
    if (!token) return
    try {
      await authApi.logout(token)
    } catch {
      // 세션은 이미 로컬에서 지워졌다 — 서버 로그아웃 실패(네트워크 등)는 무시해도
      // 리프레시 쿠키가 만료되면 자연히 무효화된다.
    }
  }

  // LandingView와 GameView 진입 양쪽에서 세션 복원이 필요한데, 각자 호출해도 중복 네트워크
  // 요청 없이 같은 결과를 기다리도록 진행 중인 Promise를 공유한다(단순 boolean 플래그는 두 번째
  // 호출자가 첫 호출 완료 전에 그냥 반환해버리는 레이스가 생긴다).
  let restorePromise: Promise<void> | null = null

  /** 앱 부팅 시 refreshToken 쿠키로 로그인 상태를 조용히 복원 시도. 실패하면 게스트로 계속 진행. */
  function restoreSession(): Promise<void> {
    if (restorePromise) return restorePromise

    if (!hasSessionHint()) {
      // 이 브라우저로 로그인한 적이 없다 — refreshToken 쿠키가 있을 리 없으므로 굳이 401을
      // 유발하는 네트워크 요청을 보내지 않고 곧바로 게스트로 확정한다.
      restorePromise = Promise.resolve()
      return restorePromise
    }

    isRestoring.value = true
    restorePromise = (async () => {
      try {
        const { accessToken: token } = await authApi.refresh()
        accessToken.value = token
        user.value = decodeAccessToken(token)
      } catch (e) {
        // 리프레시 토큰 자체가 무효/만료(401 등 응답 받음)라면 다음에도 어차피 실패하니
        // 힌트를 지운다. 네트워크 자체가 끊긴 경우(응답을 못 받음)는 힌트를 유지해 백엔드가
        // 돌아왔을 때 다시 시도할 수 있게 한다.
        if (e instanceof ApiError) {
          clearSessionHint()
        }
        clearSession()
      } finally {
        isRestoring.value = false
      }
    })()

    return restorePromise
  }

  /** accessToken 만료(401) 시 refresh 후 한 번만 재시도하는 공통 래퍼. */
  async function withAuthRetry<T>(fn: (token: string) => Promise<T>): Promise<T> {
    if (!accessToken.value) throw new ApiError(401, '로그인이 필요합니다.')
    try {
      return await fn(accessToken.value)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        const { accessToken: token } = await authApi.refresh()
        accessToken.value = token
        user.value = decodeAccessToken(token)
        return await fn(token)
      }
      throw e
    }
  }

  return {
    user,
    accessToken,
    isLoggedIn,
    isRestoring,
    error,
    register,
    login,
    logout,
    restoreSession,
    withAuthRetry,
  }
})
