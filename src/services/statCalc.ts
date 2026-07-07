import type { MainStatId, MainStats, SubStatLevels } from '@/types/game'

const ATK_BASE = 10
const HP_BASE = 100

const STR_ATK = 2
const VIT_HP = 15
const DEX_SPEED_MS = 3
const LUK_CRIT = 0.2

const EXP_BASE = 40
const EXP_GROWTH = 1.18

export function getExpToNextLevel(level: number): number {
  return Math.floor(EXP_BASE * Math.pow(EXP_GROWTH, level - 1))
}

export function getExpFromKill(stage: number): number {
  return Math.floor(8 + stage * 2)
}

export function getAttackFromMainStats(stats: MainStats): number {
  return ATK_BASE + stats.str * STR_ATK
}

export function getHpFromMainStats(stats: MainStats): number {
  return HP_BASE + stats.vit * VIT_HP
}

export function getCritRateFromMain(stats: MainStats): number {
  return stats.luk * LUK_CRIT
}

export function getAttackIntervalReduction(stats: MainStats): number {
  return stats.dex * DEX_SPEED_MS
}

const MAIN_STAT_IDS: MainStatId[] = ['str', 'vit', 'dex', 'luk']

/** 4개 메인 스탯 중 하나를 균등 확률로 고른다. 선천 능력치 생성/레벨업 성장에 재사용된다. */
export function pickRandomMainStatId(): MainStatId {
  return MAIN_STAT_IDS[Math.floor(Math.random() * MAIN_STAT_IDS.length)]
}

/** 선천 능력치: 지정한 총량을 4개 메인 스탯에 한 포인트씩 무작위로 배분한다. */
export function rollInnateStats(totalPoints: number): MainStats {
  const stats: MainStats = { str: 0, vit: 0, dex: 0, luk: 0 }
  for (let i = 0; i < totalPoints; i++) {
    stats[pickRandomMainStatId()] += 1
  }
  return stats
}

export function getSubCritRate(levels: SubStatLevels): number {
  return levels.crit_rate * 0.5
}

export function getSubCritDamage(levels: SubStatLevels): number {
  return levels.crit_damage * 3
}

export function getSubAttackSpeedPercent(levels: SubStatLevels): number {
  return levels.attack_speed * 1.5
}

export function getSubMesoBonusPercent(levels: SubStatLevels): number {
  return levels.meso_bonus * 5
}

export function getSubDropBonus(levels: SubStatLevels): number {
  return levels.drop_rate * 0.01
}

export function getTotalCritRate(main: MainStats, sub: SubStatLevels): number {
  return Math.min(80, getCritRateFromMain(main) + getSubCritRate(sub))
}

export function getTotalCritDamage(sub: SubStatLevels): number {
  return 150 + getSubCritDamage(sub)
}

export function getAttackIntervalMs(main: MainStats, sub: SubStatLevels): number {
  const base = 800
  const dexReduction = getAttackIntervalReduction(main)
  const speedPercent = getSubAttackSpeedPercent(sub)
  const speedReduction = Math.floor(base * (speedPercent / 100))
  return Math.max(280, base - dexReduction - speedReduction)
}

export function getSubStatUpgradeCost(statId: keyof SubStatLevels, level: number): number {
  const baseCosts: Record<keyof SubStatLevels, number> = {
    crit_rate: 80,
    crit_damage: 100,
    attack_speed: 120,
    meso_bonus: 90,
    drop_rate: 150,
  }
  return Math.floor(baseCosts[statId] * Math.pow(1.22, level))
}

export interface DamageResult {
  damage: number
  isCritical: boolean
}

export function calculatePlayerDamage(
  attack: number,
  critRate: number,
  critDamagePercent: number,
): DamageResult {
  const variance = 0.9 + Math.random() * 0.2
  let damage = Math.max(1, Math.floor(attack * variance))
  const isCritical = Math.random() * 100 < critRate

  if (isCritical) {
    damage = Math.floor(damage * (critDamagePercent / 100))
  }

  return { damage, isCritical }
}

export function applyMesoBonus(baseGold: number, bonusPercent: number): number {
  return Math.floor(baseGold * (1 + bonusPercent / 100))
}
