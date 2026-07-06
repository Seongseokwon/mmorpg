import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

const HOUR_MS = 60 * 60 * 1000
const MIN_MS = 60 * 1000

test.describe('오프라인 보상', () => {
  test('5분 미만 자리를 비웠다면 오프라인 보상 모달이 뜨지 않는다', async ({ page }) => {
    await seedSaveAndReload(page, buildSaveData({ lastActiveAt: Date.now() - 2 * MIN_MS }))
    await expect(page.getByTestId('offline-modal')).toHaveCount(0)
  })

  test('장시간(2시간) 자리를 비웠다가 재접속하면 오프라인 보상 모달이 뜨고, 받으면 골드가 늘어난다', async ({
    page,
  }) => {
    await seedSaveAndReload(
      page,
      buildSaveData({ gold: 0, lastActiveAt: Date.now() - 2 * HOUR_MS, currentStage: 3, level: 5 }),
    )

    const modal = page.getByTestId('offline-modal')
    await expect(modal).toBeVisible()

    await page.getByTestId('offline-claim').click()
    await expect(modal).toHaveCount(0)

    await expect
      .poll(async () => page.getByTestId('currency-gold').innerText(), { timeout: 3_000 })
      .not.toBe('0')
  })

  test('8시간을 초과한 부재는 8시간 상한으로 계산된다', async ({ page }) => {
    await seedSaveAndReload(
      page,
      buildSaveData({ lastActiveAt: Date.now() - 20 * HOUR_MS, currentStage: 1, level: 1 }),
    )

    await expect(page.getByTestId('offline-modal')).toBeVisible()
    await expect(page.locator('.modal__subtitle')).toContainText('8.0시간')
  })
})
