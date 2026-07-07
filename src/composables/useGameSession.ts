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
  //
  // 반대로 숨겨지는 시점(백그라운드 진입/탭 종료 직전)에는 scheduleSave()의 1초 디바운스가
  // 아직 발화하지 않은 변경분(예: 방금 장착한 장비)이 남아있을 수 있다. onUnmounted의 saveNow()는
  // Vue 컴포넌트가 정상적으로 unmount될 때만 실행되고 탭을 닫거나 새로고침할 때는 호출되지
  // 않으므로, 여기서 즉시 저장을 강제해 그 유실을 막는다.
  function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      reward.checkOfflineReward()
    } else if (save.isLoaded) {
      // save.load()가 끝나기 전에 숨겨지면 아직 채워지지 않은 초기 상태로 기존 저장을
      // 덮어써버릴 수 있으므로, 로드가 끝난 뒤에만 강제 저장한다.
      void save.saveNow()
    }
  }

  // 탭을 완전히 닫는 경우 visibilitychange 다음에 곧바로 pagehide/unload가 뒤따르는데,
  // 일부 브라우저/임베디드 웹뷰 환경에서는 visibilitychange가 누락될 수 있어 안전망으로 둔다.
  function handlePageHide(): void {
    if (save.isLoaded) {
      void save.saveNow()
    }
  }

  // watch()가 onMounted의 await 이후(비동기 콜백 안)에서 생성되면 Vue가 컴포넌트 effect scope에
  // 자동으로 묶어주지 못해(vue/no-watch-after-await) unmount 시 저절로 정리되지 않는다.
  // stop 핸들을 직접 들고 있다가 onUnmounted에서 명시적으로 호출해야 한다.
  let stopSaveWatch: (() => void) | null = null
  let stopEquipWatch: (() => void) | null = null

  onMounted(async () => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)

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

    stopSaveWatch = watch(
      [
        () => currency.gold,
        () => player.level,
        () => player.exp,
        () => player.statPoints,
        () => player.mainStats,
        () => player.innateStats,
        () => subStats.levels,
        () => stage.currentStage,
        () => inventory.equipmentBag.length,
        () => inventory.consumables,
        () => skill.levels,
        () => gacha.pityCounter,
        () => achievement.progress,
        () => reward.dailyReward,
        () => meta.stats,
      ],
      () => save.scheduleSave(),
      { deep: true },
    )

    // 장착 장비는 다른 값들과 달리 드물지만 되돌릴 수 없는 손실(착용 해제/드롭 교체)로
    // 이어지는 변경이라, scheduleSave()의 1초 디바운스를 타지 않고 즉시 저장한다.
    // 디바운스 창(<1초) 안에 탭이 닫히면 방금 장착한 장비가 저장 전 상태로 되돌아가는
    // 문제가 있었다.
    stopEquipWatch = watch(
      [() => equipment.equipped.weapon, () => equipment.equipped.armor],
      () => {
        void save.saveNow()
      },
      { deep: true },
    )
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pagehide', handlePageHide)
    stopSaveWatch?.()
    stopEquipWatch?.()
    gameLoop.stop()
    void save.saveNow()
  })
}
