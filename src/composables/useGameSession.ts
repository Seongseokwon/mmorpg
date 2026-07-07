import { onMounted, onUnmounted, watch } from 'vue'
import { GameLoop } from '@/services/gameLoop'
import { useBattleStore } from '@/stores/battle.store'
import { useSaveStore } from '@/stores/save.store'
import { useCurrencyStore } from '@/stores/currency.store'
import { usePlayerStore } from '@/stores/player.store'
import { useStageStore } from '@/stores/stage.store'
import { useInventoryStore } from '@/stores/inventory.store'
import { useEquipmentStore } from '@/stores/equipment.store'
import { useSkillStore } from '@/stores/skill.store'
import { useSubStatsStore } from '@/stores/substats.store'
import { useGachaStore } from '@/stores/gacha.store'
import { useAchievementStore } from '@/stores/achievement.store'
import { useRewardStore } from '@/stores/reward.store'
import { useMetaStore } from '@/stores/meta.store'

export function useGameSession() {
  const gameLoop = new GameLoop(100)
  const battle = useBattleStore()
  const save = useSaveStore()
  const reward = useRewardStore()

  // 탭이 백그라운드에 있는 동안은 브라우저가 타이머를 억제/중단시킬 수 있어 게임 루프가 멈추거나
  // 크게 느려진다. 다시 보이게 될 때마다 오프라인 보상을 재계산해 방치 시간을 보상해야 한다.
  function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      reward.checkOfflineReward()
    }
  }

  onMounted(async () => {
    document.addEventListener('visibilitychange', handleVisibilityChange)

    await save.load()
    battle.startBattle()

    gameLoop.start((delta) => {
      battle.tick(delta)
    })

    const currency = useCurrencyStore()
    const player = usePlayerStore()
    const stage = useStageStore()
    const inventory = useInventoryStore()
    const equipment = useEquipmentStore()
    const skill = useSkillStore()
    const subStats = useSubStatsStore()
    const gacha = useGachaStore()
    const achievement = useAchievementStore()
    const meta = useMetaStore()

    watch(
      [
        () => currency.gold,
        () => player.level,
        () => player.exp,
        () => player.statPoints,
        () => player.mainStats,
        () => subStats.levels,
        () => stage.currentStage,
        () => inventory.equipmentBag.length,
        () => inventory.consumables,
        () => equipment.equipped.weapon,
        () => equipment.equipped.armor,
        () => skill.levels,
        () => gacha.pityCounter,
        () => achievement.progress,
        () => reward.dailyReward,
        () => meta.stats,
      ],
      () => save.scheduleSave(),
      { deep: true },
    )
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    gameLoop.stop()
    void save.saveNow()
  })
}
