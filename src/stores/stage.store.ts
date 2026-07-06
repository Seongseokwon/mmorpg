import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getMonsterAttack,
  getMonsterGoldReward,
  getMonsterMaxHp,
  getMonsterName,
  getMonsterSprite,
} from '@/services/damageCalc'
import type { Monster } from '@/types/game'

export const useStageStore = defineStore('stage', () => {
  const currentStage = ref(1)
  const maxClearedStage = ref(1)

  function createMonsterForStage(stage: number, x: number, speed: number): Monster {
    const maxHp = getMonsterMaxHp(stage)
    return {
      id: `monster-${stage}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: getMonsterName(stage),
      maxHp,
      hp: maxHp,
      attack: getMonsterAttack(stage),
      goldReward: getMonsterGoldReward(stage),
      sprite: getMonsterSprite(stage),
      x,
      targetX: x,
      speed,
      moving: false,
      // 스폰 직후 곧바로 배회를 시작하지 않도록 잠깐 멈춰 있는다 (자연스러운 등장 연출)
      pauseMs: 300 + Math.random() * 500,
    }
  }

  function goToStage(stage: number): void {
    currentStage.value = Math.max(1, stage)
  }

  function nextStage(): void {
    currentStage.value += 1
    maxClearedStage.value = Math.max(maxClearedStage.value, currentStage.value)
  }

  function prevStage(): void {
    if (currentStage.value > 1) {
      currentStage.value -= 1
    }
  }

  function setStage(stage: number, cleared: number): void {
    currentStage.value = Math.max(1, stage)
    maxClearedStage.value = Math.max(1, cleared)
  }

  return {
    currentStage,
    maxClearedStage,
    createMonsterForStage,
    goToStage,
    nextStage,
    prevStage,
    setStage,
  }
})
