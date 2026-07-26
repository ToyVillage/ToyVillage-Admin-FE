import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'
const serverURL = new URL(baseURL)
if (!['localhost', '127.0.0.1'].includes(serverURL.hostname)) {
  throw new Error('실제 API e2e의 프론트엔드 주소는 로컬 호스트만 허용됩니다')
}
if (process.env.API_E2E_REAL_SERVER !== 'true') {
  throw new Error('실제 API e2e는 전용 하네스 명령으로만 실행할 수 있습니다')
}
const apiURL = new URL(process.env.VITE_API_BASE_URL ?? '')
if (apiURL.protocol !== 'https:') {
  throw new Error('실제 API e2e는 staging HTTPS API만 허용됩니다')
}

const serverPort = serverURL.port || '5173'
if (!/^\d+$/.test(serverPort)) {
  throw new Error('PLAYWRIGHT_BASE_URL의 포트가 유효하지 않습니다')
}

export default defineConfig({
  testDir: './tests/e2e/api-real',
  forbidOnly: true,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    serviceWorkers: 'block',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium-real-api', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `yarn dev --host 127.0.0.1 --port ${serverPort}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
