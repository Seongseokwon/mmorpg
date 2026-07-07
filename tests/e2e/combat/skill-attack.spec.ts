import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

test.describe('스킬', () => {
  test('스킬 패널에 기본 스킬(파워 스트라이크)이 활성 상태로 보인다', async ({ page }) => {
    await page.goto('/game')
    await page.getByTestId('nav-skill').click()

    const sheet = page.getByTestId('game-sheet')
    await expect(sheet).toBeVisible()

    const powerStrike = page.getByTestId('skill-item-power_strike')
    await expect(powerStrike).toBeVisible()
    await expect(page.getByTestId('skill-level-power_strike')).toContainText('Lv.1')
  })

  test('해금 스테이지에 도달하지 못하면 파이어볼 해금 버튼이 비활성화된다', async ({ page }) => {
    await seedSaveAndReload(page, buildSaveData({ gold: 10_000, currentStage: 1, maxClearedStage: 1 }))
    await page.getByTestId('auto-battle-toggle').click() // 스테이지가 올라가버리기 전에 고정

    await page.getByTestId('nav-skill').click()
    await expect(page.getByTestId('skill-action-fire_ball')).toBeDisabled()
  })

  test('해금 스테이지 도달 + 골드 충분이면 파이어볼을 해금할 수 있다', async ({ page }) => {
    await seedSaveAndReload(
      page,
      buildSaveData({ gold: 10_000, currentStage: 6, maxClearedStage: 6 }),
    )

    await page.getByTestId('nav-skill').click()
    const unlockBtn = page.getByTestId('skill-action-fire_ball')
    await expect(unlockBtn).toBeEnabled()
    await expect(unlockBtn).toContainText('해금')

    await unlockBtn.click()
    await expect(page.getByTestId('skill-level-fire_ball')).toContainText('Lv.1')
  })
})
