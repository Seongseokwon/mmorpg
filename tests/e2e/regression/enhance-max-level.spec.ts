import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildEquipment, buildSaveData } from '../../fixtures/save-data'
import { parseFormattedNumber } from '../../helpers/format'

/**
 * 발견 경위: equipmentService.ts의 rollEnhanceSuccess()는 enhanceLevel이 MAX_ENHANCE_LEVEL 이상이면
 * 무조건 실패를 반환하는데, getEnhanceSuccessRate()와 EnhanceModal의 강화 버튼 활성 조건 어디에도 그
 * 사실이 반영되어 있지 않아 유저가 확률을 믿고 재화를 계속 태울 수 있었다.
 * 2026-07-06: MAX_ENHANCE_LEVEL을 15 -> 20으로 상향하면서, getEnhanceSuccessRate()가 캡 이상에서
 * 0%를 반환하도록, EnhanceModal의 강화 버튼이 캡 도달 시 비활성화("최대 레벨" 표시)되도록 수정.
 */
async function preventDrops(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    Math.random = () => 0.99
  })
}

test.describe('회귀: 최대 강화 레벨(+20)에서 골드 낭비 버그', () => {
  test(
    '이미 +20인 장비는 강화 버튼이 비활성화되고 성공률이 0%로 표시되어야 한다 (MEMORY.md #1-1)',
    async ({ page }) => {
      await preventDrops(page)
      await seedSaveAndReload(
        page,
        buildSaveData({
          gold: 100_000,
          equippedWeapon: buildEquipment({ enhanceLevel: 20 }),
        }),
      )

      await page.getByTestId('nav-equipment').click()
      await page.getByTestId('equip-enhance-weapon').click()

      await expect(page.getByTestId('enhance-rate-text')).toContainText('0%')
      await expect(page.getByTestId('enhance-confirm')).toBeDisabled()
      await expect(page.getByTestId('enhance-confirm')).toContainText('최대 레벨')
    },
  )

  test(
    '+19 장비는 여전히 정상적으로 강화를 시도할 수 있다 (캡 상향 확인)',
    async ({ page }) => {
      await preventDrops(page)
      await seedSaveAndReload(
        page,
        buildSaveData({
          gold: 100_000,
          equippedWeapon: buildEquipment({ enhanceLevel: 19 }),
        }),
      )

      await page.getByTestId('nav-equipment').click()
      await page.getByTestId('equip-enhance-weapon').click()

      await expect(page.getByTestId('enhance-confirm')).toBeEnabled()

      const goldBefore = parseFormattedNumber(await page.getByTestId('currency-gold').innerText())
      await page.getByTestId('enhance-confirm').click()

      await expect(page.locator('.modal__result')).toContainText('강화')
      await page.waitForTimeout(1_700)

      const goldAfter = parseFormattedNumber(await page.getByTestId('currency-gold').innerText())
      expect(goldAfter, '골드는 깎여야 함').toBeLessThan(goldBefore)
    },
  )
})
