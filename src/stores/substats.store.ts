import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { SUB_STAT_DEFS } from '@/data/statData'
import {
  getSubAttackSpeedPercent,
  getSubCritDamage,
  getSubCritRate,
  getSubDropBonus,
  getSubMesoBonusPercent,
  getSubStatUpgradeCost,
  getTotalCritDamage,
  getTotalCritRate,
  getAttackIntervalMs,
} from '@/services/statCalc'
import type { SubStatId, SubStatLevels } from '@/types/game'
import { useCurrencyStore } from './currency.store'
import { usePlayerStore } from './player.store'

const DEFAULT_SUB_STATS: SubStatLevels = {
  crit_rate: 0,
  crit_damage: 0,
  attack_speed: 0,
  meso_bonus: 0,
  drop_rate: 0,
}

export const useSubStatsStore = defineStore('substats', () => {
  const levels = ref<SubStatLevels>({ ...DEFAULT_SUB_STATS })

  const critRate = computed(() => {
    const player = usePlayerStore()
    return getTotalCritRate(player.totalMainStats, levels.value)
  })

  const critDamage = computed(() => getTotalCritDamage(levels.value))

  const attackIntervalMs = computed(() => {
    const player = usePlayerStore()
    return getAttackIntervalMs(player.totalMainStats, levels.value)
  })

  const mesoBonusPercent = computed(() => getSubMesoBonusPercent(levels.value))

  const dropBonus = computed(() => getSubDropBonus(levels.value))

  function getLevel(statId: SubStatId): number {
    return levels.value[statId]
  }

  function getMaxLevel(statId: SubStatId): number {
    return SUB_STAT_DEFS.find((def) => def.id === statId)?.maxLevel ?? 50
  }

  function getUpgradeCost(statId: SubStatId): number {
    return getSubStatUpgradeCost(statId, levels.value[statId])
  }

  function getEffectText(statId: SubStatId): string {
    const level = levels.value[statId]
    switch (statId) {
      case 'crit_rate':
        return `+${getSubCritRate(levels.value).toFixed(1)}%`
      case 'crit_damage':
        return `+${getSubCritDamage(levels.value)}%`
      case 'attack_speed':
        return `-${getSubAttackSpeedPercent(levels.value).toFixed(1)}%`
      case 'meso_bonus':
        return `+${getSubMesoBonusPercent(levels.value)}%`
      case 'drop_rate':
        return `+${(getSubDropBonus(levels.value) * 100).toFixed(0)}%`
      default:
        return `Lv.${level}`
    }
  }

  function upgrade(statId: SubStatId): boolean {
    if (levels.value[statId] >= getMaxLevel(statId)) return false

    const currency = useCurrencyStore()
    const cost = getUpgradeCost(statId)
    if (!currency.spendGold(cost)) return false

    levels.value[statId] += 1
    return true
  }

  function setLevels(data: SubStatLevels): void {
    levels.value = { ...data }
  }

  function collectLevels(): SubStatLevels {
    return { ...levels.value }
  }

  return {
    levels,
    critRate,
    critDamage,
    attackIntervalMs,
    mesoBonusPercent,
    dropBonus,
    getLevel,
    getMaxLevel,
    getUpgradeCost,
    getEffectText,
    upgrade,
    setLevels,
    collectLevels,
  }
})
