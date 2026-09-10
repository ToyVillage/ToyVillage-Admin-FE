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

// 인증 가드가 붙은 뒤로 보호 경로 테스트는 세션이 필요하다.
// 테스트마다 토큰을 심는 대신 기본 storageState로 한 번에 seed 한다.
// 세션이 없는 상태를 검증하는 테스트는 test.use({ storageState: ... })로 비운다.
const authenticatedStorageState = {
  cookies: [],
  origins: [
    {
      origin: baseURL,
      // refresh token은 넣지 않는다. 재발급 흐름을 검증하는 테스트만
      // addInitScript로 직접 심어 실제 서버로 요청이 새지 않게 한다.
      localStorage: [{ name: 'accessToken', value: 'test-access-token' }],
    },
  ],
}

// 하네스 기능 테스트 설정. 로컬 dev 서버를 띄워 테스트한다.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL,
    storageState: authenticatedStorageState,
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
