import { test, expect } from '@playwright/test'

/**
 * 이 스펙은 백엔드(NestJS) 없이도 결정적으로 통과해야 한다 — playwright.config.ts의 webServer는
 * 프론트 dev 서버만 띄운다. 그래서 "랭킹 데이터가 실제로 정렬되어 표시된다" 같은 백엔드 의존 검증은
 * 하지 않고, 탭 진입과 백엔드 미응답 시 에러 처리처럼 결정적인 동작만 확인한다. 실제 정렬/데이터
 * 계약은 `server/test/ranking.e2e-spec.ts`가 별도로 검증한다.
 */
test.describe('랭킹', () => {
  test('랭킹 탭을 열 수 있고, 백엔드 응답이 없으면 에러 메시지를 보여준다', async ({ page }) => {
    await page.goto('/game')
    await page.getByTestId('nav-ranking').click()

    const sheet = page.getByTestId('game-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet).toContainText('랭킹')

    await expect(page.getByTestId('ranking-error')).toBeVisible({ timeout: 10_000 })
  })
})
