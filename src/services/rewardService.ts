import { GACHA_PITY_THRESHOLD, GACHA_RATES } from '@/data/rewardData'
import { createRandomEquipment } from '@/services/equipmentService'
import type { Equipment, EquipmentRarity } from '@/types/game'

const RARITY_ORDER: EquipmentRarity[] = ['common', 'uncommon', 'rare', 'epic']

function rollRarity(forceRarePlus = false): EquipmentRarity {
  if (forceRarePlus) {
    return Math.random() < 0.75 ? 'rare' : 'epic'
  }

  const roll = Math.random() * 100
  let cumulative = 0
  for (const rarity of RARITY_ORDER) {
    cumulative += GACHA_RATES[rarity]
    if (roll < cumulative) return rarity
  }
  return 'common'
}

function createGachaEquipment(stage: number, forceRarePlus = false): Equipment {
  const targetRarity = rollRarity(forceRarePlus)

  for (let attempt = 0; attempt < 8; attempt++) {
    const item = createRandomEquipment(stage)
    if (item.rarity === targetRarity) return item
    if (RARITY_ORDER.indexOf(item.rarity) >= RARITY_ORDER.indexOf(targetRarity)) {
      return item
    }
  }

  return createRandomEquipment(stage)
}

export function pullGacha(stage: number, pityCounter: number): {
  items: Equipment[]
  newPityCounter: number
} {
  const forceRarePlus = pityCounter + 1 >= GACHA_PITY_THRESHOLD
  const item = createGachaEquipment(stage, forceRarePlus)
  const isRarePlus = item.rarity === 'rare' || item.rarity === 'epic'
  const newPityCounter = isRarePlus ? 0 : pityCounter + 1

  return { items: [item], newPityCounter }
}

export function pullGachaMulti(stage: number, pityCounter: number, count = 10): {
  items: Equipment[]
  newPityCounter: number
} {
  const items: Equipment[] = []
  let counter = pityCounter

  for (let i = 0; i < count; i++) {
    const result = pullGacha(stage, counter)
    items.push(...result.items)
    counter = result.newPityCounter
  }

  return { items, newPityCounter: counter }
}

export interface OfflineRewardResult {
  meso: number
  exp: number
  hours: number
  shouldShow: boolean
}

export function calculateOfflineReward(
  lastActiveAt: number,
  stage: number,
  level: number,
): OfflineRewardResult {
  const now = Date.now()
  const elapsedMs = now - lastActiveAt
  const minMs = 5 * 60 * 1000

  if (elapsedMs < minMs) {
    return { meso: 0, exp: 0, hours: 0, shouldShow: false }
  }

  const hours = Math.min(8, elapsedMs / (60 * 60 * 1000))
  const meso = Math.floor(hours * (stage * 50 + level * 10))
  const exp = Math.floor(hours * (stage * 5 + level * 2))

  return { meso, exp, hours, shouldShow: meso > 0 || exp > 0 }
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isYesterday(dateStr: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return dateStr === yesterday.toISOString().slice(0, 10)
}
