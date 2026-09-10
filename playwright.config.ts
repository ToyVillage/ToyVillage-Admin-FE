import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'
const serverURL = new URL(baseURL)
if (!['localhost', '127.0.0.1'].includes(serverURL.hostname)) {
  throw new Error('PLAYWRIGHT_BASE_URL은 로컬 호스트만 사용할 수 있습니다')
}
const serverPort = serverURL.port || '5173'
if (!/^\d+$/.test(serverPort)) {
  throw new Error('PLAYWRIGHT_BASE_URL의 포트가 유효하지 않습니다')
}

// 하네스 기능 테스트 설정. 로컬 dev 서버를 띄워 테스트한다.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `yarn dev --host 127.0.0.1 --port ${serverPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
