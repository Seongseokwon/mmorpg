import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildEquipment, buildSaveData } from '../../fixtures/save-data'
import { parseFormattedNumber } from '../../helpers/format'

/**
 * Math.random을 드롭 확률(최대 60%)보다 확실히 높게 고정해서, 자동전투가 도는 동안 몬스터가
 * 장비를 드롭해 우리가 세팅한 +15 무기를 교체해버리는 일이 없게 한다(그 자체는
 * regression/auto-equip-inverted.spec.ts에서 별도로 다루는 버그). rollEnhanceSuccess()는
 * enhanceLevel >= 15면 Math.random을 보기도 전에 무조건 false를 반환하므로, 이 값으로 고정해도
 * "강화 실패" 검증에는 영향이 없다.
 */
async function preventDrops(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    Math.random = () => 0.99
  })
}

test.describe('회귀: 최대 강화 레벨(+15)에서 골드 낭비 버그', () => {
  test(
    '이미 +15인 장비는 강화 버튼이 비활성화되어야 한다 (MEMORY.md #1-1)',
    async ({ page }) => {
      // equipmentService.ts의 rollEnhanceSuccess()는 enhanceLevel >= 15에서 무조건 실패를 반환하지만,
      // getEnhanceSuccessRate()와 UI 버튼 활성 조건 어디에도 그 사실이 반영되어 있지 않다.
      // 고쳐지기 전까지는 이 테스트가 "실패"하는 게 정상이다.
      test.fail(true, 'MEMORY.md #1-1 미해결: +15 캡이 UI 성공률/버튼 비활성화에 반영 안 됨')

      await preventDrops(page)
      await seedSaveAndReload(
        page,
        buildSaveData({
          gold: 100_000,
          equippedWeapon: buildEquipment({ enhanceLevel: 15 }),
        }),
      )

      await page.getByTestId('nav-equipment').click()
      await page.getByTestId('equip-enhance-weapon').click()

      // 기대(수정 후) 동작: 이미 최대 레벨이므로 강화 버튼은 비활성화되어 있어야 한다.
      await expect(page.getByTestId('enhance-confirm')).toBeDisabled()
    },
  )

  test(
    '현재 동작: +15에서도 강화를 누르면 골드가 깎이지만 레벨은 절대 오르지 않는다',
    async ({ page }) => {
      // 이 테스트는 "현재의 버그 동작"을 그대로 문서화하는 회귀 테스트라 지금은 통과해야 정상이다.
      // #1-1이 수정되면(버튼이 비활성화되면) 이 클릭 자체가 불가능해지므로 이 테스트도 실패하게 되고,
      // 그때 이 스펙을 삭제하거나 "수정 후 동작"으로 바꿔야 한다.
      await preventDrops(page)
      await seedSaveAndReload(
        page,
        buildSaveData({
          gold: 100_000,
          equippedWeapon: buildEquipment({ enhanceLevel: 15 }),
        }),
      )
      await page.getByTestId('auto-battle-toggle').click()

      await page.getByTestId('nav-equipment').click()
      await page.getByTestId('equip-enhance-weapon').click()

      const goldBefore = parseFormattedNumber(await page.getByTestId('currency-gold').innerText())
      await page.getByTestId('enhance-confirm').click()

      await expect(page.locator('.modal__result')).toContainText('강화 실패')
      // 실패 시엔 EnhanceModal이 자동으로 닫히지 않는다(성공 시에만 close emit) — 직접 닫는다.
      await page.waitForTimeout(1_700)
      await page.getByTestId('enhance-close').click()

      const goldAfter = parseFormattedNumber(await page.getByTestId('currency-gold').innerText())
      expect(goldAfter, '골드는 깎였는데').toBeLessThan(goldBefore)

      expect
        .soft(await page.getByTestId('equipment-level-weapon').innerText(), '레벨은 여전히 +15여야 함')
        .toContain('+15')
    },
  )
})
