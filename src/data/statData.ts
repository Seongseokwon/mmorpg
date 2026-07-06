import type { MainStatId, SubStatId } from '@/types/game'

export interface MainStatDef {
  id: MainStatId
  name: string
  shortName: string
  description: string
  effectPerPoint: string
}

export interface SubStatDef {
  id: SubStatId
  name: string
  description: string
  effectPerLevel: string
  baseCost: number
  maxLevel: number
}

export const MAIN_STAT_DEFS: MainStatDef[] = [
  { id: 'str', name: 'STR (힘)', shortName: 'STR', description: '공격력 증가', effectPerPoint: 'ATK +2' },
  { id: 'vit', name: 'VIT (체력)', shortName: 'VIT', description: '최대 HP 증가', effectPerPoint: 'HP +15' },
  { id: 'dex', name: 'DEX (민첩)', shortName: 'DEX', description: '공격 속도 증가', effectPerPoint: '공속 소폭↑' },
  { id: 'luk', name: 'LUK (운)', shortName: 'LUK', description: '치명타 확률 증가', effectPerPoint: '치명타 +0.2%' },
]

export const SUB_STAT_DEFS: SubStatDef[] = [
  {
    id: 'crit_rate',
    name: '치명타 확률',
    description: '치명타가 발생할 확률',
    effectPerLevel: '+0.5%',
    baseCost: 80,
    maxLevel: 50,
  },
  {
    id: 'crit_damage',
    name: '치명타 피해',
    description: '치명타 시 추가 피해량',
    effectPerLevel: '+3%',
    baseCost: 100,
    maxLevel: 50,
  },
  {
    id: 'attack_speed',
    name: '공격 속도',
    description: '자동 공격 간격 단축',
    effectPerLevel: '-1.5%',
    baseCost: 120,
    maxLevel: 30,
  },
  {
    id: 'meso_bonus',
    name: '루나 획득',
    description: '처치 시 루나 추가 획득',
    effectPerLevel: '+5%',
    baseCost: 90,
    maxLevel: 40,
  },
  {
    id: 'drop_rate',
    name: '드롭 확률',
    description: '장비 드롭 확률 증가',
    effectPerLevel: '+1%',
    baseCost: 150,
    maxLevel: 20,
  },
]

export const STAT_POINTS_PER_LEVEL = 5
