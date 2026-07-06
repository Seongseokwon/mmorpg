import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MetaStats } from '@/types/game'

const DEFAULT_META: MetaStats = {
  totalKills: 0,
  totalGachaPulls: 0,
  totalEnhances: 0,
}

export const useMetaStore = defineStore('meta', () => {
  const stats = ref<MetaStats>({ ...DEFAULT_META })

  function incrementKills(amount = 1): void {
    stats.value.totalKills += amount
  }

  function incrementGachaPulls(amount = 1): void {
    stats.value.totalGachaPulls += amount
  }

  function incrementEnhances(amount = 1): void {
    stats.value.totalEnhances += amount
  }

  function setStats(data: MetaStats): void {
    stats.value = { ...data }
  }

  function collectStats(): MetaStats {
    return { ...stats.value }
  }

  return {
    stats,
    incrementKills,
    incrementGachaPulls,
    incrementEnhances,
    setStats,
    collectStats,
  }
})
