import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getExpFromKill, calculatePlayerDamage, applyMesoBonus } from '@/services/statCalc'
import { rollEquipmentDrop, getStatGradeLabel } from '@/services/equipmentService'
import { battleEventBus } from '@/services/gameLoop'
import type { Monster } from '@/types/game'
import { useCurrencyStore } from './currency.store'
import { useEquipmentStore } from './equipment.store'
import { useInventoryStore } from './inventory.store'
import { usePlayerStore } from './player.store'
import { useSkillStore } from './skill.store'
import { useSubStatsStore } from './substats.store'
import { useMetaStore } from './meta.store'
import { useStageStore } from './stage.store'

const MONSTER_ATTACK_INTERVAL_MS = 1200
/** 동시에 사냥터에 유지할 몬스터 수 (넓은 사냥터 연출용) */
const MAX_MONSTERS = 4
/** 스킬 광역 판정: 가장 가까운 몬스터와 이 거리(정규화 좌표) 안에 있으면 "겹친" 것으로 보고 함께 타격 */
const SKILL_CLEAVE_RANGE = 0.09

/** "도전" 시 순차적으로 막아내야 하는 웨이브 수. 마지막 웨이브를 클리어하면 보스가 등장한다. */
const WAVES_PER_STAGE = 3
/** 웨이브당 스폰할 몬스터 수 (기존 동시 사냥터 최대치와 동일하게 맞춘다) */
const WAVE_MONSTER_COUNT = MAX_MONSTERS

// 몬스터가 배회할 수 있는 가로 범위. 왼쪽 경계는 플레이어 근처까지 다가오지 않도록 여유를 둔다.
const MONSTER_MIN_X = 0.34
const MONSTER_MAX_X = 0.95
const MONSTER_WANDER_SPEED_MIN = 0.025
const MONSTER_WANDER_SPEED_MAX = 0.05
// 목적지에 도착했다고 판정하는 오차 범위
const MONSTER_ARRIVE_EPSILON = 0.008
// 목적지 도착 후 다음 배회를 시작하기 전 잠시 멈춰있는 시간
const MONSTER_PAUSE_MIN_MS = 400
const MONSTER_PAUSE_RANGE_MS = 900

function randomWanderX(): number {
  return MONSTER_MIN_X + Math.random() * (MONSTER_MAX_X - MONSTER_MIN_X)
}

function randomWanderSpeed(): number {
  return MONSTER_WANDER_SPEED_MIN + Math.random() * (MONSTER_WANDER_SPEED_MAX - MONSTER_WANDER_SPEED_MIN)
}

export type StagePhase = 'farming' | 'wave' | 'boss'
export interface BossResult {
  type: 'victory' | 'defeat'
  stage: number
}

