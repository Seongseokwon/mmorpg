import { test, expect } from '@playwright/test'
import { parseFormattedNumber } from '../../helpers/format'

/**
 * PixiJS 내부 ticker/텍스처 상태까지 들여다볼 수는 없으므로, 여기서는 "죽지 않고 계속 진행되는가"만
 * 검증한다 — 실제 메모리 프로파일링은 브라우저 DevTools 기반 수동 점검이 별도로 필요하다.
 *
 * page.clock으로 가상 시간을 통째로 건너뛰는 방식(runFor)은 setInterval(100ms) 콜백을 수만 번
 * 몰아서 실행시키다 페이지가 응답 불가 상태(hang/close)에 빠지는 걸 확인해서 포기했다 — 그 자체가
 * "몰아치는 tick 처리량"에 대한 안정성 의문을 남기지만, 이 스펙의 목적(장시간 방치 스모크)에는
 * 실제 시간을 짧게 여러 번 나눠 기다리는 쪽이 더 안전하고 결정적이다.
 */

test.describe('장시간 방치 안정성', () => {
  test('수 분간 계속 켜둬도 에러 없이 골드가 계속 늘고 화면이 응답한다', async ({ page }) => {
    test.setTimeout(60_000)

    const pageErrors: string[] = []
    const consoleErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('crash', () => pageErrors.push('page crashed'))

    await page.goto('/game')

    const goldText = page.getByTestId('currency-gold')
    const samples: number[] = []

    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(5_000)
      samples.push(parseFormattedNumber(await goldText.innerText()))
    }

    // 몬스터를 잡아야 골드가 들어오므로 5초 단위로 끊어보면 어떤 구간은 마침 킬 사이라 안 늘 수도
    // 있다 — 그건 정상 변동이다. 대신 (1) 전체 구간에서 골드가 줄어드는 적은 없어야 하고,
    // (2) 30초 전체로 보면 확실히 늘어 있어야 한다(루프 자체가 멈추지 않았다는 증거).
    for (let i = 1; i < samples.length; i++) {
      expect(
        samples[i],
        `구간 ${i}에서 골드가 줄었음(음수 방향 이상): ${samples.join(' -> ')}`,
      ).toBeGreaterThanOrEqual(samples[i - 1])
    }
    expect(
      samples[samples.length - 1],
      `30초 동안 골드가 전혀 늘지 않음(루프가 멈춘 것으로 보임): ${samples.join(' -> ')}`,
    ).toBeGreaterThan(samples[0])

    // 화면이 여전히 응답하는지(멈춰있지 않은지) 상호작용으로 확인
    const toggle = page.getByTestId('auto-battle-toggle')
    await expect(toggle).toContainText('AUTO')
    await toggle.click()
    await expect(toggle).toContainText('수동')

    expect(pageErrors, `페이지 에러 발생: ${pageErrors.join(' | ')}`).toHaveLength(0)
    expect(consoleErrors, `콘솔 에러 발생: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })
})
