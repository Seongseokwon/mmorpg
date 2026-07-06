import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'
import { parseFormattedNumber } from '../../helpers/format'

test.describe('스킬 레벨업', () => {
  test('이미 해금한 스킬은 골드를 내고 레벨업할 수 있다', async ({ page }) => {
    await seedSaveAndReload(
      page,
      buildSaveData({ gold: 100_000, skills: [{ id: 'power_strike', level: 1 }, { id: 'fire_ball', level: 0 }] }),
    )
    await page.getByTestId('auto-battle-toggle').click()

    await page.getByTestId('nav-skill').click()
    await expect(page.getByTestId('skill-level-power_strike')).toContainText('Lv.1')

    const goldBefore = parseFormattedNumber(await page.getByTestId('currency-gold').innerText())
    await page.getByTestId('skill-action-power_strike').click()

    await expect(page.getByTestId('skill-level-power_strike')).toContainText('Lv.2')
    const goldAfter = parseFormattedNumber(await page.getByTestId('currency-gold').innerText())
    expect(goldAfter).toBeLessThan(goldBefore)
  })

  test('최대 레벨에 도달하면 레벨업 버튼이 비활성화되고 "최대 레벨"로 표시된다', async ({ page }) => {
    // SKILL_DEFINITIONS의 power_strike maxLevel을 가정하지 않고, 넉넉히 높은 레벨로 시딩해
    // "이미 최대 레벨"인 상태를 재현한다. maxLevel 자체는 gameData.ts에 정의된 값을 그대로 신뢰한다.
    await seedSaveAndReload(
      page,
      buildSaveData({ gold: 1_000_000, skills: [{ id: 'power_strike', level: 999 }, { id: 'fire_ball', level: 0 }] }),
    )

    await page.getByTestId('nav-skill').click()
    await expect(page.getByTestId('skill-action-power_strike')).toBeDisabled()
    await expect(page.getByTestId('skill-action-power_strike')).toContainText('최대 레벨')
  })
})
