<script setup lang="ts">
import { ref } from 'vue'
import { RARITY_COLORS, RARITY_LABELS } from '@/data/gameData'
import {
  formatEquipmentPrimaryStat,
  getEquipmentStatRange,
} from '@/services/equipmentService'
import { useInventoryStore } from '@/stores/inventory.store'
import { useEquipmentStore } from '@/stores/equipment.store'
import type { Equipment } from '@/types/game'

type Tab = 'equipment' | 'consumable'

const inventory = useInventoryStore()
const equipment = useEquipmentStore()
const activeTab = ref<Tab>('equipment')

function equipItem(item: Equipment): void {
  equipment.equip(item)
}

function getStatText(item: Equipment): string {
  return formatEquipmentPrimaryStat(item)
}

function getRangeText(item: Equipment): string {
  const range = getEquipmentStatRange(item)
  return `${range.label} ${range.min}~${range.max}`
}

function usePotion(): void {
  inventory.usePotion()
}
</script>

<template>
  <section class="inventory panel">
    <div class="inventory__tabs">
      <button
        class="inventory__tab"
        :class="{ 'inventory__tab--active': activeTab === 'equipment' }"
        @click="activeTab = 'equipment'"
      >
        장비 ({{ inventory.equipmentCount }})
      </button>
      <button
        class="inventory__tab"
        :class="{ 'inventory__tab--active': activeTab === 'consumable' }"
        @click="activeTab = 'consumable'"
      >
        소모품
      </button>
    </div>

    <ul v-if="activeTab === 'equipment'" class="inventory__list">
      <li v-if="inventory.equipmentBag.length === 0" class="inventory__empty">
        몬스터 처치 시 장비가 드롭됩니다
      </li>
      <li v-for="item in inventory.equipmentBag" :key="item.id" class="inventory__item">
        <div class="inventory__item-info">
          <span class="inventory__name" :style="{ color: RARITY_COLORS[item.rarity] }">
            {{ item.name }} +{{ item.enhanceLevel }}
          </span>
          <span class="inventory__meta">
            {{ RARITY_LABELS[item.rarity] }} · {{ getStatText(item) }}
          </span>
          <span class="inventory__range">옵션 {{ getRangeText(item) }}</span>
        </div>
        <button class="btn btn--primary inventory__action" @click="equipItem(item)">장착</button>
      </li>
    </ul>

    <ul v-else class="inventory__list">
      <li v-for="item in inventory.consumables" :key="item.id" class="inventory__item">
        <div class="inventory__item-info">
          <span class="inventory__name">{{ item.name }}</span>
          <span class="inventory__meta">{{ item.description }}</span>
        </div>
        <div class="inventory__item-right">
          <span class="inventory__qty">x{{ item.quantity }}</span>
          <button
            v-if="item.type === 'potion'"
            class="btn btn--secondary inventory__action"
            :disabled="item.quantity <= 0"
            @click="usePotion"
          >
            사용
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.inventory {
  padding: 0.75rem 1rem;
}

.inventory__tabs {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
}

.inventory__tab {
  flex: 1;
  padding: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  background: var(--color-bg-card);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.inventory__tab--active {
  color: var(--color-accent-gold);
  border-color: var(--color-accent-gold);
}

.inventory__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 160px;
  overflow-y: auto;
}

.inventory__empty {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: 0.75rem;
}

.inventory__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.45rem 0.6rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  gap: 0.5rem;
}

.inventory__item-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.inventory__item-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.inventory__name {
  font-size: 0.8rem;
  font-weight: 600;
}

.inventory__meta {
  font-size: 0.68rem;
  color: var(--color-text-muted);
}

.inventory__range {
  font-size: 0.62rem;
  color: var(--color-text-muted);
  opacity: 0.85;
}

.inventory__qty {
  color: var(--color-accent-gold);
  font-weight: 700;
  font-size: 0.8rem;
}

.inventory__action {
  font-size: 0.7rem;
  padding: 0.3rem 0.5rem;
  white-space: nowrap;
}
</style>
