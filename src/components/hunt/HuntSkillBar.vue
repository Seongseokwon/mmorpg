<script setup lang="ts">
import { SKILL_DEFINITIONS } from '@/data/gameData'
import { useSkillStore } from '@/stores/skill.store'
import { useBattleStore } from '@/stores/battle.store'

const skill = useSkillStore()
const battle = useBattleStore()

function getIcon(skillId: string): string {
  return SKILL_DEFINITIONS.find((d) => d.id === skillId)?.icon ?? '✨'
}
</script>

<template>
  <div class="skill-bar">
    <button
      class="skill-bar__auto hunt-glass"
      :class="{ 'skill-bar__auto--on': battle.isAutoBattle }"
      data-testid="auto-battle-toggle"
      @click="battle.toggleAutoBattle()"
    >
      <span class="overlay-text">{{ battle.isAutoBattle ? 'AUTO' : '수동' }}</span>
    </button>
    <button
      v-for="s in skill.activeSkills"
      :key="s.id"
      class="skill-bar__slot hunt-glass"
      :title="s.name"
    >
      <span class="skill-bar__icon">{{ getIcon(s.id) }}</span>
      <div
        v-if="!skill.isReady(s.id)"
        class="skill-bar__cooldown"
        :style="{ height: `${100 - skill.getCooldownPercent(s.id)}%` }"
      />
    </button>
  </div>
</template>

<style scoped>
.skill-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}

.skill-bar__auto {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.58rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.skill-bar__auto--on {
  color: #4ecca3;
  border-color: #4ecca3;
  box-shadow: 0 0 12px rgba(78, 204, 163, 0.4);
}

.skill-bar__slot {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

.skill-bar__icon {
  font-size: 1rem;
  z-index: 1;
}

.skill-bar__cooldown {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 2;
  transition: height 0.1s linear;
}

@media (orientation: landscape) and (max-height: 520px) {
  .skill-bar__auto {
    width: 36px;
    height: 36px;
  }

  .skill-bar__slot {
    width: 32px;
    height: 32px;
  }

  .skill-bar__icon {
    font-size: 0.85rem;
  }
}
</style>
