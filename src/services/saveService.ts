import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { normalizeEquipmentList } from '@/services/equipmentService'
import type { Equipment, MainStats, SaveData } from '@/types/game'

interface MmorpgDB extends DBSchema {
  save: {
    key: string
    value: SaveData
  }
}

const DB_NAME = 'mmorpg-idle'
const DB_VERSION = 1
const SAVE_KEY = 'main'

let dbPromise: Promise<IDBPDatabase<MmorpgDB>> | null = null

function getDb(): Promise<IDBPDatabase<MmorpgDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MmorpgDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('save')) {
          db.createObjectStore('save')
        }
      },
    })
  }
  return dbPromise
}

export async function loadSaveData(): Promise<SaveData | null> {
  const db = await getDb()
  const raw = await db.get('save', SAVE_KEY)
  if (!raw) return null
  return migrateSaveData(raw as Partial<SaveData> & Record<string, unknown>)
}

export async function saveSaveData(data: SaveData): Promise<void> {
  const db = await getDb()
  await db.put('save', data, SAVE_KEY)
}

function normalizeEquipped(item: Equipment | null | undefined): Equipment | null {
  if (!item) return null
  return normalizeEquipmentList([item])[0]
}

function migrateFromV2(raw: Partial<SaveData>): SaveData {
  const defaults = createDefaultSaveData()
  const attackLevel = raw.attackLevel ?? 0
  const hpLevel = raw.hpLevel ?? 0

  const mainStats: MainStats = {
    str: attackLevel * 2,
    vit: hpLevel * 2,
    dex: 0,
    luk: 0,
  }

  return {
    ...defaults,
    version: 4,
    gold: raw.gold ?? defaults.gold,
    level: Math.max(1, 1 + Math.floor((attackLevel + hpLevel) / 4)),
    exp: raw.exp ?? 0,
    statPoints: defaults.statPoints,
    mainStats,
    currentStage: raw.currentStage ?? defaults.currentStage,
    maxClearedStage: raw.maxClearedStage ?? defaults.maxClearedStage,
    equipmentBag: normalizeEquipmentList(raw.equipmentBag ?? []),
    equippedWeapon: normalizeEquipped(raw.equippedWeapon),
    equippedArmor: normalizeEquipped(raw.equippedArmor),
    consumables: raw.consumables ?? defaults.consumables,
    skills: raw.skills ?? defaults.skills,
    subStats: raw.subStats ?? defaults.subStats,
  }
}

function migrateSaveData(raw: Partial<SaveData> & Record<string, unknown>): SaveData {
  const defaults = createDefaultSaveData()

  if (!raw.version || raw.version < 2) {
    return migrateFromV2({
      ...raw,
      attackLevel: (raw.attackLevel as number) ?? 0,
      hpLevel: (raw.hpLevel as number) ?? 0,
    })
  }

  if (raw.version < 3) {
    return migrateFromV2(raw)
  }

  if (raw.version < 4) {
    return {
      version: 4,
      gold: raw.gold ?? 0,
      level: raw.level ?? 1,
      exp: raw.exp ?? 0,
      statPoints: raw.statPoints ?? 0,
      mainStats: raw.mainStats ?? { ...defaults.mainStats },
      subStats: raw.subStats ?? { ...defaults.subStats },
      currentStage: raw.currentStage ?? 1,
      maxClearedStage: raw.maxClearedStage ?? 1,
      equipmentBag: normalizeEquipmentList(raw.equipmentBag ?? []),
      equippedWeapon: normalizeEquipped(raw.equippedWeapon),
      equippedArmor: normalizeEquipped(raw.equippedArmor),
      consumables: raw.consumables ?? defaults.consumables,
      skills: raw.skills ?? defaults.skills,
      gachaPity: 0,
      achievements: {},
      dailyReward: { ...defaults.dailyReward },
      meta: { ...defaults.meta },
      lastActiveAt: Date.now(),
    }
  }

  return {
    version: 4,
    gold: raw.gold ?? 0,
    level: raw.level ?? 1,
    exp: raw.exp ?? 0,
    statPoints: raw.statPoints ?? 0,
    mainStats: raw.mainStats ?? { ...defaults.mainStats },
    subStats: raw.subStats ?? { ...defaults.subStats },
    currentStage: raw.currentStage ?? 1,
    maxClearedStage: raw.maxClearedStage ?? 1,
    equipmentBag: normalizeEquipmentList(raw.equipmentBag ?? []),
    equippedWeapon: normalizeEquipped(raw.equippedWeapon),
    equippedArmor: normalizeEquipped(raw.equippedArmor),
    consumables: raw.consumables ?? defaults.consumables,
    skills: raw.skills ?? defaults.skills,
    gachaPity: raw.gachaPity ?? 0,
    achievements: raw.achievements ?? {},
    dailyReward: raw.dailyReward ?? { ...defaults.dailyReward },
    meta: raw.meta ?? { ...defaults.meta },
    lastActiveAt: raw.lastActiveAt ?? Date.now(),
  }
}

export function createDefaultSaveData(): SaveData {
  return {
    version: 4,
    gold: 0,
    level: 1,
    exp: 0,
    statPoints: 5,
    mainStats: { str: 0, vit: 0, dex: 0, luk: 0 },
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
    meta: { totalKills: 0, totalGachaPulls: 0, totalEnhances: 0 },
    lastActiveAt: Date.now(),
  }
}
