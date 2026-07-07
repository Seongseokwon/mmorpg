<script setup lang="ts">
import { computed } from 'vue'
import { useStageStore } from '@/stores/stage.store'
import { useBattleStore } from '@/stores/battle.store'

const stage = useStageStore()
const battle = useBattleStore()

const phaseHint = computed(() => {
  if (battle.stagePhase === 'boss') return '보스전 진행 중...'
  if (battle.stagePhase === 'wave') return `웨이브 ${battle.waveIndex}/${battle.wavesPerStage} 진행 중...`
  return '웨이브를 모두 막아내고 보스를 처치하면 다음 스테이지로 진행합니다'
})

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

function startChallenge(): void {
  battle.startChallenge()
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

    <button
      v-if="battle.stagePhase === 'farming'"
      class="btn btn--gold stage__challenge"
      data-testid="stage-challenge-button"
      @click="startChallenge"
    >
      🚩 보스 도전
    </button>

    <p class="stage__hint">{{ phaseHint }}</p>
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

.stage__challenge {
  display: flex;
  width: 100%;
  margin-top: 0.75rem;
}

.stage__hint {
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
