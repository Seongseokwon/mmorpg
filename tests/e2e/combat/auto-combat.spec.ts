import { test, expect } from '@playwright/test'
import { parseFormattedNumber } from '../../helpers/format'

/**
 * 캔버스(PixiJS) 안의 데미지 텍스트/스프라이트 애니메이션은 DOM에서 관측할 수 없으므로,
 * 자동전투가 "진짜로 동작 중"이라는 증거는 DOM에 반영되는 부작용(골드/HP/타겟 변화)으로 검증한다.
 */

test.describe('자동전투', () => {
  test('유저가 게임에 접속하면 자동전투가 기본으로 켜져 있고 골드가 저절로 늘어난다', async ({ page }) => {
    await page.goto('/')

    const autoToggle = page.getByTestId('auto-battle-toggle')
    await expect(autoToggle).toBeVisible()
    await expect(autoToggle).toContainText('AUTO')

    const goldText = page.getByTestId('currency-gold')
    await expect(goldText).toBeVisible()
    const before = parseFormattedNumber(await goldText.innerText())

    await expect
      .poll(async () => parseFormattedNumber(await goldText.innerText()), {
        message: '자동전투로 몬스터를 잡으면 골드가 증가해야 한다',
        timeout: 15_000,
      })
      .toBeGreaterThan(before)
  })

  test('AUTO를 끄면 전투가 멈추고, 다시 켜면 재개된다', async ({ page }) => {
    await page.goto('/')

    const autoToggle = page.getByTestId('auto-battle-toggle')
    const goldText = page.getByTestId('currency-gold')

    // 자동전투가 몇 틱 진행되도록 기다렸다가 끈다
    await page.waitForTimeout(1_500)
    await autoToggle.click()
    await expect(autoToggle).toContainText('수동')

    const frozen = parseFormattedNumber(await goldText.innerText())
    await page.waitForTimeout(2_000)
    const stillFrozen = parseFormattedNumber(await goldText.innerText())
    expect(stillFrozen).toBe(frozen)

    await autoToggle.click()
    await expect(autoToggle).toContainText('AUTO')

    await expect
      .poll(async () => parseFormattedNumber(await goldText.innerText()), {
        message: '다시 AUTO를 켜면 골드가 재증가해야 한다',
        timeout: 15_000,
      })
      .toBeGreaterThan(stillFrozen)
  })
})
