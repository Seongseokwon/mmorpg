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

  onMounted(async () => {
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
    const reward = useRewardStore()
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
    gameLoop.stop()
    void save.saveNow()
  })
}
