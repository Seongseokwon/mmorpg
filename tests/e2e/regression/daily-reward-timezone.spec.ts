import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

test.use({ timezoneId: 'Asia/Seoul' })

/**
 * 발견 경위: rewardService.ts의 getTodayDateString()/isYesterday()가 toISOString()(UTC) 기반이라,
 * KST(UTC+9)에서는 로컬 자정이 아니라 오전 9시에 날짜가 바뀌어 일일 보상 리셋/스트릭 판정이
 * 최대 9시간 어긋났다.
 * 2026-07-07: getTodayDateString()/isYesterday()가 로컬 타임존 기준 날짜 문자열을 쓰도록 수정.
 */
test.describe('회귀: 일일 보상 리셋이 UTC 기준이라 KST 자정에 안 풀리는 버그', () => {
  test(
    'KST 기준 새 날짜가 됐으면(UTC로는 아직 전날) 일일 보상을 다시 받을 수 있어야 한다 (MEMORY.md #2-2)',
    async ({ page }) => {
      const fakeNow = new Date('2026-07-07T02:00:00+09:00')
      await page.clock.install({ time: fakeNow })

      await seedSaveAndReload(
        page,
        buildSaveData({
          dailyReward: { lastClaimDate: '2026-07-06', streak: 3 },
          // lastActiveAt도 가짜 시계 기준으로 "방금 접속"이어야, 의도치 않은 오프라인 보상 모달이
          // 떠서 클릭을 가로채는 일이 없다.
          lastActiveAt: fakeNow.getTime(),
        }),
      )

      await page.getByTestId('nav-reward').click()

      await expect(page.getByTestId('daily-claim-box')).toBeVisible({ timeout: 3_000 })
    },
  )

  test('같은 로컬(KST) 날짜 안에서는 "오늘 수령 완료" 문구가 그대로 남아있다', async ({ page }) => {
    const fakeNow = new Date('2026-07-06T23:00:00+09:00')

    await page.clock.install({ time: fakeNow })

    await seedSaveAndReload(
      page,
      buildSaveData({
        dailyReward: { lastClaimDate: '2026-07-06', streak: 3 },
        lastActiveAt: fakeNow.getTime(),
      }),
    )

    await page.getByTestId('nav-reward').click()
    await expect(page.getByTestId('daily-streak')).toContainText('오늘 수령 완료')
  })
})
