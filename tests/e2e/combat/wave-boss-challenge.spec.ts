import { test, expect } from '@playwright/test'
import { seedSaveAndReload } from '../../helpers/db'
import { buildSaveData } from '../../fixtures/save-data'

test.describe('웨이브 → 보스 도전 시스템', () => {
  test(
    '웨이브 3개를 모두 클리어하고 보스를 처치하면 다음 스테이지로 진행된다',
    async ({ page }) => {
      test.setTimeout(60_000)

      // str을 충분히 높여 일반 몬스터/보스 모두 몇 방 안에 처치되도록 해서 결정적으로 빠르게 끝낸다.
      await seedSaveAndReload(
        page,
        buildSaveData({
          mainStats: { str: 30, vit: 30, dex: 0, luk: 0 },
          currentStage: 1,
          maxClearedStage: 1,
        }),
      )

      const challengeButton = page.getByTestId('challenge-button')
      const phaseLabel = page.getByTestId('quest-phase-label')

      await expect(challengeButton).toBeVisible()
      await challengeButton.click()

      // 웨이브 진행 확인 (1웨이브만 확정적으로 관측 — 이후 웨이브는 클리어 속도에 따라 순식간에 지나갈 수 있음)
      await expect(phaseLabel).toContainText('웨이브', { timeout: 10_000 })

      // 3웨이브를 다 넘기면 보스가 등장한다
      await expect(phaseLabel).toContainText('보스전', { timeout: 20_000 })

      // 보스 처치 → 승리 토스트 + 다음 스테이지 진행
      await expect(page.getByTestId('boss-victory-toast')).toBeVisible({ timeout: 20_000 })
      await expect(page.getByTestId('stage-current')).toContainText('사냥터 2')

      // 승리 직후 파밍으로 복귀해 "도전" 버튼이 다시 보여야 한다
      await expect(challengeButton).toBeVisible()
    },
  )

  test(
    '보스 도전 중 플레이어가 사망하면 페널티 없이 같은 스테이지의 파밍으로 복귀한다',
    async ({ page }) => {
      // 고스테이지(10) + 무투자 스탯으로 시딩해, 몬스터 공격력(25) 대비 플레이어 체력(100)이
      // 압도적으로 낮아 몇 초 안에 확정적으로 사망하도록 만든다. 반대로 플레이어 공격력도 낮아
      // (공격 10 vs 몬스터 HP 257) 웨이브가 먼저 클리어될 일은 없다.
      await seedSaveAndReload(
        page,
        buildSaveData({
          mainStats: { str: 0, vit: 0, dex: 0, luk: 0 },
          currentStage: 10,
          maxClearedStage: 10,
        }),
      )

      const challengeButton = page.getByTestId('challenge-button')
      await expect(challengeButton).toBeVisible()
      await challengeButton.click()

      await expect(page.getByTestId('boss-defeat-toast')).toBeVisible({ timeout: 15_000 })

      // 스테이지는 그대로 유지되고, 파밍으로 복귀해 "도전" 버튼이 다시 노출되어야 한다
      await expect(page.getByTestId('stage-current')).toContainText('사냥터 10')
      await expect(challengeButton).toBeVisible()
      await expect(page.getByTestId('quest-phase-label')).toContainText('파밍')
    },
  )
})
