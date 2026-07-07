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

// 보스는 일반 몬스터(같은 스테이지 기준)보다 이만큼 강하게 스케일링한다. 실제 값은 플레이테스트로 조정.
const BOSS_HP_MULTIPLIER = 8
const BOSS_ATTACK_MULTIPLIER = 1.5
const BOSS_GOLD_MULTIPLIER = 10
// 보스는 배회하지 않고 화면 안쪽 고정 위치에 버티고 선다 (speed 0)
const BOSS_X = 0.75

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
      isBoss: false,
    }
  }

  /** 웨이브를 모두 클리어하면 등장하는 스테이지 보스를 생성한다. */
  function createBossForStage(stage: number): Monster {
    const maxHp = Math.floor(getMonsterMaxHp(stage) * BOSS_HP_MULTIPLIER)
    return {
      id: `boss-${stage}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `보스 ${getMonsterName(stage)}`,
      maxHp,
      hp: maxHp,
      attack: Math.floor(getMonsterAttack(stage) * BOSS_ATTACK_MULTIPLIER),
      goldReward: Math.floor(getMonsterGoldReward(stage) * BOSS_GOLD_MULTIPLIER),
      sprite: getMonsterSprite(stage),
      x: BOSS_X,
      targetX: BOSS_X,
      speed: 0,
      moving: false,
      pauseMs: 0,
      isBoss: true,
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
    createBossForStage,
    goToStage,
    nextStage,
    prevStage,
    setStage,
  }
})
