import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

test.describe('업적', () => {
  test('업적을 수령하면 보상(루나 + 스탯 포인트)이 실제로 지급된다', async ({ page }) => {
    // '첫 보스 사냥' 업적(target 1)을 이미 달성한 상태로 시딩 — 보상에 statPoints가 포함된
    // 업적이라 골드뿐 아니라 스탯 포인트 지급 경로도 함께 검증한다.
    await seedSaveAndReload(
      page,
      buildSaveData({
        gold: 0,
        statPoints: 0,
        meta: { totalKills: 1, totalGachaPulls: 0, totalEnhances: 0, totalBossKills: 1 },
      }),
    )

    await page.getByTestId('nav-achievement').click()

    const claimButton = page.getByTestId('achievement-claim-first_boss')
    await expect(claimButton).toBeVisible()

    await claimButton.click()

    // 골드 지급 확인 (reward.meso: 500)
    await expect(page.getByTestId('currency-gold')).toHaveText('500')

    // 스탯 포인트 지급 확인 (reward.statPoints: 1) — 시트는 항상 하나만 열리므로
    // 먼저 닫고 캐릭터 탭으로 이동해 반영을 확인한다
    await page.getByTestId('sheet-close').click()
    await page.getByTestId('nav-character').click()
    await expect(page.getByTestId('main-stat-points')).toContainText('1')
  })

  test('업적 탭에 보상 미리보기가 표시된다', async ({ page }) => {
    await page.goto('/game')
    await page.getByTestId('nav-achievement').click()

    await expect(page.getByText('100 루나')).toBeVisible()
  })
})
