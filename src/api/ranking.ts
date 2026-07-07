import { apiRequestJson } from './http'

export interface RankingEntry {
  rank: number
  nickname: string
  level: number
  maxClearedStage: number
}

/** 인증 불필요 — 게스트도 랭킹을 조회할 수 있다. */
export function fetchRanking(): Promise<RankingEntry[]> {
  return apiRequestJson<RankingEntry[]>('/ranking')
}
