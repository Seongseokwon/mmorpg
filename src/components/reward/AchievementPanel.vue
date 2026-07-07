<script setup lang="ts">
import { useAchievementStore } from '@/stores/achievement.store'
import { formatNumber } from '@/services/damageCalc'
import type { AchievementReward } from '@/types/game'

const achievement = useAchievementStore()

function claim(id: string): void {
  achievement.claim(id)
}

function formatReward(reward: AchievementReward): string {
  const parts: string[] = []
  if (reward.meso) parts.push(`${formatNumber(reward.meso)} 루나`)
  if (reward.statPoints) parts.push(`스탯 포인트 +${reward.statPoints}`)
  if (reward.potion) parts.push(`체력 포션 x${reward.potion}`)
  if (reward.scroll) parts.push(`강화 주문서 x${reward.scroll}`)
  return parts.join(' · ')
}
</script>

<template>
  <section class="achievement panel">
    <p v-if="achievement.claimableCount > 0" class="achievement__hint">
      🎁 수령 가능한 업적 보상이 {{ achievement.claimableCount }}개 있어요
    </p>

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
          <div class="achievement__meta">
            <span class="achievement__count">{{ ach.current }} / {{ ach.target }}</span>
            <span class="achievement__reward">🎁 {{ formatReward(ach.reward) }}</span>
          </div>
        </div>
        <button
          v-if="ach.canClaim"
          class="btn btn--gold achievement__claim"
          :data-testid="`achievement-claim-${ach.id}`"
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

.achievement__hint {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-accent-gold);
  background: rgba(245, 197, 66, 0.12);
  border: 1px solid rgba(245, 197, 66, 0.35);
  border-radius: var(--radius-sm);
  padding: 0.45rem 0.6rem;
  margin-bottom: 0.5rem;
}

.achievement__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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

.achievement__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.achievement__count {
  font-size: 0.6rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.achievement__reward {
  font-size: 0.6rem;
  color: var(--color-accent-gold);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
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
