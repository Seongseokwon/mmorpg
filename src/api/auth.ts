import { apiRequest, apiRequestJson } from './http'

export interface AuthUser {
  id: string
  email: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
}

export function registerAccount(email: string, password: string): Promise<AuthResponse> {
  return apiRequestJson<AuthResponse>('/auth/register', { method: 'POST', body: { email, password } })
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequestJson<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } })
}

export function refresh(): Promise<{ accessToken: string }> {
  return apiRequestJson<{ accessToken: string }>('/auth/refresh', { method: 'POST' })
}

export async function logout(accessToken: string): Promise<void> {
  await apiRequest('/auth/logout', { method: 'POST', accessToken })
}
