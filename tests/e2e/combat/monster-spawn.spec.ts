import { test, expect } from '@playwright/test'

test.describe('몬스터 스폰', () => {
  test('몬스터를 잡으면 사냥터가 비지 않고 새 몬스터가 계속 나타난다', async ({ page }) => {
    await page.goto('/')

    const monsterBar = page.getByTestId('monster-bar')
    await expect(monsterBar).toBeVisible()

    const hpText = page.getByTestId('monster-hp')

    // "현재 타겟 몬스터"가 죽고 다음 몬스터로 교체되는 과정을 hp 텍스트 변화로 관측한다.
    // (죽은 순간 hp가 0/maxHp로 잠깐 찍히거나, 다음 몬스터의 새 maxHp로 바로 바뀐다)
    const seenHpValues = new Set<string>()
    for (let i = 0; i < 30; i++) {
      seenHpValues.add(await hpText.innerText())
      await page.waitForTimeout(500)
      if (seenHpValues.size >= 3) break
    }

    expect(
      seenHpValues.size,
      '사냥터가 살아있다면 15초 안에 몬스터 HP 표시가 최소 몇 차례는 바뀌어야 한다',
    ).toBeGreaterThanOrEqual(2)

    // 사냥터가 죽지 않고 계속 몬스터가 있어야 한다(패널이 사라지면 몬스터가 전멸했다는 뜻)
    await expect(monsterBar).toBeVisible()
  })
})
