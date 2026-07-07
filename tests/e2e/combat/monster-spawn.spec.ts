import { test, expect } from '@playwright/test'

test.describe('몬스터 스폰', () => {
  test('몬스터를 잡으면 사냥터가 비지 않고 새 몬스터가 계속 나타난다', async ({ page }) => {
    await page.goto('/')

    // 몬스터 개별 HP 미니바 (MonsterHpBars.vue) — 사냥터가 살아있는 한 최소 1개는 항상 보여야 한다.
    const hpBars = page.locator('[data-testid^="monster-hp-bar-"]')
    await expect(hpBars.first()).toBeVisible()

    const killProgress = page.getByTestId('quest-kill-progress')

    // 몬스터가 죽고 스폰되는 과정을 "몬스터 처치" 진행도(0/3, 1/3, 2/3 순환) 변화로 관측한다.
    const seenValues = new Set<string>()
    for (let i = 0; i < 30; i++) {
      seenValues.add(await killProgress.innerText())
      await page.waitForTimeout(500)
      if (seenValues.size >= 2) break
    }

    expect(
      seenValues.size,
      '사냥터가 살아있다면 15초 안에 처치 진행도가 최소 한 번은 바뀌어야 한다',
    ).toBeGreaterThanOrEqual(2)

    // 사냥터가 전멸하지 않고 계속 몬스터가 있어야 한다
    await expect(hpBars.first()).toBeVisible()
  })
})
