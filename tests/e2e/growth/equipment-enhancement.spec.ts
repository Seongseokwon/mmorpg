import { test, expect } from '@playwright/test'
import { readSaveRecord, seedSaveAndReload } from '../../helpers/db'
import { buildEquipment, buildSaveData } from '../../fixtures/save-data'

/**
 * 강화는 확률이 걸려 있어 실제 성공/실패를 결정적으로 재현하려면 난수를 통제해야 한다.
 * 게임 로직(서비스)을 mock하는 게 아니라, 순수한 난수 소스(Math.random)만 고정하는
 * 방식이라 "지나친 mock 기반 테스트"에 해당하지 않는다고 판단했다.
 *
 * 장비는 일부러 baseAttack을 낮게 시딩한다 — equipment.store.ts의 autoEquipIfBetter()가
 * compareEquipment()의 비교 방향을 반대로 쓰고 있어서(회귀 테스트: auto-equip-inverted.spec.ts),
 * 지금 상태에서는 "강한" 장비일수록 오히려 몬스터 드롭에 더 쉽게 교체돼 버린다. 이 스펙은 그 버그를
 * 검증하려는 게 아니라 강화 자체를 검증하려는 것이므로, 그 버그의 영향을 안 받는 낮은 스탯을 쓴다.
 */
async function forceRandomTo(page: import('@playwright/test').Page, value: number): Promise<void> {
  await page.addInitScript((v) => {
    Math.random = () => v
  }, value)
}

test.describe('장비 강화', () => {
  test('강화에 성공하면 레벨이 오르고 골드가 차감된다', async ({ page }) => {
    await forceRandomTo(page, 0) // 0 < 성공률(%) 이므로 항상 성공

    await seedSaveAndReload(
      page,
      buildSaveData({
        gold: 100_000,
        equippedWeapon: buildEquipment({ enhanceLevel: 0, baseAttack: 1, rarity: 'common' }),
      }),
    )
    await page.getByTestId('auto-battle-toggle').click()
    await expect(page.getByTestId('auto-battle-toggle')).toContainText('수동')

    await page.getByTestId('nav-equipment').click()
    await expect(page.getByTestId('equipment-level-weapon')).toContainText('+0')

    await page.getByTestId('equip-enhance-weapon').click()
    await expect(page.getByTestId('enhance-rate-text')).toContainText('100%')
    await page.getByTestId('enhance-confirm').click()

    await expect(page.locator('.modal__result')).toContainText('강화 성공')
    await expect(page.getByTestId('enhance-close')).toBeEnabled({ timeout: 3_000 })
    await page.getByTestId('enhance-close').click()

    await expect(page.getByTestId('equipment-level-weapon')).toContainText('+1')

    // common, level0 강화 비용 = 100. AUTO를 끄기까지의 아주 짧은 틈에 미세한 골드 드리프트가
    // 있을 수 있어(수백 ms 사이의 tick 한두 번) 정확히 99,900은 아니어도, 비용만큼은 확실히
    // 깎여 있어야 한다는 넉넉한 범위로 검증한다.
    await expect
      .poll(async () => (await readSaveRecord(page))?.gold, {
        message: '강화 비용이 IndexedDB 저장 골드에도 반영되어야 한다',
        timeout: 5_000,
      })
      .toBeLessThan(99_950)
  })

  test('주문서를 사용하면 성공률이 15%p 올라간 값으로 표시된다', async ({ page }) => {
    await seedSaveAndReload(
      page,
      buildSaveData({
        gold: 100_000,
        equippedWeapon: buildEquipment({ enhanceLevel: 6, baseAttack: 1, rarity: 'common' }), // 60% 구간
      }),
    )
    await page.getByTestId('auto-battle-toggle').click()
    await expect(page.getByTestId('auto-battle-toggle')).toContainText('수동')

    await page.getByTestId('nav-equipment').click()
    await page.getByTestId('equip-enhance-weapon').click()

    await expect(page.getByTestId('enhance-rate-text')).toContainText('60%')
    await page.getByTestId('enhance-scroll-toggle').check()
    await expect(page.getByTestId('enhance-rate-text')).toContainText('75%')
  })
})
