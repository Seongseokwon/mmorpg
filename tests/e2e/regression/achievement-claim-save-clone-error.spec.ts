import { test, expect } from '@playwright/test'
import { readSaveRecord, seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

/**
 * 회귀: achievement.store.ts의 collectProgress()가 { ...progress.value }로만 얕게 복사해서,
 * 업적을 하나라도 수령한 뒤에는 각 { claimed } 항목이 Vue reactive Proxy 참조로 남아 있었다.
 * IndexedDB(구조화 복제 알고리즘)는 Proxy를 직렬화할 수 없어 "DataCloneError: Proxy object
 * could not be cloned"로 저장 자체가 실패했다 — 게임은 계속 되지만 "저장 불가" 배너가 뜨고
 * 그 뒤로 어떤 진행 상황도 저장 안 되는 심각한 버그. 실제 프로덕션(Firefox)에서 재현 확인 후 수정.
 */
test.describe('회귀: 업적 수령 후 IndexedDB 저장 실패(Proxy could not be cloned)', () => {
  test('업적을 수령해도 저장 불가 배너가 뜨지 않고, IndexedDB에 실제로 반영된다', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await seedSaveAndReload(
      page,
      buildSaveData({
        gold: 0,
        meta: { totalKills: 1, totalGachaPulls: 0, totalEnhances: 0, totalBossKills: 1 },
      }),
    )

    await page.getByTestId('nav-achievement').click()
    const claimButton = page.getByTestId('achievement-claim-first_boss')
    await expect(claimButton).toBeVisible()
    await claimButton.click()

    // scheduleSave()의 1초 디바운스 + 여유 시간
    await page.waitForTimeout(2_000)

    await expect(page.locator('.hunt-toast--warning')).toHaveCount(0)

    const record = await readSaveRecord(page)
    expect(record?.achievements?.first_boss?.claimed).toBe(true)

    const cloneErrors = consoleErrors.filter((e) => e.includes('could not be cloned'))
    expect(cloneErrors, `DataCloneError 발생: ${cloneErrors.join(', ')}`).toHaveLength(0)
  })
})
