import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  compareEquipment,
  getEquipmentAttack,
  getEquipmentHp,
  getEnhanceCost,
  normalizeEquipmentList,
  rollEnhanceSuccess,
} from '@/services/equipmentService'
import type { EnhanceResult, Equipment, EquipmentSlot } from '@/types/game'
import { useCurrencyStore } from './currency.store'
import { useInventoryStore } from './inventory.store'
import { useMetaStore } from './meta.store'
import { usePlayerStore } from './player.store'

export const useEquipmentStore = defineStore('equipment', () => {
  const equipped = ref<Record<EquipmentSlot, Equipment | null>>({
    weapon: null,
    armor: null,
  })

  const lastEnhanceResult = ref<EnhanceResult | null>(null)

  const weaponAttackBonus = computed(() =>
    equipped.value.weapon ? getEquipmentAttack(equipped.value.weapon) : 0,
  )

  const armorHpBonus = computed(() =>
    equipped.value.armor ? getEquipmentHp(equipped.value.armor) : 0,
  )

  const totalAttackBonus = computed(() => weaponAttackBonus.value)
  const totalHpBonus = computed(() => armorHpBonus.value)

  function equip(item: Equipment): boolean {
    const inventory = useInventoryStore()
    const current = equipped.value[item.slot]

    if (!inventory.removeEquipment(item.id)) return false

    if (current) {
      inventory.addEquipment(current)
    }

    equipped.value[item.slot] = { ...item }
    syncPlayerStats()
    return true
  }

  function unequip(slot: EquipmentSlot): boolean {
    const item = equipped.value[slot]
    if (!item) return false

    const inventory = useInventoryStore()
    inventory.addEquipment(item)
    equipped.value[slot] = null
    syncPlayerStats()
    return true
  }

  function autoEquipIfBetter(item: Equipment): boolean {
    const current = equipped.value[item.slot]
    if (!current) return equip(item)
    if (compareEquipment(item, current) > 0) {
      const inventory = useInventoryStore()
      inventory.removeEquipment(item.id)
      inventory.addEquipment(current)
      equipped.value[item.slot] = { ...item }
      syncPlayerStats()
      return true
    }
    return false
  }

  function enhance(slot: EquipmentSlot, useScroll: boolean): EnhanceResult | null {
    const item = equipped.value[slot]
    if (!item) return null

    const currency = useCurrencyStore()
    const inventory = useInventoryStore()
    const cost = getEnhanceCost(item)

    if (!currency.spendGold(cost)) return null
    if (useScroll && !inventory.useConsumable('scroll')) {
      currency.addGold(cost)
      return null
    }

    const previousLevel = item.enhanceLevel
    const success = rollEnhanceSuccess(item, useScroll)

    if (success) {
      item.enhanceLevel += 1
    }

    const result: EnhanceResult = {
      success,
      previousLevel,
      newLevel: item.enhanceLevel,
    }

    lastEnhanceResult.value = result
    useMetaStore().incrementEnhances()
    syncPlayerStats()
    return result
  }

  function syncPlayerStats(): void {
    const player = usePlayerStore()
    player.syncHpToMax()
  }

  function setEquipped(weapon: Equipment | null, armor: Equipment | null): void {
    equipped.value.weapon = weapon ? normalizeEquipmentList([weapon])[0] : null
    equipped.value.armor = armor ? normalizeEquipmentList([armor])[0] : null
  }

  function getEnhanceCostForSlot(slot: EquipmentSlot): number {
    const item = equipped.value[slot]
    return item ? getEnhanceCost(item) : 0
  }

  return {
    equipped,
    lastEnhanceResult,
    weaponAttackBonus,
    armorHpBonus,
    totalAttackBonus,
    totalHpBonus,
    equip,
    unequip,
    autoEquipIfBetter,
    enhance,
    setEquipped,
    getEnhanceCostForSlot,
  }
})
