import { expect, test, type Page } from '@playwright/test'

const logoutApiPath = /^https:\/\/[^/]+\/app\/auth\/logout(?:\?.*)?$/
const reissueApiPath = /^https:\/\/[^/]+\/app\/auth\/reissue(?:\?.*)?$/

const origin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'
const sessionKeys = ['accessToken', 'refreshToken', 'toyvillage.session.user']

// 세션은 storageState 로 심는다. addInitScript 는 /login 이동 뒤에도 다시 돌아
// 지운 토큰을 되살린다.
test.use({
  storageState: {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [
          { name: 'accessToken', value: 'a1' },
          { name: 'refreshToken', value: 'r1' },
          {
            name: 'toyvillage.session.user',
            value: JSON.stringify({ name: '관리자 1', role: 'APP_ADMIN' }),
          },
        ],
      },
    ],
  },
})

test.beforeEach(async ({ page }) => {
  // 화면의 다른 API 요청은 막는다. 뒤에 등록한 route 가 우선한다.
  await page.route(/^https:\/\//, (route) => route.abort())
})

test('S1: 200 → 요청 1회 후 세션을 비우고 /login 으로 이동한다', async ({
  page,
}) => {
  const logout = trackLogout(page, () => ({
    status: 200,
    body: { message: '로그아웃되었습니다.' },
  }))

  await clickLogout(page)

  await expectSessionEnded(page)
  expect(logout.count()).toBe(1)
  expect(logout.methods()).toEqual(['POST'])
  expect(logout.bodies()).toEqual([null])
  expect(logout.authorizations()).toEqual(['Bearer a1'])
})

test('S2: 403 → 재발급 없이 세션을 비우고 /login 으로 이동한다', async ({
  page,
}) => {
  const reissue = trackReissue(page)
  const logout = trackLogout(page, () => ({ status: 403, body: null }))

  await clickLogout(page)

  await expectSessionEnded(page)
  expect(logout.count()).toBe(1)
  expect(reissue.count()).toBe(0)
})

test('S3: 500 → 세션을 비우고 /login 으로 이동한다', async ({ page }) => {
  const logout = trackLogout(page, () => ({
    status: 500,
    body: errorBody(500, '내부 서버 오류가 발생했습니다.'),
  }))

  await clickLogout(page)

  await expectSessionEnded(page)
  expect(logout.count()).toBe(1)
})

test('S4: 네트워크 실패 → 세션을 비우고 /login 으로 이동한다', async ({
  page,
}) => {
  let count = 0
  await page.route(logoutApiPath, async (route) => {
    count += 1
    await route.abort('failed')
  })

  await clickLogout(page)

  await expectSessionEnded(page)
  expect(count).toBe(1)
})

test('S5: 401 → 재발급 1회 → 새 토큰으로 재시도 후 /login 이동', async ({
  page,
}) => {
  const reissue = trackReissue(page)
  const logout = trackLogout(page, (authorization) =>
    authorization === 'Bearer a1'
      ? { status: 401, body: errorBody(401, '만료된 토큰입니다.') }
      : { status: 200, body: { message: '로그아웃되었습니다.' } },
  )

  await clickLogout(page)

  await expectSessionEnded(page)
  expect(reissue.count()).toBe(1)
  expect(logout.authorizations()).toEqual(['Bearer a1', 'Bearer a2'])
})

test('S6: 응답 대기 중 여러 번 눌러도 요청은 1회다', async ({ page }) => {
  const logout = trackLogout(
    page,
    () => ({ status: 200, body: { message: '로그아웃되었습니다.' } }),
    800,
  )

  await openSidebar(page)
  await logoutButton(page).click()
  await logoutButton(page).click()
  await logoutButton(page).click()

  await expectSessionEnded(page)
  expect(logout.count()).toBe(1)
})

test('S7: 200 응답 형식이 달라도 세션을 비우고 /login 으로 이동한다', async ({
  page,
}) => {
  const logout = trackLogout(page, () => ({ status: 200, body: {} }))

  await clickLogout(page)

  await expectSessionEnded(page)
  expect(logout.count()).toBe(1)
})

const sidebar = (page: Page) => page.getByRole('dialog', { name: '사이드바' })
const logoutButton = (page: Page) =>
  sidebar(page).getByRole('button', { name: '로그아웃', exact: true })

async function openSidebar(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await expect(sidebar(page)).toBeVisible()
}

async function clickLogout(page: Page) {
  await openSidebar(page)
  await logoutButton(page).click()
}

async function expectSessionEnded(page: Page) {
  await expect(page).toHaveURL(/\/login$/)
  const stored = await page.evaluate(
    (keys) => keys.map((key) => localStorage.getItem(key)),
    sessionKeys,
  )
  expect(stored).toEqual([null, null, null])
}

interface MockResponse {
  status: number
  body: unknown
}

function trackLogout(
  page: Page,
  respond: (authorization: string | undefined) => MockResponse,
  delayMs = 0,
) {
  const methods: string[] = []
  const bodies: (string | null)[] = []
  const authorizations: (string | undefined)[] = []

  void page.route(logoutApiPath, async (route) => {
    const request = route.request()
    const authorization = request.headers().authorization
    methods.push(request.method())
    bodies.push(request.postData())
    authorizations.push(authorization)

    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))

    const { status, body } = respond(authorization)
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: body === null ? '' : JSON.stringify(body),
    })
  })

  return {
    count: () => methods.length,
    methods: () => methods,
    bodies: () => bodies,
    authorizations: () => authorizations,
  }
}

function trackReissue(page: Page) {
  let count = 0

  void page.route(reissueApiPath, async (route) => {
    count += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'a2', refresh_token: 'r2' }),
    })
  })

  return { count: () => count }
}

function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-09-17T20:00:00.000000',
    description: message,
  }
}
