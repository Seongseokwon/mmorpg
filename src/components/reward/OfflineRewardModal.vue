<script setup lang="ts">
import { useRewardStore } from '@/stores/reward.store'

const reward = useRewardStore()

function claim(): void {
  reward.claimOfflineReward()
}
</script>

<template>
  <div v-if="reward.showOfflineModal" class="modal-overlay" data-testid="offline-modal">
    <div class="modal panel">
      <h3 class="modal__title">💤 오프라인 보상</h3>
      <p class="modal__subtitle">
        {{ reward.offlineReward.hours.toFixed(1) }}시간 동안 모험한 보상입니다
      </p>
      <div class="modal__rewards">
        <div v-if="reward.offlineReward.meso > 0" class="modal__reward-row">
          <span>🌙 루나</span>
          <span>{{ reward.offlineReward.meso.toLocaleString() }}</span>
        </div>
        <div v-if="reward.offlineReward.exp > 0" class="modal__reward-row">
          <span>✨ 경험치</span>
          <span>{{ reward.offlineReward.exp.toLocaleString() }}</span>
        </div>
      </div>
      <button class="btn btn--gold modal__btn" data-testid="offline-claim" @click="claim">받기</button>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 1rem;
}

.modal {
  width: 100%;
  max-width: 300px;
  padding: 1.25rem;
  text-align: center;
}

.modal__title {
  color: #7ec8ff;
  margin-bottom: 0.35rem;
}

.modal__subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.modal__rewards {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.modal__reward-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.modal__btn {
  width: 100%;
}
</style>
