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
    // 얕은 스프레드({ ...progress.value })만 하면 Record는 새로 만들어져도 그 안의 각
    // { claimed } 객체는 여전히 Vue reactive Proxy 참조 그대로 남는다 — IndexedDB에 저장할 때
    // "Proxy object could not be cloned" 에러로 저장이 실패하는 원인이었다. 각 항목도 새로
    // 스프레드해서 완전히 순수한 객체로 만든다.
    const result: Record<string, AchievementProgress> = {}
    for (const [id, entry] of Object.entries(progress.value)) {
      result[id] = { ...entry }
    }
    return result
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
