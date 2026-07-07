<script setup lang="ts">
import { useBattleStore } from '@/stores/battle.store'
import { BOSS_SCALE_MULTIPLIER, GROUND_Y_RATIO, MONSTER_HEIGHT_RATIO } from '@/game/layoutConstants'
import type { Monster } from '@/types/game'

const battle = useBattleStore()

// GameRenderer가 몬스터 발밑을 GROUND_Y_RATIO에, 키를 MONSTER_HEIGHT_RATIO만큼 그리므로
// 그 차이가 곧 몬스터 머리 위 y 좌표(스테이지 박스 높이 대비 비율)다. 보스는 그만큼 더 크게 그려지므로
// 머리 위 좌표도 그만큼 더 높이 올라가야 한다.
function headTopRatio(monster: Monster): number {
  const heightRatio = monster.isBoss ? MONSTER_HEIGHT_RATIO * BOSS_SCALE_MULTIPLIER : MONSTER_HEIGHT_RATIO
  return GROUND_Y_RATIO - heightRatio
}

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
      :class="{ 'monster-hp-bar--boss': monster.isBoss }"
      :data-testid="`monster-hp-bar-${monster.id}`"
      :style="{ left: `${monster.x * 100}%`, top: `${headTopRatio(monster) * 100}%` }"
    >
      <span v-if="monster.isBoss" class="monster-hp-bar__crown">👑</span>
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
  text-align: center;
}

.monster-hp-bar--boss {
  width: min(88px, 22vw);
}

.monster-hp-bar__crown {
  display: block;
  font-size: 1rem;
  line-height: 1;
  margin-bottom: 0.1rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}

.monster-hp-bar__track {
  height: 4px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  overflow: hidden;
}

.monster-hp-bar--boss .monster-hp-bar__track {
  height: 7px;
  border-color: #f5c542;
}

.monster-hp-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #ff5f6d, #ffc371);
  border-radius: 999px;
  transition: width 0.15s ease;
}

.monster-hp-bar--boss .monster-hp-bar__fill {
  background: linear-gradient(90deg, #c73652, #f5c542);
}
</style>
