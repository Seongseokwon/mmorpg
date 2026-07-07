import { test, expect } from '@playwright/test'

// 애플/구글 접근성 가이드라인의 최소 터치 타겟 권장 크기(44x44 / 48x48)에는 못 미치더라도,
// 최소한 "실수로 못 누를 정도로 작지는 않은" 기준선으로 40px를 잡는다.
const MIN_TOUCH_TARGET_PX = 40

test.describe('터치 인터랙션', () => {
  test('하단 네비게이션 버튼들이 실수 없이 탭할 수 있는 크기를 갖는다', async ({ page }) => {
    await page.goto('/game')

    for (const id of ['nav-character', 'nav-equipment', 'nav-skill', 'nav-reward', 'nav-achievement', 'nav-stage']) {
      const box = await page.getByTestId(id).boundingBox()
      expect(box, `${id} 버튼의 bounding box를 찾을 수 없음`).not.toBeNull()
      expect(box!.height, `${id} 버튼 높이가 너무 작음`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
    }
  })

  test('AUTO 토글을 탭하면 즉시 상태가 바뀐다', async ({ page }) => {
    await page.goto('/game')

    const toggle = page.getByTestId('auto-battle-toggle')
    await expect(toggle).toContainText('AUTO')

    await toggle.tap()
    await expect(toggle).toContainText('수동')

    await toggle.tap()
    await expect(toggle).toContainText('AUTO')
  })

  test('스탯 화면 버튼도 탭으로 정상 동작한다', async ({ page }) => {
    await page.goto('/game')
    // 자동전투로 레벨업이 일어나 statPoints가 변하기 전에 고정해둔다
    await page.getByTestId('auto-battle-toggle').tap()
    await page.getByTestId('nav-character').tap()

    await expect(page.getByTestId('stat-alloc-str')).toBeVisible()
    const box = await page.getByTestId('stat-alloc-str').boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)

    await page.getByTestId('stat-alloc-str').tap()
    // 탭이 실제로 클릭 이벤트를 발생시켜 statPoints가 줄어드는지 확인
    await expect(page.getByTestId('main-stat-points')).toContainText('4')
  })
})
