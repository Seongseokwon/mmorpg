import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

test.use({ timezoneId: 'Asia/Seoul' })

test.describe('회귀: 일일 보상 리셋이 UTC 기준이라 KST 자정에 안 풀리는 버그', () => {
  test(
    'KST 기준 새 날짜가 됐으면(UTC로는 아직 전날) 일일 보상을 다시 받을 수 있어야 한다 (MEMORY.md #2-2)',
    async ({ page }) => {
      // rewardService.ts의 getTodayDateString()이 toISOString() 기반(UTC)이라,
      // KST 2026-07-07 02:00은 로컬로는 새 날이지만 UTC 날짜는 아직 "2026-07-06"이다.
      // 고쳐지기 전까지는 이 테스트가 "실패"하는 게 정상이다.
      test.fail(true, 'MEMORY.md #2-2 미해결: 날짜 판정이 UTC 기준이라 KST 자정에 리셋 안 됨')

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

      // 기대(수정 후) 동작: 로컬 날짜가 바뀌었으니 "오늘의 보상"을 다시 받을 수 있어야 한다.
      await expect(page.getByTestId('daily-claim-box')).toBeVisible({ timeout: 3_000 })
    },
  )

  test('현재 동작: 같은 UTC 날짜 안에서는 "오늘 수령 완료" 문구가 그대로 남아있다', async ({ page }) => {
    const fakeNow = new Date('2026-07-07T02:00:00+09:00')
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
