<script setup lang="ts">
import { useBattleStore } from '@/stores/battle.store'
import { GROUND_Y_RATIO, MONSTER_HEIGHT_RATIO } from '@/game/layoutConstants'

const battle = useBattleStore()

// GameRenderer가 몬스터 발밑을 GROUND_Y_RATIO에, 키를 MONSTER_HEIGHT_RATIO만큼 그리므로
// 그 차이가 곧 몬스터 머리 위 y 좌표(스테이지 박스 높이 대비 비율)다.
const HEAD_TOP_RATIO = GROUND_Y_RATIO - MONSTER_HEIGHT_RATIO

function hpPercent(hp: number, maxHp: number): number {
  return Math.max(0, (hp / maxHp) * 100)
}
</script>

<template>
  <div class="monster-hp-layer">
    <div
      v-for="monster in battle.monsters"
      :key="monster.id"
      class="monster-hp-bar"
      :data-testid="`monster-hp-bar-${monster.id}`"
      :style="{ left: `${monster.x * 100}%`, top: `${HEAD_TOP_RATIO * 100}%` }"
    >
      <div class="monster-hp-bar__track">
        <div
          class="monster-hp-bar__fill"
          :style="{ width: `${hpPercent(monster.hp, monster.maxHp)}%` }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.monster-hp-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 12;
}

.monster-hp-bar {
  position: absolute;
  transform: translate(-50%, -100%);
  width: min(48px, 13vw);
  padding-bottom: 0.25rem;
}

.monster-hp-bar__track {
  height: 4px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  overflow: hidden;
}

.monster-hp-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #ff5f6d, #ffc371);
  border-radius: 999px;
  transition: width 0.15s ease;
}
</style>
