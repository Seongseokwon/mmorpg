<script setup lang="ts">
import { ref } from 'vue'
import { RARITY_COLORS, RARITY_LABELS, WEAPON_ICONS, ARMOR_ICONS } from '@/data/gameData'
import {
  formatEquipmentPrimaryStat,
  getEnhanceCost,
  getEnhanceSuccessRate,
  getEquipmentStatRange,
  MAX_ENHANCE_LEVEL,
} from '@/services/equipmentService'
import { useEquipmentStore } from '@/stores/equipment.store'
import { useCurrencyStore } from '@/stores/currency.store'
import { useInventoryStore } from '@/stores/inventory.store'
import type { EquipmentSlot } from '@/types/game'
import EnhanceModal from '@/components/modal/EnhanceModal.vue'

const equipment = useEquipmentStore()
const currency = useCurrencyStore()
const inventory = useInventoryStore()

const enhanceSlot = ref<EquipmentSlot | null>(null)

function openEnhance(slot: EquipmentSlot): void {
  if (equipment.equipped[slot]) {
    enhanceSlot.value = slot
  }
}

function closeEnhance(): void {
  enhanceSlot.value = null
}

function unequip(slot: EquipmentSlot): void {
  equipment.unequip(slot)
}

function getIcon(slot: EquipmentSlot): string {
  return slot === 'weapon' ? WEAPON_ICONS[0] : ARMOR_ICONS[2]
}

function getStat(item: NonNullable<typeof equipment.equipped.weapon>): string {
  return formatEquipmentPrimaryStat(item)
}

function getRangeText(item: NonNullable<typeof equipment.equipped.weapon>): string {
  const range = getEquipmentStatRange(item)
  return `옵션 ${range.label} ${range.min}~${range.max}`
}

function isMaxEnhanced(item: NonNullable<typeof equipment.equipped.weapon>): boolean {
  return item.enhanceLevel >= MAX_ENHANCE_LEVEL
}
</script>

<template>
  <section class="equipment panel">
    <h2 class="panel__title">장비</h2>
    <div class="equipment__slots">
      <div
        v-for="slot in (['weapon', 'armor'] as EquipmentSlot[])"
        :key="slot"
        class="equipment__slot"
        :class="{ 'equipment__slot--empty': !equipment.equipped[slot] }"
        :data-testid="`equipment-slot-${slot}`"
      >
        <template v-if="equipment.equipped[slot]">
          <div class="equipment__header">
            <span class="equipment__icon">{{ getIcon(slot) }}</span>
            <div class="equipment__info">
              <span
                class="equipment__name"
                :style="{ color: RARITY_COLORS[equipment.equipped[slot]!.rarity] }"
              >
                {{ equipment.equipped[slot]!.name }}
              </span>
              <span class="equipment__meta" :data-testid="`equipment-level-${slot}`">
                +{{ equipment.equipped[slot]!.enhanceLevel }}
                · {{ RARITY_LABELS[equipment.equipped[slot]!.rarity] }}
              </span>
            </div>
          </div>
          <span class="equipment__stat" :data-testid="`equipment-stat-${slot}`">{{ getStat(equipment.equipped[slot]!) }}</span>
          <span class="equipment__range">{{ getRangeText(equipment.equipped[slot]!) }}</span>
          <div class="equipment__actions">
            <button
              class="btn btn--gold equipment__btn"
              :data-testid="`equip-enhance-${slot}`"
              @click="openEnhance(slot)"
            >
              <template v-if="isMaxEnhanced(equipment.equipped[slot]!)">최대 강화 (+{{ MAX_ENHANCE_LEVEL }})</template>
              <template v-else>강화 🌙{{ getEnhanceCost(equipment.equipped[slot]!).toLocaleString() }}</template>
            </button>
            <button
              class="btn btn--secondary equipment__btn"
              :data-testid="`equip-unequip-${slot}`"
              @click="unequip(slot)"
            >
              해제
            </button>
          </div>
        </template>
        <template v-else>
          <span class="equipment__empty-icon">{{ getIcon(slot) }}</span>
          <span class="equipment__empty-text">{{ slot === 'weapon' ? '무기 없음' : '방어구 없음' }}</span>
        </template>
      </div>
    </div>

    <EnhanceModal
      v-if="enhanceSlot && equipment.equipped[enhanceSlot]"
      :slot-type="enhanceSlot"
      :item="equipment.equipped[enhanceSlot]!"
      :scroll-count="inventory.getScrollCount()"
      :gold="currency.gold"
      :success-rate="getEnhanceSuccessRate(equipment.equipped[enhanceSlot]!, false)"
      :success-rate-with-scroll="getEnhanceSuccessRate(equipment.equipped[enhanceSlot]!, true)"
      @close="closeEnhance"
    />
  </section>
</template>

<style scoped>
.equipment {
  padding: 0.75rem 1rem;
}

.equipment__slots {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.equipment__slot {
  padding: 0.6rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.equipment__slot--empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.6;
}

.equipment__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}

.equipment__icon {
  font-size: 1.4rem;
}

.equipment__info {
  display: flex;
  flex-direction: column;
}

.equipment__name {
  font-size: 0.85rem;
  font-weight: 700;
}

.equipment__meta {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.equipment__stat {
  font-size: 0.75rem;
  color: var(--color-success);
  margin-bottom: 0.15rem;
}

.equipment__range {
  display: block;
  font-size: 0.65rem;
  color: var(--color-text-muted);
  margin-bottom: 0.4rem;
}

.equipment__actions {
  display: flex;
  gap: 0.35rem;
}

.equipment__btn {
  flex: 1;
  font-size: 0.72rem;
  padding: 0.4rem;
}

.equipment__empty-icon {
  font-size: 1.2rem;
  opacity: 0.5;
}

.equipment__empty-text {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
