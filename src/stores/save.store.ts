import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCurrencyStore } from './currency.store'
import { useEquipmentStore } from './equipment.store'
import { useInventoryStore } from './inventory.store'
import { usePlayerStore } from './player.store'
import { useSkillStore } from './skill.store'
import { useSubStatsStore } from './substats.store'
import { useStageStore } from './stage.store'
import { useGachaStore } from './gacha.store'
import { useAchievementStore } from './achievement.store'
import { useRewardStore } from './reward.store'
import { useMetaStore } from './meta.store'
import {
  createDefaultSaveData,
  loadSaveData,
  saveSaveData,
} from '@/services/saveService'
import type { SaveData } from '@/types/game'

let saveTimer: number | null = null

export const useSaveStore = defineStore('save', () => {
  const isLoaded = ref(false)
  // IndexedDB 접근(open/read/write)이 실패하면 false로 내려간다 — Safari 프라이빗 모드,
  // 쿼터 초과 등에서도 게임은 계속 플레이 가능해야 하므로 예외를 던지지 않고 상태로 노출한다.
  const isSaveAvailable = ref(true)

  async function load(): Promise<void> {
    let data: SaveData | null = null
    try {
      data = await loadSaveData()
    } catch (error) {
      console.error('[save] IndexedDB 불러오기 실패 — 저장 없이 진행합니다.', error)
      isSaveAvailable.value = false
    }

    applySaveData(data ?? createDefaultSaveData())
    isLoaded.value = true

    const reward = useRewardStore()
    reward.setLastActiveAt(data?.lastActiveAt ?? Date.now())
    reward.checkOfflineReward()
  }

  function applySaveData(data: SaveData): void {
    const currency = useCurrencyStore()
    const player = usePlayerStore()
    const stage = useStageStore()
    const inventory = useInventoryStore()
    const equipment = useEquipmentStore()
    const skill = useSkillStore()
    const subStats = useSubStatsStore()
    const gacha = useGachaStore()
    const achievement = useAchievementStore()
    const reward = useRewardStore()
    const meta = useMetaStore()

    currency.setGold(data.gold)
    player.setPlayerData({
      level: data.level,
      exp: data.exp,
      statPoints: data.statPoints,
      mainStats: data.mainStats,
    })
    subStats.setLevels(data.subStats)
    stage.setStage(data.currentStage, data.maxClearedStage)
    inventory.setEquipmentBag(data.equipmentBag)
    inventory.setConsumables(data.consumables)
    equipment.setEquipped(data.equippedWeapon, data.equippedArmor)
    skill.setLevels(data.skills)
    gacha.setPityCounter(data.gachaPity)
    achievement.setProgress(data.achievements)
    reward.setDailyReward(data.dailyReward)
    meta.setStats(data.meta)
    player.syncHpToMax()
  }

  function collectSaveData(): SaveData {
    const currency = useCurrencyStore()
    const player = usePlayerStore()
    const stage = useStageStore()
    const inventory = useInventoryStore()
    const equipment = useEquipmentStore()
    const skill = useSkillStore()
    const subStats = useSubStatsStore()
    const gacha = useGachaStore()
    const achievement = useAchievementStore()
    const reward = useRewardStore()
    const meta = useMetaStore()

    reward.touchActive()

    return {
      version: 4,
      gold: currency.gold,
      level: player.level,
      exp: player.exp,
      statPoints: player.statPoints,
      mainStats: { ...player.mainStats },
      subStats: subStats.collectLevels(),
      currentStage: stage.currentStage,
      maxClearedStage: stage.maxClearedStage,
      equipmentBag: inventory.equipmentBag.map((item) => ({ ...item })),
      equippedWeapon: equipment.equipped.weapon ? { ...equipment.equipped.weapon } : null,
      equippedArmor: equipment.equipped.armor ? { ...equipment.equipped.armor } : null,
      consumables: inventory.consumables.map((item) => ({ ...item })),
      skills: skill.collectLevels(),
      gachaPity: gacha.pityCounter,
      achievements: achievement.collectProgress(),
      dailyReward: reward.collectDailyReward(),
      meta: meta.collectStats(),
      lastActiveAt: reward.lastActiveAt,
    }
  }

  function scheduleSave(): void {
    if (!isLoaded.value) return
    if (saveTimer !== null) {
      window.clearTimeout(saveTimer)
    }
    saveTimer = window.setTimeout(() => {
      saveSaveData(collectSaveData()).then(
        () => {
          isSaveAvailable.value = true
        },
        (error) => {
          console.error('[save] IndexedDB 저장 실패', error)
          isSaveAvailable.value = false
        },
      )
    }, 1000)
  }

  async function saveNow(): Promise<void> {
    try {
      await saveSaveData(collectSaveData())
      isSaveAvailable.value = true
    } catch (error) {
      console.error('[save] IndexedDB 저장 실패', error)
      isSaveAvailable.value = false
    }
  }

  return {
    isLoaded,
    isSaveAvailable,
    load,
    scheduleSave,
    saveNow,
  }
})
