const MONSTER_HP_BASE = 50
const MONSTER_ATTACK_BASE = 5
const MONSTER_GOLD_BASE = 10

const STAGE_GROWTH = 1.2
const GOLD_GROWTH = 1.1

export function getMonsterMaxHp(stage: number): number {
  return Math.floor(MONSTER_HP_BASE * Math.pow(STAGE_GROWTH, stage - 1))
}

export function getMonsterAttack(stage: number): number {
  return Math.floor(MONSTER_ATTACK_BASE * Math.pow(STAGE_GROWTH, stage - 1))
}

export function getMonsterGoldReward(stage: number): number {
  return Math.floor(MONSTER_GOLD_BASE * Math.pow(GOLD_GROWTH, stage - 1))
}

export function getMonsterName(stage: number): string {
  if (stage <= 3) return '슬라임'
  if (stage <= 6) return '불 슬라임'
  if (stage <= 9) return '가시 슬라임'
  if (stage <= 12) return '블록 슬라임'
  return `정예 몬스터 Lv.${stage}`
}

export function getMonsterSprite(stage: number): string {
  if (stage <= 3) return 'slime_normal_rest'
  if (stage <= 6) return 'slime_fire_rest'
  if (stage <= 9) return 'slime_spike_rest'
  if (stage <= 12) return 'slime_block_rest'
  return 'frog_rest'
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString('ko-KR')
}
