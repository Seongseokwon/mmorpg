import { onMounted, onUnmounted, ref, watch } from 'vue'
import { GameRenderer } from '@/game/GameRenderer'
import { battleEventBus } from '@/services/gameLoop'
import { useBattleStore } from '@/stores/battle.store'

export function useGameRenderer(canvasRef: { value: HTMLCanvasElement | null }) {
  const renderer = new GameRenderer()
  const isReady = ref(false)

  let unsubscribe: (() => void) | null = null

  onMounted(async () => {
    if (!canvasRef.value) return

    await renderer.mount(canvasRef.value)
    isReady.value = true

    unsubscribe = battleEventBus.subscribe((event) => {
      renderer.handleBattleEvent(event)
    })

    const battle = useBattleStore()
    // 몬스터가 매 틱 배회 이동을 하므로 위치를 계속 반영해야 한다. deep watch라 hp 변화 등에도 불필요하게
    // 걸리지만, 몬스터가 최대 4마리뿐이라 syncMonsters 자체가 가벼워 문제되지 않는다.
    watch(
      () => battle.monsters,
      (monsters) => {
        renderer.syncMonsters(monsters)
      },
      { immediate: true, deep: true },
    )
  })

  onUnmounted(() => {
    unsubscribe?.()
    renderer.destroy()
    isReady.value = false
  })

  return { isReady }
}
