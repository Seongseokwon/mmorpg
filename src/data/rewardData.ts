import type { AchievementDef } from '@/types/game'

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // --- 처치 (totalKills) ---
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
    id: 'veteran_hunter',
    name: '베테랑 사냥꾼',
    description: '몬스터 500마리 처치',
    target: 500,
    icon: '🏹',
    trackKey: 'totalKills',
    reward: { meso: 5000, statPoints: 3 },
  },
  {
    id: 'legend_hunter',
    name: '학살자',
    description: '몬스터 1000마리 처치',
    target: 1000,
    icon: '☠️',
    trackKey: 'totalKills',
    reward: { meso: 10000, statPoints: 5 },
  },

  // --- 보스 처치 (totalBossKills) ---
  {
    id: 'first_boss',
    name: '첫 보스 사냥',
    description: '스테이지 보스 1마리 처치',
    target: 1,
    icon: '👑',
    trackKey: 'totalBossKills',
    reward: { meso: 500, statPoints: 1 },
  },
  {
    id: 'boss_hunter',
    name: '보스 헌터',
    description: '스테이지 보스 5마리 처치',
    target: 5,
    icon: '🗡️',
    trackKey: 'totalBossKills',
    reward: { meso: 2000, statPoints: 3 },
  },
  {
    id: 'boss_slayer',
    name: '보스 학살자',
    description: '스테이지 보스 20마리 처치',
    target: 20,
    icon: '⚜️',
    trackKey: 'totalBossKills',
    reward: { meso: 8000, statPoints: 5 },
  },

  // --- 스테이지 도달 (maxStage) ---
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
    id: 'stage_20',
    name: '개척자',
    description: '스테이지 20 도달',
    target: 20,
    icon: '🧭',
    trackKey: 'maxStage',
    reward: { meso: 3000, statPoints: 3 },
  },
  {
    id: 'stage_30',
    name: '정복자',
    description: '스테이지 30 도달',
    target: 30,
    icon: '🏰',
    trackKey: 'maxStage',
    reward: { meso: 6000, statPoints: 5 },
  },

  // --- 레벨 달성 (level) ---
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
    id: 'level_20',
    name: '숙련',
    description: '레벨 20 달성',
    target: 20,
    icon: '📈',
    trackKey: 'level',
    reward: { meso: 1500, statPoints: 2 },
  },
  {
    id: 'level_30',
    name: '달인',
    description: '레벨 30 달성',
    target: 30,
    icon: '🌟',
    trackKey: 'level',
    reward: { meso: 3000, statPoints: 4 },
  },

  // --- 가챠 (totalGachaPulls) ---
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
    id: 'gacha_50',
    name: '뽑기의 신',
    description: '장비 뽑기 50회',
    target: 50,
    icon: '🍀',
    trackKey: 'totalGachaPulls',
    reward: { meso: 3000, statPoints: 2 },
  },

  // --- 강화 (totalEnhances) ---
  {
    id: 'enhance_5',
    name: '대장장이',
    description: '장비 강화 5회',
    target: 5,
    icon: '🔨',
    trackKey: 'totalEnhances',
    reward: { meso: 300 },
  },
  {
    id: 'enhance_20',
    name: '강화 장인',
    description: '장비 강화 20회',
    target: 20,
    icon: '⚒️',
    trackKey: 'totalEnhances',
    reward: { meso: 1500, scroll: 2 },
  },
  {
    id: 'enhance_50',
    name: '전설의 대장장이',
    description: '장비 강화 50회',
    target: 50,
    icon: '🛠️',
    trackKey: 'totalEnhances',
    reward: { meso: 4000, statPoints: 3 },
  },

  // --- 출석 (dailyStreak) ---
  {
    id: 'streak_3',
    name: '꾸준함',
    description: '일일 보상 3일 연속 수령',
    target: 3,
    icon: '📅',
    trackKey: 'dailyStreak',
    reward: { meso: 500 },
  },
  {
    id: 'streak_7',
    name: '개근왕',
    description: '일일 보상 7일 연속 수령',
    target: 7,
    icon: '🏅',
    trackKey: 'dailyStreak',
    reward: { meso: 2000, statPoints: 2 },
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
