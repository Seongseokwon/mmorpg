import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ConsumableItem, Equipment } from '@/types/game'
import { normalizeEquipmentList } from '@/services/equipmentService'
import { usePlayerStore } from './player.store'

const DEFAULT_CONSUMABLES: ConsumableItem[] = [
  {
    id: 'potion',
    type: 'potion',
    name: '체력 포션',
    quantity: 3,
    description: '체력 30% 회복',
  },
  {
    id: 'scroll',
    type: 'scroll',
    name: '강화 주문서',
    quantity: 2,
    description: '강화 성공률 +15%',
  },
]

export const useInventoryStore = defineStore('inventory', () => {
  const equipmentBag = ref<Equipment[]>([])
  const consumables = ref<ConsumableItem[]>([...DEFAULT_CONSUMABLES])

  const equipmentCount = computed(() => equipmentBag.value.length)

  function addEquipment(item: Equipment): void {
    equipmentBag.value.push({ ...item })
  }

  function removeEquipment(id: string): boolean {
    const index = equipmentBag.value.findIndex((item) => item.id === id)
    if (index === -1) return false
    equipmentBag.value.splice(index, 1)
    return true
  }

  function addConsumable(id: string, amount = 1): void {
    const item = consumables.value.find((c) => c.id === id)
    if (item) {
      item.quantity += amount
    }
  }

  function useConsumable(id: string): boolean {
    const item = consumables.value.find((c) => c.id === id)
    if (!item || item.quantity <= 0) return false
    item.quantity -= 1
    return true
  }

  function usePotion(): boolean {
    if (!useConsumable('potion')) return false
    const player = usePlayerStore()
    const healAmount = Math.floor(player.maxHp * 0.3)
    player.heal(healAmount)
    return true
  }

  function getScrollCount(): number {
    return consumables.value.find((c) => c.id === 'scroll')?.quantity ?? 0
  }

  function setEquipmentBag(items: Equipment[]): void {
    equipmentBag.value = normalizeEquipmentList(items)
  }

  function setConsumables(items: ConsumableItem[]): void {
    consumables.value = items.length > 0 ? items.map((item) => ({ ...item })) : [...DEFAULT_CONSUMABLES]
  }

  return {
    equipmentBag,
    consumables,
    equipmentCount,
    addEquipment,
    removeEquipment,
    addConsumable,
    useConsumable,
    usePotion,
    getScrollCount,
    setEquipmentBag,
    setConsumables,
  }
})