export const useBattleStore = defineStore('battle', () => {
  const monsters = ref<Monster[]>([])
  const isAutoBattle = ref(true)
  const killCount = ref(0)
  const lastDropName = ref<string | null>(null)
  const lastLevelUp = ref(0)

  // "파밍"은 지금까지의 무한 리스폰 사냥터, "도전" 버튼을 누르면 wave(1..N)를 순서대로 클리어하고
  // 마지막 웨이브를 넘기면 boss가 등장한다. 승패와 무관하게 최종적으로는 다시 farming으로 돌아온다.
  const stagePhase = ref<StagePhase>('farming')
  const waveIndex = ref(0)
  const lastBossResult = ref<BossResult | null>(null)

  const isChallengeActive = computed(() => stagePhase.value !== 'farming')

  let playerAttackTimer = 0
  let monsterAttackTimer = 0

  // 위치(x) 오름차순 = 플레이어와 가까운 순서. 가장 가까운 몬스터가 자동 타겟이 된다.
  const sortedMonsters = computed(() =>
    [...monsters.value].sort((a, b) => a.x - b.x),
  )
  const targetMonster = computed(() => sortedMonsters.value[0] ?? null)
  const monsterHpPercent = computed(() => {
    const target = targetMonster.value
    if (!target) return 0
    return Math.max(0, (target.hp / target.maxHp) * 100)
  })

  /** 몬스터들의 배회 이동을 한 틱 진행시킨다. 자동전투 여부와 무관하게 항상 실행되어 사냥터가 계속 살아있게 한다. */
  function updateMonsterPositions(deltaMs: number): void {
    for (const m of monsters.value) {
      // 보스는 배회하지 않고 제자리를 지킨다 (speed 0으로 스폰됨)
      if (m.speed === 0) {
        m.moving = false
        continue
      }

      if (m.pauseMs > 0) {
        m.pauseMs = Math.max(0, m.pauseMs - deltaMs)
        m.moving = false
        continue
      }

      const distance = m.targetX - m.x
      if (Math.abs(distance) < MONSTER_ARRIVE_EPSILON) {
        // 목적지에 도착하면 잠시 멈췄다가 다음 배회 목적지를 무작위로 정한다
        m.targetX = randomWanderX()
        m.pauseMs = MONSTER_PAUSE_MIN_MS + Math.random() * MONSTER_PAUSE_RANGE_MS
        m.moving = false
        continue
      }

      const step = Math.sign(distance) * m.speed * (deltaMs / 1000)
      m.x += Math.abs(step) > Math.abs(distance) ? distance : step
      m.moving = true
    }
  }

  function spawnMonsters(): void {
    const stage = useStageStore()

    while (monsters.value.length < MAX_MONSTERS) {
      const m = stage.createMonsterForStage(stage.currentStage, randomWanderX(), randomWanderSpeed())
      monsters.value.push(m)
      battleEventBus.emit({ type: 'monster_spawned', monsterId: m.id })
    }
  }

  /** 도전 웨이브 1회분(고정 마릿수)을 스폰한다. 파밍과 달리 다 잡을 때까지 리스폰되지 않는다. */
  function spawnWaveBatch(): void {
    const stage = useStageStore()

    for (let i = 0; i < WAVE_MONSTER_COUNT; i++) {
      const m = stage.createMonsterForStage(stage.currentStage, randomWanderX(), randomWanderSpeed())
      monsters.value.push(m)
      battleEventBus.emit({ type: 'monster_spawned', monsterId: m.id })
    }
  }

  function spawnBoss(): void {
    const stage = useStageStore()
    const boss = stage.createBossForStage(stage.currentStage)
    monsters.value.push(boss)
    battleEventBus.emit({ type: 'monster_spawned', monsterId: boss.id })
  }

  /** 스테이지 변경 등으로 사냥터를 통째로 새로 채울 때 사용. 진행 중이던 도전은 취소되고 파밍으로 되돌아간다. */
  function resetMonsters(): void {
    stagePhase.value = 'farming'
    waveIndex.value = 0
    monsters.value = []
    playerAttackTimer = 0
    monsterAttackTimer = 0
    spawnMonsters()
  }

  /** "도전" 버튼 — 파밍 중일 때만 웨이브 1부터 시작한다. */
  function startChallenge(): void {
    if (stagePhase.value !== 'farming') return

    stagePhase.value = 'wave'
    waveIndex.value = 1
    monsters.value = []
    playerAttackTimer = 0
    monsterAttackTimer = 0
    spawnWaveBatch()
  }

  /** 현재 웨이브의 몬스터를 모두 잡았으면 다음 웨이브(또는 보스)로 넘어간다. */
  function advanceWaveIfCleared(): void {
    if (monsters.value.length > 0) return

    if (waveIndex.value < WAVES_PER_STAGE) {
      waveIndex.value += 1
      spawnWaveBatch()
    } else {
      stagePhase.value = 'boss'
      spawnBoss()
    }
  }

  /** 보스 처치 — 다음 스테이지로 진행하고 파밍으로 복귀한다. */
  function resolveVictory(): void {
    const stage = useStageStore()
    const player = usePlayerStore()
    const clearedStage = stage.currentStage

    stage.nextStage()
    stagePhase.value = 'farming'
    waveIndex.value = 0
    player.syncHpToMax()
    monsters.value = []
    spawnMonsters()

    lastBossResult.value = { type: 'victory', stage: clearedStage }
    window.setTimeout(() => {
      lastBossResult.value = null
    }, 2500)
  }

  /** 보스전 패배 — 페널티 없이 같은 스테이지의 파밍으로 복귀한다. */
  function resolveDefeat(): void {
    const stage = useStageStore()
    const player = usePlayerStore()

    stagePhase.value = 'farming'
    waveIndex.value = 0
    player.syncHpToMax()
    monsters.value = []
    spawnMonsters()

    lastBossResult.value = { type: 'defeat', stage: stage.currentStage }
    window.setTimeout(() => {
      lastBossResult.value = null
    }, 2500)
  }

  function removeMonster(monsterId: string): Monster | null {
    const index = monsters.value.findIndex((m) => m.id === monsterId)
    if (index === -1) return null
    const [removed] = monsters.value.splice(index, 1)
    return removed
  }

  function dealDamageToMonster(monsterId: string, damage: number): boolean {
    const target = monsters.value.find((m) => m.id === monsterId)
    if (!target) return false
    target.hp = Math.max(0, target.hp - damage)
    battleEventBus.emit({ type: 'monster_hit', monsterId })
    if (target.hp <= 0) {
      onMonsterKilled(monsterId)
      return true
    }
    return false
  }

  function rollDamage(): { damage: number; isCritical: boolean } {
    const player = usePlayerStore()
    const subStats = useSubStatsStore()
    return calculatePlayerDamage(player.attack, subStats.critRate, subStats.critDamage)
  }

  function playerAttack(): void {
    const player = usePlayerStore()
    const target = targetMonster.value
    if (!target || player.hp <= 0) return

    const { damage, isCritical } = rollDamage()
    battleEventBus.emit({ type: 'player_attack', monsterId: target.id, damage, isCritical })
    dealDamageToMonster(target.id, damage)
  }

  function useSkill(): void {
    const player = usePlayerStore()
    const skillStore = useSkillStore()
    const target = targetMonster.value
    if (!target || player.hp <= 0) return

    const skill = skillStore.getReadySkill()
    if (!skill) return

    // 가장 가까운 몬스터와 실제 위치가 가까워 "겹쳐" 보이는 몬스터까지 함께 타격하는 광역 판정
    const cleaveTargets = sortedMonsters.value.filter(
      (m) => Math.abs(m.x - target.x) <= SKILL_CLEAVE_RANGE,
    )

    const hits = cleaveTargets.map((m) => {
      const { damage: baseDamage } = rollDamage()
      return { monsterId: m.id, damage: Math.floor(baseDamage * skill.damageMultiplier) }
    })

    skillStore.triggerCooldown(skill.id)
    battleEventBus.emit({ type: 'skill_use', skillId: skill.id, hits })

    for (const hit of hits) {
      dealDamageToMonster(hit.monsterId, hit.damage)
    }
  }

  function monsterAttack(): void {
    const player = usePlayerStore()
    if (monsters.value.length === 0 || player.hp <= 0) return

    // 여러 마리가 동시에 있어도 기존 난이도를 유지하기 위해 한 틱마다 한 마리만 공격한다.
    const attacker = monsters.value[Math.floor(Math.random() * monsters.value.length)]
    const damage = Math.max(1, attacker.attack)
    player.takeDamage(damage)
    battleEventBus.emit({ type: 'player_hit', damage })

    if (player.hp <= 0) {
      // 파밍 중에는 지금까지처럼 안전하게 즉시 회복시킨다. 도전(웨이브/보스) 중의 사망은 진짜 실패다.
      if (stagePhase.value === 'farming') {
        player.syncHpToMax()
      } else {
        resolveDefeat()
      }
    }
  }

  function tryDropEquipment(): void {
    const stage = useStageStore()
    const subStats = useSubStatsStore()
    const inventory = useInventoryStore()
    const equipment = useEquipmentStore()
    const drop = rollEquipmentDrop(stage.currentStage, subStats.dropBonus)

    if (!drop) return

    if (!equipment.autoEquipIfBetter(drop)) {
      inventory.addEquipment(drop)
    }

    const statLabel = drop.slot === 'weapon' ? `ATK+${drop.baseAttack}` : `HP+${drop.baseHp}`
    lastDropName.value = `${drop.name} ${statLabel} [${getStatGradeLabel(drop.statGrade)}]`
    battleEventBus.emit({ type: 'equipment_dropped', equipment: drop })

    window.setTimeout(() => {
      lastDropName.value = null
    }, 2500)
  }

  function onMonsterKilled(monsterId: string): void {
    const killed = removeMonster(monsterId)
    if (!killed) return

    const currency = useCurrencyStore()
    const stage = useStageStore()
    const player = usePlayerStore()
    const subStats = useSubStatsStore()
    const baseReward = killed.goldReward
    const reward = applyMesoBonus(baseReward, subStats.mesoBonusPercent)

    currency.addGold(reward)
    const levelsGained = player.addExp(getExpFromKill(stage.currentStage))
    if (levelsGained > 0) {
      lastLevelUp.value = levelsGained
      window.setTimeout(() => {
        lastLevelUp.value = 0
      }, 2000)
    }

    killCount.value += 1
    useMetaStore().incrementKills()
    battleEventBus.emit({ type: 'monster_killed', monsterId, gold: reward })
    tryDropEquipment()

    if (killed.isBoss) {
      resolveVictory()
      return
    }

    if (stagePhase.value === 'farming') {
      // 죽은 만큼 새 몬스터를 채워 넣어 사냥터 개체 수를 유지한다.
      spawnMonsters()
      return
    }

    advanceWaveIfCleared()
  }

  function tick(deltaMs: number): void {
    if (monsters.value.length === 0) return
    updateMonsterPositions(deltaMs)

    if (!isAutoBattle.value) return

    const player = usePlayerStore()
    const skillStore = useSkillStore()
    const subStats = useSubStatsStore()
    if (player.hp <= 0) return

    skillStore.tickCooldowns(deltaMs)

    playerAttackTimer += deltaMs
    monsterAttackTimer += deltaMs

    const attackInterval = subStats.attackIntervalMs
    const readySkill = skillStore.getReadySkill()

    if (readySkill) {
      useSkill()
      playerAttackTimer = 0
    } else if (playerAttackTimer >= attackInterval) {
      playerAttackTimer = 0
      playerAttack()
    }

    if (monsterAttackTimer >= MONSTER_ATTACK_INTERVAL_MS) {
      monsterAttackTimer = 0
      monsterAttack()
    }
  }

  function startBattle(): void {
    if (monsters.value.length === 0) {
      spawnMonsters()
    }
  }

  function toggleAutoBattle(): void {
    isAutoBattle.value = !isAutoBattle.value
  }

  return {
    monsters,
    targetMonster,
    isAutoBattle,
    killCount,
    lastDropName,
    lastLevelUp,
    monsterHpPercent,
    stagePhase,
    waveIndex,
    wavesPerStage: WAVES_PER_STAGE,
    isChallengeActive,
    lastBossResult,
    spawnMonsters,
    resetMonsters,
    startChallenge,
    tick,
    startBattle,
    toggleAutoBattle,
  }
})
