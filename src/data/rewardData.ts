import type { AchievementDef } from '@/types/game'

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first_kill',
    name: '첫 전투',
    description: '몬스터 1마리 처치',
    target: 1,
    icon: '⚔️',
    trackKey: 'totalKills',
    reward: { meso: 100 },
  },
  {
    id: 'hunter',
    name: '사냥꾼',
    description: '몬스터 50마리 처치',
    target: 50,
    icon: '🎯',
    trackKey: 'totalKills',
    reward: { meso: 500, scroll: 1 },
  },
  {
    id: 'slayer',
    name: '슬레이어',
    description: '몬스터 200마리 처치',
    target: 200,
    icon: '💀',
    trackKey: 'totalKills',
    reward: { meso: 2000, potion: 3 },
  },
  {
    id: 'stage_5',
    name: '모험가',
    description: '스테이지 5 도달',
    target: 5,
    icon: '🗺️',
    trackKey: 'maxStage',
    reward: { meso: 300 },
  },
  {
    id: 'stage_10',
    name: '탐험가',
    description: '스테이지 10 도달',
    target: 10,
    icon: '🏔️',
    trackKey: 'maxStage',
    reward: { meso: 1000, scroll: 2 },
  },
  {
    id: 'level_10',
    name: '성장',
    description: '레벨 10 달성',
    target: 10,
    icon: '⬆️',
    trackKey: 'level',
    reward: { meso: 500 },
  },
  {
    id: 'first_gacha',
    name: '첫 뽑기',
    description: '장비 뽑기 1회',
    target: 1,
    icon: '🎰',
    trackKey: 'totalGachaPulls',
    reward: { potion: 2 },
  },
  {
    id: 'gacha_10',
    name: '뽑기 중독',
    description: '장비 뽑기 10회',
    target: 10,
    icon: '🎲',
    trackKey: 'totalGachaPulls',
    reward: { meso: 800, scroll: 1 },
  },
  {
    id: 'enhance_5',
    name: '대장장이',
    description: '장비 강화 5회',
    target: 5,
    icon: '🔨',
    trackKey: 'totalEnhances',
    reward: { meso: 300 },
  },
]

export interface DailyRewardDef {
  day: number
  meso: number
  potion: number
  scroll: number
  label: string
}

export const DAILY_REWARDS: DailyRewardDef[] = [
  { day: 1, meso: 200, potion: 0, scroll: 0, label: '200 루나' },
  { day: 2, meso: 300, potion: 1, scroll: 0, label: '300 루나 + 포션' },
  { day: 3, meso: 400, potion: 0, scroll: 1, label: '400 루나 + 주문서' },
  { day: 4, meso: 500, potion: 2, scroll: 0, label: '500 루나 + 포션 x2' },
  { day: 5, meso: 700, potion: 0, scroll: 1, label: '700 루나 + 주문서' },
  { day: 6, meso: 900, potion: 2, scroll: 1, label: '900 루나 + 혼합' },
  { day: 7, meso: 1500, potion: 3, scroll: 2, label: '1500 루나 + 대박!' },
]

export const GACHA_SINGLE_COST = 500
export const GACHA_MULTI_COST = 4500
export const GACHA_MULTI_COUNT = 10
export const GACHA_PITY_THRESHOLD = 20

/** 뽑기 등급 확률 (%) */
export const GACHA_RATES = {
  common: 55,
  uncommon: 28,
  rare: 14,
  epic: 3,
} as const

export const OFFLINE_MAX_HOURS = 8
export const OFFLINE_MIN_MINUTES = 5
