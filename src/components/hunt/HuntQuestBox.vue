<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBattleStore } from '@/stores/battle.store'
import { useStageStore } from '@/stores/stage.store'
import { usePlayerStore } from '@/stores/player.store'

const battle = useBattleStore()
const stage = useStageStore()
const player = usePlayerStore()

const expanded = ref(false)

const phaseIcon = computed(() => (battle.stagePhase === 'boss' ? '👑' : '⚔️'))
const phaseLabel = computed(() => {
  if (battle.stagePhase === 'boss') return '보스전'
  if (battle.stagePhase === 'wave') return `웨이브 ${battle.waveIndex}/${battle.wavesPerStage}`
  return '파밍 중'
})

function startChallenge(): void {
  battle.startChallenge()
}
</script>

<template>
  <div class="quest-box">
    <div class="quest-box__summary hunt-glass">
      <button class="quest-box__summary-toggle" @click="expanded = !expanded">
        <span class="quest-box__icon">{{ phaseIcon }}</span>
        <span class="quest-box__label overlay-text" data-testid="quest-phase-label">{{ phaseLabel }}</span>
        <span class="quest-box__toggle overlay-text">{{ expanded ? '▲' : '▼' }}</span>
      </button>
      <button
        v-if="battle.stagePhase === 'farming'"
        class="quest-box__challenge-btn"
        data-testid="challenge-button"
        @click="startChallenge"
      >
        🚩 도전
      </button>
    </div>

    <div v-if="expanded" class="quest-box__detail hunt-glass">
      <div class="quest-box__item">
        <span class="quest-box__icon">📈</span>
        <span class="quest-box__label overlay-text">레벨 달성</span>
        <span class="quest-box__progress overlay-text">Lv.{{ player.level }}</span>
      </div>
      <div class="quest-box__item">
        <span class="quest-box__icon">🗺️</span>
        <span class="quest-box__label overlay-text">스테이지</span>
        <span class="quest-box__progress overlay-text">{{ stage.currentStage }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quest-box {
  position: absolute;
  top: 0.4rem;
  left: 0.4rem;
  z-index: 20;
  max-width: calc(100% - 0.8rem);
}

.quest-box__summary {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.4rem;
  width: 100%;
}

.quest-box__summary-toggle {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex: 1;
  min-width: 0;
  text-align: left;
  cursor: pointer;
}

.quest-box__challenge-btn {
  flex-shrink: 0;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.62rem;
  font-weight: 700;
  color: #3b2e00;
  background: linear-gradient(180deg, #f5c542, #d4a017);
  white-space: nowrap;
}

.quest-box__challenge-btn:active {
  transform: scale(0.95);
}

.quest-box__detail {
  margin-top: 0.25rem;
  padding: 0.25rem 0.5rem;
}

.quest-box__item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.quest-box__item:last-child {
  border-bottom: none;
}

.quest-box__icon {
  font-size: 0.8rem;
  flex-shrink: 0;
}

.quest-box__label {
  font-size: 0.65rem;
  color: #fff;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
}

.quest-box__progress {
  font-size: 0.62rem;
  color: #4ecca3;
  font-weight: 700;
  flex-shrink: 0;
}

.quest-box__toggle {
  font-size: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
  margin-left: 0.15rem;
}
</style>
