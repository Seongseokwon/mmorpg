import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildEquipment, buildSaveData } from '../../fixtures/save-data'

/**
 * 발견 경위: equipment-enhancement.spec.ts에서 "아무 드롭도 이길 수 없는" baseAttack 9999짜리
 * 무기를 시딩해뒀는데도, 자동전투가 잠깐 도는 사이 흔한 커먼 드롭으로 교체되는 현상이 재현됐다.
 * equipmentService.ts의 compareEquipment(a, b)가 "scoreB - scoreA"를 반환해서, "신규 드롭이 더
 * 좋다"는 뜻으로 쓰던 equipment.store.ts의 autoEquipIfBetter() 비교 방향이 뒤집혀 있었다.
 * equipmentService.ts:222-226에서 scoreA - scoreB로 수정 완료 (2026-07-06).
 */
test.describe('회귀: 장비 자동교체(autoEquipIfBetter) 비교 로직이 거꾸로 되어 있음', () => {
  test(
    '압도적으로 강한 무기가 장착되어 있으면, 훨씬 약한 새 드롭으로 교체되면 안 된다',
    async ({ page }) => {
      await seedSaveAndReload(
        page,
        buildSaveData({
          gold: 0,
          equippedWeapon: buildEquipment({ enhanceLevel: 0, baseAttack: 88_888, rarity: 'epic' }),
        }),
      )

      // 자동전투가 몬스터를 몇 마리 잡아 드롭이 몇 번 일어날 시간을 준다
      await page.waitForTimeout(8_000)

      await page.getByTestId('nav-equipment').click()
      // 기대(수정 후) 동작: 88888 공격력 무기보다 좋은 드롭은 존재할 수 없으므로 그대로 남아있어야 한다.
      await expect(page.getByTestId('equipment-stat-weapon')).toContainText('88888')
    },
  )
})
