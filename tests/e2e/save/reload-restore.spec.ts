import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildEquipment, buildSaveData } from '../../fixtures/save-data'

test.describe('저장 복구', () => {
  test('시딩한 저장 데이터가 새로고침 후 화면에 그대로 반영된다', async ({ page }) => {
    await seedSaveAndReload(
      page,
      buildSaveData({
        gold: 12_345,
        level: 7,
        currentStage: 4,
        maxClearedStage: 5,
      }),
    )

    await expect(page.getByTestId('player-level')).toContainText('Lv.7')
    await expect(page.getByTestId('stage-current')).toContainText('4')

    await page.getByTestId('nav-stage').click()
    await expect(page.getByTestId('stage-panel-current')).toContainText('4')
  })

  test('장착 장비도 새로고침 후 유지된다', async ({ page }) => {
    await seedSaveAndReload(
      page,
      buildSaveData({
        // baseAttack을 낮게 잡는다: autoEquipIfBetter()의 비교 방향이 뒤집혀 있어서
        // (회귀 테스트: regression/auto-equip-inverted.spec.ts) 스탯이 높을수록 오히려
        // 몬스터 드롭에 더 쉽게 교체돼 버린다. 이 테스트의 목적은 "저장이 유지되는가"이므로
        // 그 버그의 영향을 안 받는 낮은 스탯을 쓴다.
        equippedWeapon: buildEquipment({ name: '전설의 검', enhanceLevel: 3, baseAttack: 1 }),
      }),
    )
    await page.getByTestId('auto-battle-toggle').click()

    await page.getByTestId('nav-equipment').click()
    await expect(page.getByTestId('equipment-level-weapon')).toContainText('+3')
  })
})
