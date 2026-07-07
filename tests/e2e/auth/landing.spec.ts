import { test, expect } from '@playwright/test'

/**
 * 이 스펙은 백엔드(NestJS) 없이도 결정적으로 통과해야 한다 — playwright.config.ts의 webServer는
 * 프론트 dev 서버만 띄운다. 그래서 "로그인/회원가입 성공" 같은 실제 API 성공 경로는 검증하지 않고,
 * 라우팅/클라이언트 검증/에러 표시처럼 백엔드 유무와 무관하게 결정적인 동작만 확인한다.
 * 실제 API 계약(성공 응답 포함)은 server/test/*.e2e-spec.ts가 별도로 검증한다.
 */

test.describe('랜딩 화면', () => {
  test('최초 진입 시 랜딩 화면이 뜨고 게스트/로그인/회원가입 선택지를 보여준다', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('landing-guest')).toBeVisible()
    await expect(page.getByTestId('landing-login')).toBeVisible()
    await expect(page.getByTestId('landing-register')).toBeVisible()
  })

  test('게스트로 시작하면 로그인 없이 바로 게임 화면으로 진입한다', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('landing-guest').click()

    await expect(page).toHaveURL(/\/game$/)
    await expect(page.getByTestId('nav-character')).toBeVisible()
  })

  test('로그인/회원가입 화면으로 이동하고 다시 랜딩으로 돌아올 수 있다', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('landing-login').click()
    await expect(page).toHaveURL(/\/login$/)

    await page.getByText('← 처음으로').click()
    await expect(page).toHaveURL(/\/$/)

    await page.getByTestId('landing-register').click()
    await expect(page).toHaveURL(/\/register$/)
  })
})

test.describe('회원가입 폼 검증', () => {
  test('비밀번호가 8자 미만이면 제출하지 않고 안내 문구를 보여준다', async ({ page }) => {
    await page.goto('/register')

    await page.getByTestId('register-email').fill('new-user@example.com')
    await page.getByTestId('register-password').fill('short')
    await page.getByTestId('register-password-confirm').fill('short')
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('register-error')).toContainText('8자 이상')
    await expect(page).toHaveURL(/\/register$/)
  })

  test('비밀번호와 비밀번호 확인이 다르면 제출하지 않고 안내 문구를 보여준다', async ({ page }) => {
    await page.goto('/register')

    await page.getByTestId('register-email').fill('new-user@example.com')
    await page.getByTestId('register-password').fill('password123')
    await page.getByTestId('register-password-confirm').fill('password456')
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('register-error')).toContainText('일치하지 않습니다')
    await expect(page).toHaveURL(/\/register$/)
  })
})

test.describe('로그인 실패 처리', () => {
  test('잘못된 자격 증명으로 로그인하면 에러 메시지를 보여주고 게임으로 이동하지 않는다', async ({ page }) => {
    await page.goto('/login')

    await page.getByTestId('login-email').fill(`nobody-${Date.now()}@example.com`)
    await page.getByTestId('login-password').fill('wrong-password-123')
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/login$/)
  })
})
