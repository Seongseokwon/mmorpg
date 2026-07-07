import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

const HOUR_MS = 60 * 60 * 1000

/**
 * 발견 경위: checkOfflineReward()는 save.load() 성공 시 딱 한 번만 호출되고 visibilitychange 훅이
 * 없어서, 탭을 새로고침하지 않으면 오래 방치해도 보상이 재계산되지 않았다.
 * 2026-07-07: useGameSession()에 visibilitychange 리스너를 추가해, 탭이 다시 보일 때마다
 * checkOfflineReward()를 재호출하도록 수정.
 */
test.describe('백그라운드 탭 복귀', () => {
  test(
    '탭을 닫지 않고 3시간 백그라운드에 뒀다가 돌아오면 오프라인 보상을 받을 수 있어야 한다',
    async ({ page }) => {
      await page.clock.install({ time: new Date() })
      await seedSaveAndReload(page, buildSaveData({ lastActiveAt: Date.now() }))

      // 방금 로드했으니 아직은 보상이 없어야 한다 (기준선 확인)
      await expect(page.getByTestId('offline-modal')).toHaveCount(0)

      // 탭을 백그라운드로 보낸다
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      await page.clock.fastForward(3 * HOUR_MS)

      // 탭이 다시 보이게 된다 (유저가 돌아옴)
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: false, configurable: true })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      await expect(page.getByTestId('offline-modal')).toBeVisible({ timeout: 3_000 })
    },
  )
})
