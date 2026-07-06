<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBattleStore } from '@/stores/battle.store'
import { useStageStore } from '@/stores/stage.store'
import { usePlayerStore } from '@/stores/player.store'

const battle = useBattleStore()
const stage = useStageStore()
const player = usePlayerStore()

const expanded = ref(false)
const killProgress = computed(() => battle.killCount % 3)
</script>

<template>
  <div class="quest-box">
    <button class="quest-box__summary hunt-glass" @click="expanded = !expanded">
      <span class="quest-box__icon">⚔️</span>
      <span class="quest-box__label overlay-text">몬스터 처치</span>
      <span class="quest-box__progress overlay-text">{{ killProgress }}/3</span>
      <span class="quest-box__toggle overlay-text">{{ expanded ? '▲' : '▼' }}</span>
    </button>

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
  padding: 0.3rem 0.5rem;
  width: 100%;
  text-align: left;
  cursor: pointer;
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
