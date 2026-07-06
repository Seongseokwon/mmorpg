import { test, expect } from '@playwright/test'

test.describe('모바일 UI', () => {
  test('모바일 화면에서 하단 네비게이션과 스킬바가 보이고, 탭하면 시트가 열리고 닫힌다', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('nav-character')).toBeVisible()
    await expect(page.getByTestId('auto-battle-toggle')).toBeVisible()

    await page.getByTestId('nav-equipment').tap()
    const sheet = page.getByTestId('game-sheet')
    await expect(sheet).toBeVisible()

    await page.getByTestId('sheet-close').tap()
    await expect(sheet).toHaveCount(0)
  })

  test('모바일 뷰포트에서 가로 스크롤(overflow)이 발생하지 않는다', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(500) // 캔버스/레이아웃이 안정화될 시간

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))

    expect(scrollWidth, '가로 스크롤이 생기면 안 됨(레이아웃이 뷰포트 밖으로 넘침)').toBeLessThanOrEqual(
      clientWidth + 1, // 서브픽셀 렌더링 오차 허용
    )
  })
})
