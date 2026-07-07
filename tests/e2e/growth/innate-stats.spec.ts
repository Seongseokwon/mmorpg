import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

async function readStatSum(page: import('@playwright/test').Page): Promise<number> {
  const ids = ['str', 'vit', 'dex', 'luk'] as const
  let sum = 0
  for (const id of ids) {
    const text = await page.getByTestId(`stat-value-${id}`).innerText()
    sum += Number(text)
  }
  return sum
}

test.describe('선천 능력치', () => {
  test('새 캐릭터는 선천 능력치 10포인트를 무작위로 자동 배분받는다', async ({ page }) => {
    // 시딩 없이 완전히 새로운(저장 없는) 상태로 진입 — createDefaultSaveData()가 굴린 값을 그대로 확인한다.
    await page.goto('/game')
    await page.waitForLoadState('domcontentloaded')

    await page.getByTestId('nav-character').click()

    // 신규 캐릭터의 수동 배분(mainStats)은 전부 0이므로, 화면에 보이는 합계는 선천 능력치 총합과 같다.
    await expect.poll(() => readStatSum(page)).toBe(10)
  })

  test('레벨업하면 선천 능력치도 함께 성장한다', async ({ page }) => {
    // mainStats(50) + innateStats(10) = 60이 레벨업 전 고정 베이스라인.
    // 자동전투가 로드 직후부터 돌기 때문에 "레벨업 직전" 스냅샷을 정확히 잡기는 어려우므로,
    // 레벨업이 실제로 일어난 뒤 합계가 베이스라인(60)보다 커졌는지로 성장 여부만 검증한다.
    const baseline = 50 + 10

    await seedSaveAndReload(
      page,
      buildSaveData({
        mainStats: { str: 50, vit: 0, dex: 0, luk: 0 },
        innateStats: { str: 2, vit: 3, dex: 3, luk: 2 }, // 합계 10
        exp: 39, // getExpToNextLevel(1) === 40 — 몬스터 한 마리만 잡아도 레벨업
        currentStage: 1,
      }),
    )

    await expect(page.getByTestId('player-level')).toContainText('Lv.2', { timeout: 10_000 })

    // 더 이상의 레벨업으로 값이 흔들리기 전에 자동전투를 멈추고 고정된 값을 읽는다
    await page.getByTestId('auto-battle-toggle').click()

    await page.getByTestId('nav-character').click()
    const after = await readStatSum(page)
    expect(after, '레벨업 1회 = 선천 능력치 +1').toBeGreaterThan(baseline)
  })

  test('새로고침해도 선천 능력치가 다시 굴려지지 않고 그대로 유지된다', async ({ page }) => {
    await seedSaveAndReload(
      page,
      buildSaveData({
        mainStats: { str: 0, vit: 0, dex: 0, luk: 0 },
        innateStats: { str: 4, vit: 3, dex: 2, luk: 1 },
      }),
    )

    await page.getByTestId('nav-character').click()
    expect(await readStatSum(page)).toBe(10)

    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.getByTestId('nav-character').click()

    expect(await readStatSum(page)).toBe(10)
  })
})
