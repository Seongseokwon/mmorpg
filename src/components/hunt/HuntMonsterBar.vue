<script setup lang="ts">
import { useBattleStore } from '@/stores/battle.store'

const battle = useBattleStore()
</script>

<template>
  <div v-if="battle.targetMonster" class="monster-bar hunt-glass" data-testid="monster-bar">
    <div class="monster-bar__header">
      <span class="monster-bar__name overlay-text" data-testid="monster-name">{{ battle.targetMonster.name }}</span>
      <span class="monster-bar__hp overlay-text" data-testid="monster-hp">{{ battle.targetMonster.hp }}/{{ battle.targetMonster.maxHp }}</span>
    </div>
    <div class="monster-bar__track">
      <div
        class="monster-bar__fill"
        :style="{ width: `${battle.monsterHpPercent}%` }"
      />
    </div>
  </div>
</template>

<style scoped>
.monster-bar {
  position: absolute;
  top: 4.2rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(220px, 55vw);
  padding: 0.35rem 0.55rem;
  z-index: 15;
}

.monster-bar__header {
  display: flex;
  justify-content: space-between;
  font-size: 0.68rem;
  margin-bottom: 0.2rem;
}

.monster-bar__name {
  font-weight: 700;
  color: #e8c4ff;
}

.monster-bar__hp {
  color: rgba(255, 255, 255, 0.75);
}

.monster-bar__track {
  height: 6px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 999px;
  overflow: hidden;
}

.monster-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #9b59b6, #e056fd);
  border-radius: 999px;
  transition: width 0.15s ease;
}
</style>
