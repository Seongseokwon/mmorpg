<script setup lang="ts">
import { useStageStore } from '@/stores/stage.store'
import { useBattleStore } from '@/stores/battle.store'

const stage = useStageStore()
const battle = useBattleStore()

function prevStage(): void {
  stage.prevStage()
  battle.resetMonsters()
}

function nextStage(): void {
  if (stage.currentStage < stage.maxClearedStage) {
    stage.goToStage(stage.currentStage + 1)
    battle.resetMonsters()
  }
}
</script>

<template>
  <section class="stage panel">
    <h2 class="panel__title">스테이지</h2>
    <div class="stage__controls">
      <button
        class="btn btn--secondary stage__arrow"
        data-testid="stage-prev"
        :disabled="stage.currentStage <= 1"
        @click="prevStage"
      >
        ◀
      </button>
      <div class="stage__info">
        <span class="stage__current" data-testid="stage-panel-current">{{ stage.currentStage }}</span>
        <span class="stage__cleared">최고 {{ stage.maxClearedStage }}</span>
      </div>
      <button
        class="btn btn--secondary stage__arrow"
        data-testid="stage-next"
        :disabled="stage.currentStage >= stage.maxClearedStage"
        @click="nextStage"
      >
        ▶
      </button>
    </div>
    <p class="stage__hint">3마리 처치마다 자동으로 다음 스테이지</p>
  </section>
</template>

<style scoped>
.stage {
  padding: 0.75rem 1rem;
}

.stage__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.stage__arrow {
  width: 40px;
  height: 40px;
  font-size: 0.9rem;
}

.stage__info {
  text-align: center;
  min-width: 80px;
}

.stage__current {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-accent-gold);
}

.stage__cleared {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.stage__hint {
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
