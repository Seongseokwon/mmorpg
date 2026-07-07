const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  accessToken?: string | null
}

/**
 * 응답 바디가 없을 수 있는 엔드포인트(예: GET /save의 빈 응답)를 위해 raw Response를 돌려준다.
 * credentials: 'include'는 리프레시 토큰 httpOnly 쿠키를 주고받기 위해 필요하다.
 */
export async function apiRequest(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new ApiError(response.status, message || `요청 실패 (${response.status})`)
  }

  return response
}

export async function apiRequestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await apiRequest(path, options)
  return (await response.json()) as T
}
