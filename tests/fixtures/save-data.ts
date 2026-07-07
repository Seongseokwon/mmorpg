/**
 * SaveData 스키마를 그대로 구현이 아니라 "계약"으로 복제한 픽스처.
 * src/services/saveService.ts의 SaveData(v4) 포맷과 반드시 맞아야 하며,
 * 앱 소스를 import하지 않고 독립적으로 유지한다(내부 구현 결합 금지).
 */
export interface FixtureSaveData {
  version: number
  gold: number
  level: number
  exp: number
  statPoints: number
  mainStats: { str: number; vit: number; dex: number; luk: number }
  innateStats: { str: number; vit: number; dex: number; luk: number }
  subStats: {
    crit_rate: number
    crit_damage: number
    attack_speed: number
    meso_bonus: number
    drop_rate: number
  }
  currentStage: number
  maxClearedStage: number
  equipmentBag: FixtureEquipment[]
  equippedWeapon: FixtureEquipment | null
  equippedArmor: FixtureEquipment | null
  consumables: { id: string; type: string; name: string; quantity: number; description: string }[]
  skills: { id: string; level: number }[]
  gachaPity: number
  achievements: Record<string, { claimed: boolean }>
  dailyReward: { lastClaimDate: string; streak: number }
  meta: { totalKills: number; totalGachaPulls: number; totalEnhances: number; totalBossKills: number }
  lastActiveAt: number
}

export interface FixtureEquipment {
  id: string
  name: string
  slot: 'weapon' | 'armor'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic'
  enhanceLevel: number
  baseAttack: number
  baseHp: number
  statGrade: 'low' | 'normal' | 'high' | 'perfect'
}

export function buildEquipment(overrides: Partial<FixtureEquipment> = {}): FixtureEquipment {
  return {
    id: `eq-fixture-${Math.random().toString(36).slice(2, 8)}`,
    name: '테스트 무기',
    slot: 'weapon',
    rarity: 'common',
    enhanceLevel: 0,
    baseAttack: 20,
    baseHp: 0,
    statGrade: 'normal',
    ...overrides,
  }
}

export function buildSaveData(overrides: Partial<FixtureSaveData> = {}): FixtureSaveData {
  const base: FixtureSaveData = {
    version: 4,
    gold: 0,
    level: 1,
    exp: 0,
    statPoints: 5,
    mainStats: { str: 1, vit: 1, dex: 1, luk: 1 },
    // 기본값은 0으로 고정 — 기존 스탯 관련 테스트가 "정확히 N"을 검증하므로 선천 능력치가
    // 섞이지 않게 한다. 선천 능력치 자체를 검증하는 테스트는 overrides로 명시적으로 지정한다.
    innateStats: { str: 0, vit: 0, dex: 0, luk: 0 },
    subStats: {
      crit_rate: 0,
      crit_damage: 0,
      attack_speed: 0,
      meso_bonus: 0,
      drop_rate: 0,
    },
    currentStage: 1,
    maxClearedStage: 1,
    equipmentBag: [],
    equippedWeapon: null,
    equippedArmor: null,
    consumables: [
      { id: 'potion', type: 'potion', name: '체력 포션', quantity: 3, description: '체력 30% 회복' },
      { id: 'scroll', type: 'scroll', name: '강화 주문서', quantity: 2, description: '강화 성공률 +15%' },
    ],
    skills: [
      { id: 'power_strike', level: 1 },
      { id: 'fire_ball', level: 0 },
    ],
    gachaPity: 0,
    achievements: {},
    dailyReward: { lastClaimDate: '', streak: 0 },
    meta: { totalKills: 0, totalGachaPulls: 0, totalEnhances: 0, totalBossKills: 0 },
    lastActiveAt: Date.now(),
  }

  return { ...base, ...overrides }
}
