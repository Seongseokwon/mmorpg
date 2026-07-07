import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { STAT_POINTS_PER_LEVEL } from '@/data/statData'
import {
  getAttackFromMainStats,
  getExpToNextLevel,
  getHpFromMainStats,
  pickRandomMainStatId,
} from '@/services/statCalc'
import type { MainStatId, MainStats } from '@/types/game'
import { useEquipmentStore } from './equipment.store'

const DEFAULT_MAIN_STATS: MainStats = { str: 1, vit: 1, dex: 1, luk: 1 }
const DEFAULT_INNATE_STATS: MainStats = { str: 0, vit: 0, dex: 0, luk: 0 }

export const usePlayerStore = defineStore('player', () => {
  const level = ref(1)
  const exp = ref(0)
  const statPoints = ref(5)
  const mainStats = ref<MainStats>({ ...DEFAULT_MAIN_STATS })
  const innateStats = ref<MainStats>({ ...DEFAULT_INNATE_STATS })
  const hp = ref(getHpFromMainStats(mainStats.value))

  const expToNext = computed(() => getExpToNextLevel(level.value))
  const expPercent = computed(() => {
    const percent = Math.min(100, (exp.value / expToNext.value) * 100)
    return Math.round(percent * 1000) / 1000
  })

  // 전투 수치(공격력/HP/치명타/공속)는 항상 수동 배분(mainStats) + 선천 능력치(innateStats)의
  // 합계를 기준으로 계산한다. 선천 능력치는 플레이어가 직접 배분할 수 없다.
  const totalMainStats = computed<MainStats>(() => ({
    str: mainStats.value.str + innateStats.value.str,
    vit: mainStats.value.vit + innateStats.value.vit,
    dex: mainStats.value.dex + innateStats.value.dex,
    luk: mainStats.value.luk + innateStats.value.luk,
  }))

  const baseAttack = computed(() => getAttackFromMainStats(totalMainStats.value))
  const baseMaxHp = computed(() => getHpFromMainStats(totalMainStats.value))

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
      growInnateStats(1)
      levelsGained += 1
    }

    return levelsGained
  }

  function addStatPoints(amount: number): void {
    if (amount <= 0) return
    statPoints.value += amount
  }

  /** 선천 능력치를 무작위로 성장시킨다 (레벨업 1회당 1포인트). 플레이어가 직접 호출하지 않는다. */
  function growInnateStats(points: number): void {
    for (let i = 0; i < points; i++) {
      innateStats.value[pickRandomMainStatId()] += 1
    }
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
    innateStats: MainStats
  }): void {
    level.value = data.level
    exp.value = data.exp
    statPoints.value = data.statPoints
    mainStats.value = { ...data.mainStats }
    innateStats.value = { ...data.innateStats }
    syncHpToMax()
  }

  return {
    level,
    exp,
    statPoints,
    mainStats,
    innateStats,
    totalMainStats,
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
    addStatPoints,
    allocateStat,
    setPlayerData,
  }
})
