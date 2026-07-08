import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { SKILL_DEFINITIONS } from '@/data/gameData'
import { getSkillDamageMultiplier, getSkillUpgradeCost } from '@/services/equipmentService'
import type { Skill } from '@/types/game'
import { useCurrencyStore } from './currency.store'
import { useStageStore } from './stage.store'

export const useSkillStore = defineStore('skill', () => {
  const levels = ref<Record<string, number>>({
    power_strike: 1,
    fire_ball: 0,
    meteor_storm: 0,
  })

  const cooldowns = ref<Record<string, number>>({
    power_strike: 0,
    fire_ball: 0,
    meteor_storm: 0,
  })

  const skills = computed<Skill[]>(() =>
    SKILL_DEFINITIONS.map((def) => ({
      id: def.id,
      name: def.name,
      description: def.description,
      level: levels.value[def.id] ?? 0,
      maxLevel: def.maxLevel,
      cooldownMs: def.cooldownMs,
      damageMultiplier: getSkillDamageMultiplier(
        def.baseDamageMultiplier,
        def.damagePerLevel,
        Math.max(1, levels.value[def.id] ?? 0),
      ),
      unlockStage: def.unlockStage,
      hitsPerTarget: def.hitsPerTarget,
      aoeAll: def.aoeAll,
    })),
  )

  const activeSkills = computed(() =>
    skills.value.filter((skill) => {
      const stage = useStageStore()
      return skill.level > 0 && stage.currentStage >= skill.unlockStage
    }),
  )

  function getSkillDef(id: string) {
    return SKILL_DEFINITIONS.find((def) => def.id === id)
  }

  function getCooldownPercent(skillId: string): number {
    const def = getSkillDef(skillId)
    if (!def) return 100
    const remaining = cooldowns.value[skillId] ?? 0
    return Math.max(0, 100 - (remaining / def.cooldownMs) * 100)
  }

  function isReady(skillId: string): boolean {
    return (cooldowns.value[skillId] ?? 0) <= 0
  }

  function tickCooldowns(deltaMs: number): void {
    for (const id of Object.keys(cooldowns.value)) {
      if (cooldowns.value[id] > 0) {
        cooldowns.value[id] = Math.max(0, cooldowns.value[id] - deltaMs)
      }
    }
  }

  function triggerCooldown(skillId: string): void {
    const def = getSkillDef(skillId)
    if (def) {
      cooldowns.value[skillId] = def.cooldownMs
    }
  }

  function getReadySkill(): Skill | null {
    const ready = activeSkills.value.find((skill) => isReady(skill.id))
    return ready ?? null
  }

  function upgradeSkill(skillId: string): boolean {
    const def = getSkillDef(skillId)
    if (!def) return false

    const currentLevel = levels.value[skillId] ?? 0
    if (currentLevel >= def.maxLevel) return false

    const currency = useCurrencyStore()
    const cost = getSkillUpgradeCost(currentLevel)
    if (!currency.spendGold(cost)) return false

    levels.value[skillId] = currentLevel + 1
    return true
  }

  function getUpgradeCost(skillId: string): number {
    return getSkillUpgradeCost(levels.value[skillId] ?? 0)
  }

  function unlockSkill(skillId: string): boolean {
    const def = getSkillDef(skillId)
    if (!def) return false
    if ((levels.value[skillId] ?? 0) > 0) return false

    const stage = useStageStore()
    if (stage.currentStage < def.unlockStage) return false

    const currency = useCurrencyStore()
    if (!currency.spendGold(100)) return false

    levels.value[skillId] = 1
    return true
  }

  function setLevels(data: { id: string; level: number }[]): void {
    for (const entry of data) {
      levels.value[entry.id] = entry.level
    }
  }

  function collectLevels(): { id: string; level: number }[] {
    return Object.entries(levels.value).map(([id, level]) => ({ id, level }))
  }

  return {
    levels,
    cooldowns,
    skills,
    activeSkills,
    getSkillDef,
    getCooldownPercent,
    isReady,
    tickCooldowns,
    triggerCooldown,
    getReadySkill,
    upgradeSkill,
    getUpgradeCost,
    unlockSkill,
    setLevels,
    collectLevels,
  }
})
