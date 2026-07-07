import { apiRequest } from './http'
import type { SaveData } from '@/types/game'

export interface CloudSaveRecord {
  version: number
  data: SaveData
  updatedAt: string
}

/** 저장한 적 없는 유저는 서버가 빈 바디(200)를 내려주므로 그 경우 null을 반환한다. */
export async function fetchCloudSave(accessToken: string): Promise<CloudSaveRecord | null> {
  const response = await apiRequest('/save', { accessToken })
  const text = await response.text()
  if (!text) return null
  return JSON.parse(text) as CloudSaveRecord
}

export async function pushCloudSave(accessToken: string, data: SaveData): Promise<CloudSaveRecord> {
  const response = await apiRequest('/save', {
    method: 'PUT',
    accessToken,
    body: { version: data.version, data },
  })
  return (await response.json()) as CloudSaveRecord
}
