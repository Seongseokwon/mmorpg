import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

/** 자동전투가 백그라운드에서 계속 골드/경험치를 올리면 스탯 포인트 수가 테스트 중간에 바뀔 수 있어(레벨업),
 *  상태를 고정해두고 검증하기 위해 항상 AUTO를 끈 뒤 스탯을 확인한다. */
async function pauseAutoBattle(page: import('@playwright/test').Page): Promise<void> {
  const toggle = page.getByTestId('auto-battle-toggle')
  if (await toggle.innerText().then((t) => t.includes('AUTO'))) {
    await toggle.click()
  }
}

test.describe('스탯 분배', () => {
  test('스탯 포인트를 STR에 투자하면 포인트가 줄고 STR이 오른다', async ({ page }) => {
    await seedSaveAndReload(page, buildSaveData({ statPoints: 5, mainStats: { str: 1, vit: 1, dex: 1, luk: 1 } }))
    await pauseAutoBattle(page)

    await page.getByTestId('nav-character').click()
    await expect(page.getByTestId('game-sheet')).toBeVisible()

    await expect(page.getByTestId('main-stat-points')).toContainText('5')
    await expect(page.getByTestId('stat-value-str')).toContainText('1')

    await page.getByTestId('stat-alloc-str').click()

    await expect(page.getByTestId('stat-value-str')).toContainText('2')
    await expect(page.getByTestId('main-stat-points')).toContainText('4')
  })

  test('포인트가 0이면 스탯 버튼이 비활성화된다', async ({ page }) => {
    await seedSaveAndReload(page, buildSaveData({ statPoints: 0 }))
    await pauseAutoBattle(page)

    await page.getByTestId('nav-character').click()
    await expect(page.getByTestId('stat-alloc-str')).toBeDisabled()
    await expect(page.getByTestId('main-stat-points')).toHaveCount(0)
  })

  test('스탯 투자 결과는 새로고침 후에도 유지된다', async ({ page }) => {
    await seedSaveAndReload(page, buildSaveData({ statPoints: 5, mainStats: { str: 1, vit: 1, dex: 1, luk: 1 } }))
    await pauseAutoBattle(page)

    await page.getByTestId('nav-character').click()
    await page.getByTestId('stat-alloc-vit').click()
    await expect(page.getByTestId('stat-value-vit')).toContainText('2')

    // scheduleSave()가 1초 디바운스이므로 저장이 실제 반영될 시간을 준다
    await page.waitForTimeout(1_500)
    await page.reload()

    await page.getByTestId('nav-character').click()
    await expect(page.getByTestId('stat-value-vit')).toContainText('2')
  })
})
