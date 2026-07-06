import { defineConfig, devices } from '@playwright/test'

const PORT = 6868
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // 이 스펙들은 실제 setInterval 기반 자동전투 루프와 실시간으로 경쟁하기 때문에,
  // 워커를 너무 많이 띄우면 CPU 경합으로 타이밍이 흔들려 오탐(false flaky)이 생긴다.
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /mobile\//,
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
      testDir: './tests/e2e/mobile',
    },
  ],
})
