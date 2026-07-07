import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { normalizeEquipmentList } from '@/services/equipmentService'
import { generateDefaultNickname } from '@/services/nicknameService'
import { rollInnateStats } from '@/services/statCalc'
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
    }).catch((error) => {
      // Safari 프라이빗 모드/쿼터 초과 등으로 열기 자체가 거부되면 캐시를 비워
      // 다음 시도(예: 재저장) 때 다시 열어보게 한다.
      dbPromise = null
      throw error
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
    version: 5,
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
      version: 5,
      nickname: raw.nickname ?? generateDefaultNickname(),
      gold: raw.gold ?? 0,
      level: raw.level ?? 1,
      exp: raw.exp ?? 0,
      statPoints: raw.statPoints ?? 0,
      mainStats: raw.mainStats ?? { ...defaults.mainStats },
      innateStats: raw.innateStats ?? { ...defaults.innateStats },
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
    version: 5,
    // 닉네임이 없던(v4 이하) 세이브에만 새로 발급한다 — 한 번 배정된 닉네임은 그대로 이어받는다.
    nickname: raw.nickname ?? generateDefaultNickname(),
    gold: raw.gold ?? 0,
    level: raw.level ?? 1,
    exp: raw.exp ?? 0,
    statPoints: raw.statPoints ?? 0,
    mainStats: raw.mainStats ?? { ...defaults.mainStats },
    innateStats: raw.innateStats ?? { ...defaults.innateStats },
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
    // 스프레드 병합: v4 저장 이후에 meta 필드가 추가되는 경우(예: totalBossKills)에도
    // 기존 세이브에 없던 키는 기본값으로 채워진다.
    meta: { ...defaults.meta, ...raw.meta },
    lastActiveAt: raw.lastActiveAt ?? Date.now(),
  }
}

export function createDefaultSaveData(): SaveData {
  return {
    version: 5,
    // 캐릭터 "생성" 시점에 딱 한 번 발급되는 기본 닉네임(#지역코드+타임스탬프+난수). innateStats와
    // 마찬가지로 이후 로드마다 raw.nickname을 그대로 이어받고 다시 발급하지 않는다.
    nickname: generateDefaultNickname(),
    gold: 0,
    level: 1,
    exp: 0,
    statPoints: 5,
    mainStats: { str: 0, vit: 0, dex: 0, luk: 0 },
    // 캐릭터 "생성" 시점 = 세이브가 아직 없을 때 이 함수가 호출되는 순간. 한 번 굴려진 값은
    // 이후 로드마다 raw.innateStats로 그대로 이어받고 다시 굴리지 않는다 (migrateSaveData 참고).
    innateStats: rollInnateStats(10),
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
}
