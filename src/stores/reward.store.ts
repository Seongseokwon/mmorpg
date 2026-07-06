import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DAILY_REWARDS } from '@/data/rewardData'
import {
  calculateOfflineReward,
  getTodayDateString,
  isYesterday,
} from '@/services/rewardService'
import type { DailyRewardState } from '@/types/game'
import { useCurrencyStore } from './currency.store'
import { useInventoryStore } from './inventory.store'
import { usePlayerStore } from './player.store'
import { useStageStore } from './stage.store'

export const useRewardStore = defineStore('reward', () => {
  const dailyReward = ref<DailyRewardState>({ lastClaimDate: '', streak: 0 })
  const lastActiveAt = ref(Date.now())
  const offlineReward = ref({ meso: 0, exp: 0, hours: 0 })
  const showOfflineModal = ref(false)

  const canClaimDaily = computed(() => dailyReward.value.lastClaimDate !== getTodayDateString())

  const todayReward = computed(() => {
    const dayIndex = canClaimDaily.value
      ? dailyReward.value.streak % DAILY_REWARDS.length
      : (dailyReward.value.streak - 1 + DAILY_REWARDS.length) % DAILY_REWARDS.length
    return DAILY_REWARDS[dayIndex]
  })

  function claimDaily(): boolean {
    if (!canClaimDaily.value) return false

    const today = getTodayDateString()
    const { lastClaimDate, streak } = dailyReward.value

    if (lastClaimDate && isYesterday(lastClaimDate)) {
      dailyReward.value.streak = streak + 1
    } else if (lastClaimDate && lastClaimDate !== today) {
      dailyReward.value.streak = 1
    } else if (!lastClaimDate) {
      dailyReward.value.streak = 1
    }

    dailyReward.value.lastClaimDate = today
    const reward = DAILY_REWARDS[(dailyReward.value.streak - 1) % DAILY_REWARDS.length]
    applyPackage(reward.meso, reward.potion, reward.scroll)
    return true
  }

  function applyPackage(meso: number, potion: number, scroll: number): void {
    const currency = useCurrencyStore()
    const inventory = useInventoryStore()

    if (meso > 0) currency.addGold(meso)
    if (potion > 0) inventory.addConsumable('potion', potion)
    if (scroll > 0) inventory.addConsumable('scroll', scroll)
  }

  function checkOfflineReward(): void {
    const player = usePlayerStore()
    const stage = useStageStore()
    const result = calculateOfflineReward(lastActiveAt.value, stage.currentStage, player.level)

    if (result.shouldShow) {
      offlineReward.value = { meso: result.meso, exp: result.exp, hours: result.hours }
      showOfflineModal.value = true
    }

    touchActive()
  }

  function claimOfflineReward(): void {
    const currency = useCurrencyStore()
    const player = usePlayerStore()

    currency.addGold(offlineReward.value.meso)
    player.addExp(offlineReward.value.exp)
    showOfflineModal.value = false
    offlineReward.value = { meso: 0, exp: 0, hours: 0 }
  }

  function touchActive(): void {
    lastActiveAt.value = Date.now()
  }

  function setDailyReward(data: DailyRewardState): void {
    dailyReward.value = { ...data }
  }

  function setLastActiveAt(timestamp: number): void {
    lastActiveAt.value = timestamp
  }

  function collectDailyReward(): DailyRewardState {
    return { ...dailyReward.value }
  }

  return {
    dailyReward,
    lastActiveAt,
    offlineReward,
    showOfflineModal,
    canClaimDaily,
    todayReward,
    claimDaily,
    checkOfflineReward,
    claimOfflineReward,
    touchActive,
    setDailyReward,
    setLastActiveAt,
    collectDailyReward,
  }
})
