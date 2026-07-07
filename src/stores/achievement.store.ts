import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ACHIEVEMENT_DEFS } from '@/data/rewardData'
import type { AchievementProgress, AchievementReward } from '@/types/game'
import { useCurrencyStore } from './currency.store'
import { useInventoryStore } from './inventory.store'
import { useMetaStore } from './meta.store'
import { usePlayerStore } from './player.store'
import { useRewardStore } from './reward.store'
import { useStageStore } from './stage.store'

export const useAchievementStore = defineStore('achievement', () => {
  const progress = ref<Record<string, AchievementProgress>>({})

  const achievements = computed(() =>
    ACHIEVEMENT_DEFS.map((def) => {
      const current = getTrackValue(def.trackKey)
      const entry = progress.value[def.id]
      const claimed = entry?.claimed ?? false
      const complete = current >= def.target

      return {
        ...def,
        current: Math.min(current, def.target),
        claimed,
        complete,
        canClaim: complete && !claimed,
      }
    }),
  )

  const claimableCount = computed(() => achievements.value.filter((a) => a.canClaim).length)

  function getTrackValue(trackKey: string): number {
    const meta = useMetaStore()
    const player = usePlayerStore()
    const stage = useStageStore()
    const reward = useRewardStore()

    switch (trackKey) {
      case 'totalKills':
        return meta.stats.totalKills
      case 'totalBossKills':
        return meta.stats.totalBossKills
      case 'totalGachaPulls':
        return meta.stats.totalGachaPulls
      case 'totalEnhances':
        return meta.stats.totalEnhances
      case 'maxStage':
        return stage.maxClearedStage
      case 'level':
        return player.level
      case 'dailyStreak':
        return reward.dailyReward.streak
      default:
        return 0
    }
  }

  function applyReward(reward: AchievementReward): void {
    const currency = useCurrencyStore()
    const inventory = useInventoryStore()
    const player = usePlayerStore()

    if (reward.meso) currency.addGold(reward.meso)
    if (reward.potion) inventory.addConsumable('potion', reward.potion)
    if (reward.scroll) inventory.addConsumable('scroll', reward.scroll)
    if (reward.statPoints) player.addStatPoints(reward.statPoints)
  }

  function claim(achievementId: string): boolean {
    const ach = achievements.value.find((a) => a.id === achievementId)
    if (!ach || !ach.canClaim) return false

    applyReward(ach.reward)
    progress.value[achievementId] = { claimed: true }
    return true
  }

  function setProgress(data: Record<string, AchievementProgress>): void {
    progress.value = { ...data }
  }

  function collectProgress(): Record<string, AchievementProgress> {
    return { ...progress.value }
  }

  return {
    progress,
    achievements,
    claimableCount,
    claim,
    setProgress,
    collectProgress,
  }
})
