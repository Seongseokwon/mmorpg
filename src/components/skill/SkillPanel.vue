<script setup lang="ts">
import { SKILL_DEFINITIONS } from '@/data/gameData'
import { useSkillStore } from '@/stores/skill.store'
import { useCurrencyStore } from '@/stores/currency.store'
import { useStageStore } from '@/stores/stage.store'

const skill = useSkillStore()
const currency = useCurrencyStore()
const stage = useStageStore()

function getDefIcon(skillId: string): string {
  return SKILL_DEFINITIONS.find((d) => d.id === skillId)?.icon ?? '✨'
}

function handleAction(skillId: string, level: number): void {
  if (level === 0) {
    skill.unlockSkill(skillId)
  } else {
    skill.upgradeSkill(skillId)
  }
}
</script>

<template>
  <section class="skill panel">
    <h2 class="panel__title">스킬</h2>
    <ul class="skill__list">
      <li v-for="s in skill.skills" :key="s.id" class="skill__item" :data-testid="`skill-item-${s.id}`">
        <div class="skill__header">
          <span class="skill__icon">{{ getDefIcon(s.id) }}</span>
          <div class="skill__info">
            <span class="skill__name">{{ s.name }}</span>
            <span class="skill__desc">
              {{ s.level > 0 ? `x${s.damageMultiplier.toFixed(1)} 피해` : `Stage ${s.unlockStage} 해금` }}
            </span>
          </div>
          <span v-if="s.level > 0" class="skill__level" :data-testid="`skill-level-${s.id}`">Lv.{{ s.level }}</span>
        </div>

        <div v-if="s.level > 0 && stage.currentStage >= s.unlockStage" class="skill__cooldown">
          <div class="stat-bar">
            <div
              class="stat-bar__fill stat-bar__fill--skill"
              :style="{ width: `${skill.getCooldownPercent(s.id)}%` }"
            />
          </div>
        </div>

        <button
          class="btn skill__btn"
          :class="s.level === 0 ? 'btn--secondary' : 'btn--gold'"
          :data-testid="`skill-action-${s.id}`"
          :disabled="
            s.level === 0
              ? stage.currentStage < s.unlockStage || currency.gold < 100
              : s.level >= s.maxLevel || currency.gold < skill.getUpgradeCost(s.id)
          "
          @click="handleAction(s.id, s.level)"
        >
          <template v-if="s.level === 0">해금 (🌙100)</template>
          <template v-else-if="s.level >= s.maxLevel">최대 레벨</template>
          <template v-else>레벨업 (🌙{{ skill.getUpgradeCost(s.id).toLocaleString() }})</template>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.skill {
  padding: 0.75rem 1rem;
}

.skill__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skill__item {
  padding: 0.55rem;
  background: var(--color-bg-card);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.skill__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.skill__icon {
  font-size: 1.3rem;
}

.skill__info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.skill__name {
  font-size: 0.82rem;
  font-weight: 700;
}

.skill__desc {
  font-size: 0.68rem;
  color: var(--color-text-muted);
}

.skill__level {
  font-size: 0.75rem;
  color: var(--color-accent-gold);
  font-weight: 700;
}

.skill__cooldown {
  margin-bottom: 0.35rem;
}

.stat-bar__fill--skill {
  background: linear-gradient(90deg, #f5c542, #ff9a3c);
}

.skill__btn {
  width: 100%;
  font-size: 0.72rem;
  padding: 0.4rem;
}
</style>
