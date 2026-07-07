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
import { useAuthStore } from './auth.store'
import {
  createDefaultSaveData,
  loadSaveData,
  saveSaveData,
} from '@/services/saveService'
import { fetchCloudSave, pushCloudSave } from '@/api/save'
import type { SaveData } from '@/types/game'

let saveTimer: number | null = null

export const useSaveStore = defineStore('save', () => {
  const isLoaded = ref(false)
  // IndexedDB 접근(open/read/write)이 실패하면 false로 내려간다 — Safari 프라이빗 모드,
  // 쿼터 초과 등에서도 게임은 계속 플레이 가능해야 하므로 예외를 던지지 않고 상태로 노출한다.
  const isSaveAvailable = ref(true)

  /** 로그인 상태면 서버 세이브를 클라우드 저장소에도 반영한다(실패해도 로컬 플레이는 계속). */
  async function syncToCloud(data: SaveData): Promise<void> {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) return
    try {
      await auth.withAuthRetry((token) => pushCloudSave(token, data))
    } catch (error) {
      console.error('[save] 클라우드 저장 실패 — 로컬 저장은 유지됩니다.', error)
    }
  }

  async function load(): Promise<void> {
    let data: SaveData | null = null
    try {
      data = await loadSaveData()
    } catch (error) {
      console.error('[save] IndexedDB 불러오기 실패 — 저장 없이 진행합니다.', error)
      isSaveAvailable.value = false
    }

    const auth = useAuthStore()
    await auth.restoreSession()

    if (auth.isLoggedIn) {
      try {
        const cloud = await auth.withAuthRetry((token) => fetchCloudSave(token))
        if (cloud) {
          // 이 계정으로 이미 클라우드에 저장한 적 있음 — 클라우드를 기준으로 이 기기 상태를 맞춘다.
          data = cloud.data
        } else if (data) {
          // 첫 로그인 — 게스트로 쌓아둔 로컬 진행 상황을 그대로 클라우드에 올려 계정에 연결한다.
          void syncToCloud(data)
        }
      } catch (error) {
        console.error('[save] 클라우드 세이브 조회 실패 — 로컬 저장으로 진행합니다.', error)
      }
    }

    const finalData = data ?? createDefaultSaveData()
    applySaveData(finalData)
    isLoaded.value = true

    if (auth.isLoggedIn) {
      // 클라우드 데이터로 화면을 그렸다면 이 기기의 로컬 캐시(IndexedDB)도 같은 상태로 맞춰둔다.
      try {
        await saveSaveData(finalData)
        isSaveAvailable.value = true
      } catch (error) {
        console.error('[save] IndexedDB 저장 실패', error)
        isSaveAvailable.value = false
      }
    }

    const reward = useRewardStore()
    reward.setLastActiveAt(finalData.lastActiveAt ?? Date.now())
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
      innateStats: data.innateStats,
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
      innateStats: { ...player.innateStats },
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
      const data = collectSaveData()
      saveSaveData(data).then(
        () => {
          isSaveAvailable.value = true
        },
        (error) => {
          console.error('[save] IndexedDB 저장 실패', error)
          isSaveAvailable.value = false
        },
      )
      void syncToCloud(data)
    }, 1000)
  }

  async function saveNow(): Promise<void> {
    const data = collectSaveData()
    try {
      await saveSaveData(data)
      isSaveAvailable.value = true
    } catch (error) {
      console.error('[save] IndexedDB 저장 실패', error)
      isSaveAvailable.value = false
    }
    void syncToCloud(data)
  }

  return {
    isLoaded,
    isSaveAvailable,
    load,
    scheduleSave,
    saveNow,
  }
})
