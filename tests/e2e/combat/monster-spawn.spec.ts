import { test, expect } from '@playwright/test'

test.describe('몬스터 스폰', () => {
  test('몬스터를 잡으면 사냥터가 비지 않고 새 몬스터가 계속 나타난다', async ({ page }) => {
    await page.goto('/game')

    // 몬스터 개별 HP 미니바 (MonsterHpBars.vue) — 파밍 중에는 최소 1개는 항상 보여야 한다.
    const hpBars = page.locator('[data-testid^="monster-hp-bar-"]')
    await expect(hpBars.first()).toBeVisible()

    // 몬스터가 죽고 새로 스폰되는 과정을, 화면에 떠 있는 몬스터들의 testid 구성이 바뀌는 것으로 관측한다.
    const seenIdSets = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const ids = await hpBars.evaluateAll((els) =>
        els
          .map((el) => el.getAttribute('data-testid'))
          .sort()
          .join(','),
      )
      seenIdSets.add(ids)
      await page.waitForTimeout(500)
      if (seenIdSets.size >= 2) break
    }

    expect(
      seenIdSets.size,
      '사냥터가 살아있다면 15초 안에 몬스터 구성이 최소 한 번은 바뀌어야 한다',
    ).toBeGreaterThanOrEqual(2)

    // 사냥터가 전멸하지 않고 계속 몬스터가 있어야 한다
    await expect(hpBars.first()).toBeVisible()
  })
})
