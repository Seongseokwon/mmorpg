import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

test.describe('닉네임', () => {
  test('새 캐릭터는 #지역코드+타임스탬프 형식의 기본 닉네임을 자동 배정받는다', async ({ page }) => {
    await page.goto('/game')

    // createDefaultSaveData()가 굴린 값을 그대로 확인 — 형식만 검증(무작위 난수 포함이라 정확한 값은 알 수 없음)
    await expect(page.getByTestId('player-nickname')).toHaveText(/^#KR\d{17}$/)
  })

  test('닉네임을 누르면 변경 모달이 열리고, 저장하면 화면과 저장소에 반영된다', async ({ page }) => {
    await seedSaveAndReload(page, buildSaveData({ nickname: '#KR-OLD-NAME' }))

    await expect(page.getByTestId('player-nickname')).toHaveText('#KR-OLD-NAME')

    await page.getByTestId('player-nickname').click()
    const input = page.getByTestId('nickname-input')
    await expect(input).toBeVisible()
    await input.fill('용사킹')
    await page.getByTestId('nickname-save').click()

    await expect(page.getByTestId('nickname-input')).toHaveCount(0)
    await expect(page.getByTestId('player-nickname')).toHaveText('용사킹')

    // scheduleSave()가 1초 디바운스이므로 저장이 실제 반영될 시간을 준다
    await page.waitForTimeout(1_500)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByTestId('player-nickname')).toHaveText('용사킹')
  })

  test('너무 짧거나 긴 닉네임은 에러 메시지를 보여주고 저장하지 않는다', async ({ page }) => {
    await seedSaveAndReload(page, buildSaveData({ nickname: '#KR-OLD-NAME' }))

    await page.getByTestId('player-nickname').click()
    await page.getByTestId('nickname-input').fill('a')
    await page.getByTestId('nickname-save').click()

    await expect(page.getByTestId('nickname-error')).toContainText('2자 이상')
    // 에러 후에도 모달은 열려있고 기존 닉네임은 그대로다
    await expect(page.getByTestId('nickname-input')).toBeVisible()

    await page.getByTestId('nickname-input').fill('a'.repeat(13))
    await page.getByTestId('nickname-save').click()
    await expect(page.getByTestId('nickname-error')).toContainText('12자 이하')

    await page.getByTestId('nickname-close').click()
    await expect(page.getByTestId('player-nickname')).toHaveText('#KR-OLD-NAME')
  })
})
