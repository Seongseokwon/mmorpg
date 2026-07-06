import { test, expect } from '@playwright/test'
import { readSaveRecord, seedRawAndReload } from '../../helpers/db'

test.describe('버전 마이그레이션', () => {
  test('v2 이전(버전 필드 없음) 저장 데이터를 attackLevel/hpLevel 기준으로 마이그레이션한다', async ({
    page,
  }) => {
    await seedRawAndReload(page, {
      gold: 500,
      exp: 20,
      currentStage: 3,
      maxClearedStage: 3,
      attackLevel: 4,
      hpLevel: 2,
    })

    // migrateFromV2: str = attackLevel*2 = 8, vit = hpLevel*2 = 4,
    // level = max(1, 1 + floor((4+2)/4)) = 2
    await expect(page.getByTestId('player-level')).toContainText('Lv.2')
    await expect(page.getByTestId('currency-gold')).toContainText('500')

    // 마이그레이션은 로드 시 메모리 상태만 바꾸고, 뭔가 상태가 바뀌어야(watch 대상) 실제로
    // IndexedDB에 v4 포맷으로 다시 저장된다 — 그 저장 경로까지 함께 확인한다.
    await page.getByTestId('nav-character').click()
    await page.getByTestId('stat-alloc-str').click()

    await expect
      .poll(async () => (await readSaveRecord(page))?.version, { timeout: 5_000 })
      .toBe(4)

    const record = await readSaveRecord(page)
    expect(record?.mainStats.str).toBe(9)
    expect(record?.mainStats.vit).toBe(4)
  })

  test('손상된(빈 객체) 저장 데이터도 크래시 없이 기본값으로 복구된다', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await seedRawAndReload(page, {})

    await expect(page.getByTestId('player-level')).toContainText('Lv.1')
    await expect(page.getByTestId('auto-battle-toggle')).toBeVisible()
    expect(errors, `콘솔에 예상치 못한 에러가 발생함: ${errors.join(', ')}`).toHaveLength(0)
  })
})
