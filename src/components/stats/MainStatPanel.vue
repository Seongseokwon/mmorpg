<script setup lang="ts">
import { MAIN_STAT_DEFS } from '@/data/statData'
import { usePlayerStore } from '@/stores/player.store'
import type { MainStatId } from '@/types/game'

const player = usePlayerStore()

function allocate(statId: MainStatId): void {
  player.allocateStat(statId)
}
</script>

<template>
  <section class="main-stat panel">
    <div class="main-stat__header">
      <h2 class="panel__title">주 스탯</h2>
      <span v-if="player.statPoints > 0" class="main-stat__points" data-testid="main-stat-points">
        포인트 {{ player.statPoints }}
      </span>
    </div>

    <div class="main-stat__level">
      <span>Lv.{{ player.level }}</span>
      <div class="main-stat__exp-bar stat-bar">
        <div class="stat-bar__fill stat-bar__fill--exp" :style="{ width: `${player.expPercent}%` }" />
      </div>
      <span class="main-stat__exp-text">{{ player.exp }} / {{ player.expToNext }}</span>
    </div>

    <p class="main-stat__hint">레벨업 시 스탯 포인트 획득 · 몬스터 처치로 경험치</p>

    <div class="main-stat__grid">
      <button
        v-for="stat in MAIN_STAT_DEFS"
        :key="stat.id"
        class="main-stat__btn"
        :disabled="player.statPoints <= 0"
        :data-testid="`stat-alloc-${stat.id}`"
        @click="allocate(stat.id)"
      >
        <span class="main-stat__btn-name">{{ stat.shortName }}</span>
        <span class="main-stat__btn-value" :data-testid="`stat-value-${stat.id}`">{{ player.totalMainStats[stat.id] }}</span>
        <span class="main-stat__btn-effect">{{ stat.effectPerPoint }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.main-stat {
  padding: 0.75rem 1rem;
}

.main-stat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.main-stat__header .panel__title {
  margin-bottom: 0;
}

.main-stat__points {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-accent-gold);
  background: rgba(245, 197, 66, 0.15);
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
}

.main-stat__level {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
  font-size: 0.8rem;
}

.main-stat__exp-bar {
  height: 8px;
}

.stat-bar__fill--exp {
  background: linear-gradient(90deg, #5b9bd5, #7ec8ff);
}

.main-stat__exp-text {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.main-stat__hint {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.main-stat__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

.main-stat__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.35rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: border-color 0.15s, transform 0.1s;
}

.main-stat__btn:not(:disabled):active {
  transform: scale(0.96);
  border-color: var(--color-accent-gold);
}

.main-stat__btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.main-stat__btn-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-accent-gold);
}

.main-stat__btn-value {
  font-size: 1.1rem;
  font-weight: 800;
  /* 명시적으로 지정하지 않으면 버튼이 disabled(포인트 소진)될 때 브라우저 기본 비활성 텍스트
     색상(어두운 회색)이 적용되어 어두운 카드 배경과 거의 구분되지 않는다. */
  color: var(--color-text);
}

.main-stat__btn-effect {
  font-size: 0.6rem;
  color: var(--color-text-muted);
}
</style>
