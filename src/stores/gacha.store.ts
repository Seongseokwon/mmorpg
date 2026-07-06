import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  GACHA_MULTI_COST,
  GACHA_MULTI_COUNT,
  GACHA_PITY_THRESHOLD,
  GACHA_SINGLE_COST,
} from '@/data/rewardData'
import { pullGacha, pullGachaMulti } from '@/services/rewardService'
import type { Equipment } from '@/types/game'
import { useCurrencyStore } from './currency.store'
import { useEquipmentStore } from './equipment.store'
import { useInventoryStore } from './inventory.store'
import { useMetaStore } from './meta.store'
import { useStageStore } from './stage.store'

export const useGachaStore = defineStore('gacha', () => {
  const pityCounter = ref(0)
  const lastResults = ref<Equipment[]>([])
  const showResultModal = ref(false)

  function pullSingle(): Equipment[] | null {
    const currency = useCurrencyStore()
    if (!currency.spendGold(GACHA_SINGLE_COST)) return null

    const stage = useStageStore()
    const result = pullGacha(stage.currentStage, pityCounter.value)
    pityCounter.value = result.newPityCounter

    return finalizePull(result.items, 1)
  }

  function pullMulti(): Equipment[] | null {
    const currency = useCurrencyStore()
    if (!currency.spendGold(GACHA_MULTI_COST)) return null

    const stage = useStageStore()
    const result = pullGachaMulti(stage.currentStage, pityCounter.value, GACHA_MULTI_COUNT)
    pityCounter.value = result.newPityCounter

    return finalizePull(result.items, GACHA_MULTI_COUNT)
  }

  function finalizePull(items: Equipment[], pullCount: number): Equipment[] {
    const inventory = useInventoryStore()
    const equipment = useEquipmentStore()
    const meta = useMetaStore()

    for (const item of items) {
      if (!equipment.autoEquipIfBetter(item)) {
        inventory.addEquipment(item)
      }
    }

    meta.incrementGachaPulls(pullCount)
    lastResults.value = items
    showResultModal.value = true
    return items
  }

  function closeResultModal(): void {
    showResultModal.value = false
    lastResults.value = []
  }

  function setPityCounter(value: number): void {
    pityCounter.value = value
  }

  function pityRemaining(): number {
    return Math.max(0, GACHA_PITY_THRESHOLD - pityCounter.value)
  }

  return {
    pityCounter,
    lastResults,
    showResultModal,
    pullSingle,
    pullMulti,
    closeResultModal,
    setPityCounter,
    pityRemaining,
  }
})
