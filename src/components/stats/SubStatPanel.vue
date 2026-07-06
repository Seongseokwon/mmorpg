<script setup lang="ts">
import { SUB_STAT_DEFS } from '@/data/statData'
import { useSubStatsStore } from '@/stores/substats.store'
import { useCurrencyStore } from '@/stores/currency.store'
import type { SubStatId } from '@/types/game'

const subStats = useSubStatsStore()
const currency = useCurrencyStore()

function upgrade(statId: SubStatId): void {
  subStats.upgrade(statId)
}
</script>

<template>
  <section class="sub-stat panel">
    <h2 class="panel__title">서브 스탯 <span class="sub-stat__meso-label">(루나)</span></h2>
    <p class="sub-stat__hint">루나로 영구 강화 · 레벨업과 별도</p>

    <ul class="sub-stat__list">
      <li v-for="stat in SUB_STAT_DEFS" :key="stat.id" class="sub-stat__item">
        <div class="sub-stat__info">
          <span class="sub-stat__name">{{ stat.name }}</span>
          <span class="sub-stat__effect">
            Lv.{{ subStats.getLevel(stat.id) }}
            · 현재 {{ subStats.getEffectText(stat.id) }}
          </span>
        </div>
        <button
          class="btn btn--gold sub-stat__btn"
          :disabled="
            subStats.getLevel(stat.id) >= stat.maxLevel ||
            currency.gold < subStats.getUpgradeCost(stat.id)
          "
          @click="upgrade(stat.id)"
        >
          🌙 {{ subStats.getUpgradeCost(stat.id).toLocaleString() }}
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.sub-stat {
  padding: 0.75rem 1rem;
}

.sub-stat__meso-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-weight: 400;
  text-transform: none;
}

.sub-stat__hint {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
  margin-top: -0.25rem;
}

.sub-stat__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.sub-stat__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.45rem 0.55rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.sub-stat__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sub-stat__name {
  font-size: 0.78rem;
  font-weight: 600;
}

.sub-stat__effect {
  font-size: 0.62rem;
  color: var(--color-success);
}

.sub-stat__btn {
  font-size: 0.68rem;
  padding: 0.35rem 0.5rem;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
