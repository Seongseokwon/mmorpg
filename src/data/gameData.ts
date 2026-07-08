import type { EquipmentRarity, EquipmentSlot, StatGrade } from '@/types/game'

export const RARITY_LABELS: Record<EquipmentRarity, string> = {
  common: '일반',
  uncommon: '고급',
  rare: '희귀',
  epic: '영웅',
}

export const RARITY_COLORS: Record<EquipmentRarity, string> = {
  common: '#b0b0b0',
  uncommon: '#4ecca3',
  rare: '#5b9bd5',
  epic: '#c77dff',
}

export const WEAPON_NAMES = ['나무 검', '철 검', '미스릴 검', '성검', '드래곤 슬레이어']
export const ARMOR_NAMES = ['천 갑옷', '가죽 갑옷', '철 갑옷', '미스릴 갑옷', '용린 갑옷']

export const WEAPON_ICONS = ['🗡️', '⚔️', '🔪', '🏹', '✨']
export const ARMOR_ICONS = ['👕', '🧥', '🛡️', '💎', '🔰']

export interface EquipmentTemplate {
  slot: EquipmentSlot
  rarity: EquipmentRarity
  baseAttack: number
  baseHp: number
  nameIndex: number
  /** 주 스탯 변동폭 (0.25 = ±25%) */
  statSpread: number
}

export const STAT_GRADE_LABELS: Record<StatGrade, string> = {
  low: '하',
  normal: '중',
  high: '상',
  perfect: '최상',
}

export const STAT_GRADE_COLORS: Record<StatGrade, string> = {
  low: '#888888',
  normal: '#eaeaea',
  high: '#4ecca3',
  perfect: '#f5c542',
}

export const EQUIPMENT_TEMPLATES: EquipmentTemplate[] = [
  { slot: 'weapon', rarity: 'common', baseAttack: 5, baseHp: 0, nameIndex: 0, statSpread: 0.25 },
  { slot: 'weapon', rarity: 'uncommon', baseAttack: 12, baseHp: 0, nameIndex: 1, statSpread: 0.22 },
  { slot: 'weapon', rarity: 'rare', baseAttack: 25, baseHp: 0, nameIndex: 2, statSpread: 0.18 },
  { slot: 'weapon', rarity: 'epic', baseAttack: 50, baseHp: 0, nameIndex: 3, statSpread: 0.15 },
  { slot: 'armor', rarity: 'common', baseAttack: 0, baseHp: 20, nameIndex: 0, statSpread: 0.25 },
  { slot: 'armor', rarity: 'uncommon', baseAttack: 0, baseHp: 45, nameIndex: 1, statSpread: 0.22 },
  { slot: 'armor', rarity: 'rare', baseAttack: 0, baseHp: 90, nameIndex: 2, statSpread: 0.18 },
  { slot: 'armor', rarity: 'epic', baseAttack: 0, baseHp: 180, nameIndex: 3, statSpread: 0.15 },
]

export const SKILL_DEFINITIONS = [
  {
    id: 'power_strike',
    name: '파워 스트라이크',
    description: '강력한 일격으로 적에게 큰 피해를 입힙니다.',
    maxLevel: 10,
    cooldownMs: 5000,
    baseDamageMultiplier: 1.5,
    damagePerLevel: 0.15,
    unlockStage: 1,
    icon: '💥',
    hitsPerTarget: 1,
    aoeAll: false,
  },
  {
    id: 'fire_ball',
    name: '파이어볼',
    description: '화염 구체로 적을 불태웁니다.',
    maxLevel: 10,
    cooldownMs: 8000,
    baseDamageMultiplier: 2.0,
    damagePerLevel: 0.2,
    unlockStage: 3,
    icon: '🔥',
    hitsPerTarget: 1,
    aoeAll: false,
  },
  {
    id: 'meteor_storm',
    name: '메테오 스톰',
    description: '하늘에서 운석을 떨어뜨려 모든 적을 여러 차례 타격합니다.',
    maxLevel: 10,
    cooldownMs: 12000,
    baseDamageMultiplier: 0.6,
    damagePerLevel: 0.05,
    unlockStage: 5,
    icon: '☄️',
    hitsPerTarget: 3,
    aoeAll: true,
  },
] as const
