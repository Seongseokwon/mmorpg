import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { formatNumber } from '@/services/damageCalc'

export const useCurrencyStore = defineStore('currency', () => {
  const gold = ref(0)

  const formattedGold = computed(() => formatNumber(gold.value))

  function addGold(amount: number): void {
    if (amount <= 0) return
    gold.value += amount
  }

  function spendGold(amount: number): boolean {
    if (gold.value < amount) return false
    gold.value -= amount
    return true
  }

  function setGold(amount: number): void {
    gold.value = Math.max(0, amount)
  }

  return {
    gold,
    formattedGold,
    addGold,
    spendGold,
    setGold,
  }
})
