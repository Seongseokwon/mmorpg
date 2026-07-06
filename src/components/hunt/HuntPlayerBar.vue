<script setup lang="ts">
import { usePlayerStore } from '@/stores/player.store'

const player = usePlayerStore()
</script>

<template>
  <div class="player-bar hunt-glass">
    <span class="player-bar__level overlay-text" data-testid="player-level">Lv.{{ player.level }}</span>
    <div class="player-bar__bars">
      <div class="bar-row">
        <span class="bar-label">HP</span>
        <div class="bar-track bar-track--hp">
          <div class="bar-fill bar-fill--hp" :style="{ width: `${player.hpPercent}%` }" />
        </div>
        <span class="bar-value overlay-text" data-testid="player-hp">{{ player.hp }}</span>
      </div>
      <div class="bar-row">
        <span class="bar-label">EXP</span>
        <div class="bar-track bar-track--exp">
          <div class="bar-fill bar-fill--exp" :style="{ width: `${player.expPercent}%` }" />
        </div>
        <span class="bar-value overlay-text" data-testid="player-exp">{{ player.expPercent }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.65rem;
  flex: 1;
  min-width: 0;
}

.player-bar__level {
  font-size: 0.85rem;
  font-weight: 800;
  color: #7ec8ff;
  flex-shrink: 0;
  min-width: 36px;
}

.player-bar__bars {
  flex: 1;
  min-width: 0;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.2rem;
}

.bar-row:last-child {
  margin-bottom: 0;
}

.bar-label {
  font-size: 0.58rem;
  color: rgba(255, 255, 255, 0.7);
  width: 26px;
  flex-shrink: 0;
  font-weight: 600;
}

.bar-track {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.2s ease;
}

.bar-fill--hp {
  background: linear-gradient(90deg, #ff6b8a, #e94560);
}

.bar-fill--exp {
  background: linear-gradient(90deg, #4ecca3, #2ecc71);
}

.bar-value {
  font-size: 0.58rem;
  color: rgba(255, 255, 255, 0.85);
  width: 32px;
  text-align: right;
  flex-shrink: 0;
}
</style>
