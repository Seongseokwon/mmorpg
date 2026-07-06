<script setup lang="ts">
import { DAILY_REWARDS } from '@/data/rewardData'
import { useRewardStore } from '@/stores/reward.store'

const reward = useRewardStore()

function claim(): void {
  reward.claimDaily()
}
</script>

<template>
  <section class="daily panel">
    <h2 class="panel__title">일일 보상</h2>
    <p class="daily__streak" data-testid="daily-streak">
      연속 출석 <strong>{{ reward.dailyReward.streak }}</strong>일
      <span v-if="!reward.canClaimDaily"> · 오늘 수령 완료</span>
    </p>

    <div class="daily__today" v-if="reward.canClaimDaily" data-testid="daily-claim-box">
      <span class="daily__today-label">오늘의 보상</span>
      <span class="daily__today-value">{{ reward.todayReward.label }}</span>
      <button class="btn btn--gold daily__claim" data-testid="daily-claim" @click="claim">보상 받기</button>
    </div>

    <ul class="daily__calendar">
      <li
        v-for="(day, index) in DAILY_REWARDS"
        :key="day.day"
        class="daily__day"
        :class="{
          'daily__day--done': index < reward.dailyReward.streak && !reward.canClaimDaily,
          'daily__day--current': reward.canClaimDaily && index === reward.dailyReward.streak % DAILY_REWARDS.length,
        }"
      >
        <span class="daily__day-num">{{ day.day }}일</span>
        <span class="daily__day-reward">{{ day.meso > 0 ? `${day.meso}` : '' }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.daily {
  padding: 0.75rem 1rem;
}

.daily__streak {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.daily__streak strong {
  color: var(--color-accent-gold);
}

.daily__today {
  text-align: center;
  padding: 0.6rem;
  background: rgba(245, 197, 66, 0.1);
  border: 1px solid var(--color-accent-gold);
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
}

.daily__today-label {
  display: block;
  font-size: 0.65rem;
  color: var(--color-text-muted);
}

.daily__today-value {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-accent-gold);
  margin: 0.25rem 0 0.5rem;
}

.daily__claim {
  width: 100%;
}

.daily__calendar {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.daily__day {
  text-align: center;
  padding: 0.3rem 0.15rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-size: 0.55rem;
  border: 1px solid transparent;
}

.daily__day--done {
  opacity: 0.5;
  background: rgba(78, 204, 163, 0.15);
}

.daily__day--current {
  border-color: var(--color-accent-gold);
}

.daily__day-num {
  display: block;
  font-weight: 700;
}

.daily__day-reward {
  color: var(--color-text-muted);
}
</style>
