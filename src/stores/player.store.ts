import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { STAT_POINTS_PER_LEVEL } from '@/data/statData'
import {
  getAttackFromMainStats,
  getExpToNextLevel,
  getHpFromMainStats,
} from '@/services/statCalc'
import type { MainStatId, MainStats } from '@/types/game'
import { useEquipmentStore } from './equipment.store'

const DEFAULT_MAIN_STATS: MainStats = { str: 1, vit: 1, dex: 1, luk: 1 }

export const usePlayerStore = defineStore('player', () => {
  const level = ref(1)
  const exp = ref(0)
  const statPoints = ref(5)
  const mainStats = ref<MainStats>({ ...DEFAULT_MAIN_STATS })
  const hp = ref(getHpFromMainStats(mainStats.value))

  const expToNext = computed(() => getExpToNextLevel(level.value))
  const expPercent = computed(() => {
    const percent = Math.min(100, (exp.value / expToNext.value) * 100)
    return Math.round(percent * 1000) / 1000
  })

  const baseAttack = computed(() => getAttackFromMainStats(mainStats.value))
  const baseMaxHp = computed(() => getHpFromMainStats(mainStats.value))

  const attack = computed(() => {
    const equipment = useEquipmentStore()
    return baseAttack.value + equipment.totalAttackBonus
  })

  const maxHp = computed(() => {
    const equipment = useEquipmentStore()
    return baseMaxHp.value + equipment.totalHpBonus
  })

  const hpPercent = computed(() => Math.max(0, Math.min(100, (hp.value / maxHp.value) * 100)))

  function syncHpToMax(): void {
    hp.value = maxHp.value
  }

  function takeDamage(amount: number): void {
    hp.value = Math.max(0, hp.value - amount)
  }

  function heal(amount: number): void {
    hp.value = Math.min(maxHp.value, hp.value + amount)
  }

  function addExp(amount: number): number {
    if (amount <= 0) return 0
    exp.value += amount
    let levelsGained = 0

    while (exp.value >= getExpToNextLevel(level.value)) {
      exp.value -= getExpToNextLevel(level.value)
      level.value += 1
      statPoints.value += STAT_POINTS_PER_LEVEL
      levelsGained += 1
    }

    return levelsGained
  }

  function allocateStat(statId: MainStatId): boolean {
    if (statPoints.value <= 0) return false
    mainStats.value[statId] += 1
    statPoints.value -= 1
    syncHpToMax()
    return true
  }

  function setPlayerData(data: {
    level: number
    exp: number
    statPoints: number
    mainStats: MainStats
  }): void {
    level.value = data.level
    exp.value = data.exp
    statPoints.value = data.statPoints
    mainStats.value = { ...data.mainStats }
    syncHpToMax()
  }

  return {
    level,
    exp,
    statPoints,
    mainStats,
    hp,
    expToNext,
    expPercent,
    baseAttack,
    baseMaxHp,
    attack,
    maxHp,
    hpPercent,
    syncHpToMax,
    takeDamage,
    heal,
    addExp,
    allocateStat,
    setPlayerData,
  }
})
