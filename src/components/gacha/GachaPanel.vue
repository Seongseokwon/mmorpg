<script setup lang="ts">
import { GACHA_MULTI_COST, GACHA_MULTI_COUNT, GACHA_RATES, GACHA_SINGLE_COST } from '@/data/rewardData'
import { RARITY_COLORS, RARITY_LABELS } from '@/data/gameData'
import { useGachaStore } from '@/stores/gacha.store'
import { useCurrencyStore } from '@/stores/currency.store'
import GachaResultModal from '@/components/gacha/GachaResultModal.vue'

const gacha = useGachaStore()
const currency = useCurrencyStore()
</script>

<template>
  <section class="gacha panel">
    <h2 class="panel__title">장비 뽑기</h2>

    <div class="gacha__rates">
      <span v-for="(rate, rarity) in GACHA_RATES" :key="rarity" :style="{ color: RARITY_COLORS[rarity] }">
        {{ RARITY_LABELS[rarity] }} {{ rate }}%
      </span>
    </div>

    <p class="gacha__pity">
      천장까지 {{ gacha.pityRemaining() }}회 (희귀 이상 확정)
    </p>

    <div class="gacha__actions">
      <button
        class="btn btn--gold gacha__btn"
        data-testid="gacha-pull-single"
        :disabled="currency.gold < GACHA_SINGLE_COST"
        @click="gacha.pullSingle()"
      >
        1회 뽑기
        <span class="gacha__cost">🌙 {{ GACHA_SINGLE_COST.toLocaleString() }}</span>
      </button>
      <button
        class="btn btn--primary gacha__btn"
        data-testid="gacha-pull-multi"
        :disabled="currency.gold < GACHA_MULTI_COST"
        @click="gacha.pullMulti()"
      >
        {{ GACHA_MULTI_COUNT }}회 뽑기
        <span class="gacha__cost">🌙 {{ GACHA_MULTI_COST.toLocaleString() }}</span>
      </button>
    </div>

    <GachaResultModal
      v-if="gacha.showResultModal"
      :items="gacha.lastResults"
      @close="gacha.closeResultModal()"
    />
  </section>
</template>

<style scoped>
.gacha {
  padding: 0.75rem 1rem;
}

.gacha__rates {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.6rem;
  font-size: 0.65rem;
  margin-bottom: 0.4rem;
}

.gacha__pity {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-bottom: 0.6rem;
}

.gacha__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.gacha__btn {
  flex-direction: column;
  padding: 0.65rem 0.5rem;
  min-height: 58px;
}

.gacha__cost {
  font-size: 0.72rem;
  opacity: 0.9;
}
</style>
