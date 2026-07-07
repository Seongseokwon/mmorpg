import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildEquipment, buildSaveData } from '../../fixtures/save-data'

/**
 * 발견 경위: "오프라인 후에 착용해놓은 장비가 풀리고 사라진다"는 제보를 재현한 결과,
 * save.store.ts의 scheduleSave()는 상태 변화 후 1초 디바운스를 두고 IndexedDB에 쓰는데
 * useGameSession.ts에는 탭이 숨겨지거나 닫힐 때 이를 즉시 flush하는 핸들러가 전혀 없었다.
 * 장착 직후 1초가 지나기 전에 탭이 닫히면(=오프라인 전환) 그 장착 변경분은 저장되지 않고,
 * 다음 접속 때 그 이전(미장착) 상태로 되돌아갔다.
 * useGameSession.ts에 visibilitychange(hidden)/pagehide 핸들러로 saveNow()를 강제 호출하고,
 * 특히 장착 장비는 되돌릴 수 없는 손실이라 별도 watch로 디바운스 없이 즉시 저장하도록
 * 수정 완료 (2026-07-07).
 */
test.describe('회귀: 장착 직후 탭 종료 시 장비 유실', () => {
  test('장비 장착 직후 곧바로 탭이 닫혀도(저장 디바운스 1초 이전) 재접속 시 장착이 유지된다', async ({
    page,
  }) => {
    await seedSaveAndReload(
      page,
      buildSaveData({
        gold: 999_999,
        equipmentBag: [buildEquipment({ name: '테스트 검', baseAttack: 50 })],
        equippedWeapon: null,
      }),
    )

    // 자동전투 드롭/자동교체가 결과에 섞이지 않도록 끈다
    await page.getByTestId('auto-battle-toggle').click()

    // 인벤토리(장비 획득함)와 장비창(착용 슬롯)은 같은 'equipment' 탭 시트 안에 함께 렌더링된다
    await page.getByTestId('nav-equipment').click()
    await page.getByTestId('inventory-equip').click()

    await expect(page.getByTestId('equipment-slot-weapon')).not.toHaveClass(/equipment__slot--empty/)
    await expect(page.getByTestId('equipment-stat-weapon')).toContainText('50')

    // 저장 디바운스(1초)를 기다리지 않고 곧바로 탭이 닫혔다고 가정 — 새로고침으로 재현
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    await page.getByTestId('nav-equipment').click()
    await expect(page.getByTestId('equipment-slot-weapon')).not.toHaveClass(/equipment__slot--empty/)
    await expect(page.getByTestId('equipment-stat-weapon')).toContainText('50')
  })
})
