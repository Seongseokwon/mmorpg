<script setup lang="ts">
import { useAchievementStore } from '@/stores/achievement.store'

const achievement = useAchievementStore()

function claim(id: string): void {
  achievement.claim(id)
}
</script>

<template>
  <section class="achievement panel">
    <div class="achievement__header">
      <h2 class="panel__title">업적</h2>
      <span v-if="achievement.claimableCount > 0" class="achievement__badge">
        {{ achievement.claimableCount }}
      </span>
    </div>

    <ul class="achievement__list">
      <li
        v-for="ach in achievement.achievements"
        :key="ach.id"
        class="achievement__item"
        :class="{
          'achievement__item--complete': ach.complete,
          'achievement__item--claimed': ach.claimed,
        }"
      >
        <span class="achievement__icon">{{ ach.icon }}</span>
        <div class="achievement__info">
          <span class="achievement__name">{{ ach.name }}</span>
          <span class="achievement__desc">{{ ach.description }}</span>
          <div class="achievement__progress stat-bar">
            <div
              class="stat-bar__fill stat-bar__fill--achievement"
              :style="{ width: `${(ach.current / ach.target) * 100}%` }"
            />
          </div>
          <span class="achievement__count">{{ ach.current }} / {{ ach.target }}</span>
        </div>
        <button
          v-if="ach.canClaim"
          class="btn btn--gold achievement__claim"
          @click="claim(ach.id)"
        >
          수령
        </button>
        <span v-else-if="ach.claimed" class="achievement__done">✓</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.achievement {
  padding: 0.75rem 1rem;
}

.achievement__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.achievement__header .panel__title {
  margin-bottom: 0;
}

.achievement__badge {
  background: var(--color-accent);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
}

.achievement__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 220px;
  overflow-y: auto;
}

.achievement__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  opacity: 0.75;
}

.achievement__item--complete {
  opacity: 1;
  border-color: var(--color-accent-gold);
}

.achievement__item--claimed {
  opacity: 0.5;
}

.achievement__icon {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.achievement__info {
  flex: 1;
  min-width: 0;
}

.achievement__name {
  font-size: 0.78rem;
  font-weight: 700;
  display: block;
}

.achievement__desc {
  font-size: 0.62rem;
  color: var(--color-text-muted);
}

.achievement__progress {
  height: 4px;
  margin: 0.25rem 0 0.15rem;
}

.stat-bar__fill--achievement {
  background: linear-gradient(90deg, #c77dff, #e94560);
}

.achievement__count {
  font-size: 0.6rem;
  color: var(--color-text-muted);
}

.achievement__claim {
  font-size: 0.68rem;
  padding: 0.3rem 0.5rem;
  flex-shrink: 0;
}

.achievement__done {
  color: var(--color-success);
  font-weight: 700;
  flex-shrink: 0;
}
</style>
