import { test, expect } from '@playwright/test'
import { readSaveRecord, seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

test.describe('IndexedDB 저장', () => {
  test('스탯 포인트를 투자하면 디바운스 후 IndexedDB에 실제로 반영된다', async ({ page }) => {
    await seedSaveAndReload(page, buildSaveData({ statPoints: 5 }))

    await page.getByTestId('nav-character').click()
    await page.getByTestId('stat-alloc-str').click()

    // scheduleSave()는 1초 디바운스이므로 여유를 두고 확인한다
    await expect
      .poll(async () => (await readSaveRecord(page))?.mainStats.str, {
        message: '강화 후 IndexedDB의 str 값이 갱신되어야 한다',
        timeout: 5_000,
      })
      .toBe(2)

    const record = await readSaveRecord(page)
    expect(record?.statPoints).toBe(4)
  })

  test('저장된 레코드의 버전은 항상 최신(v5) 포맷이다', async ({ page }) => {
    await seedSaveAndReload(page, buildSaveData())
    await page.getByTestId('nav-character').click()
    await page.getByTestId('stat-alloc-str').click()

    await expect
      .poll(async () => (await readSaveRecord(page))?.version, { timeout: 5_000 })
      .toBe(5)
  })
})
