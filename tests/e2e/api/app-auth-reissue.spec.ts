import { expect, test, type Page, type Route } from '@playwright/test'

const reissueApiPath = /^https:\/\/[^/]+\/app\/auth\/reissue(?:\?.*)?$/
const loginApiPath = /^https:\/\/[^/]+\/app\/auth\/login(?:\?.*)?$/
const noticeListApiPath = /^https:\/\/[^/]+\/notice(?:\?.*)?$/
const closeDayApiPath = /^https:\/\/[^/]+\/close-day(?:\?.*)?$/
const openTimeApiPath = /^https:\/\/[^/]+\/open-time\/date(?:\?.*)?$/

const origin = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'

// 세션은 storageState 로 심는다. addInitScript 는 이동할 때마다 다시 돌아
// 로그아웃 뒤 재진입한 /login 에서 지운 토큰을 되살려 버린다.
function session(tokens: Record<string, string>) {
  return {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: Object.entries(tokens).map(([name, value]) => ({
          name,
          value,
        })),
      },
    ],
  }
}

// 재발급 흐름은 refresh token 이 있어야 시작한다.
test.use({
  storageState: session({ accessToken: 'expired', refreshToken: 'r1' }),
})

test('S1: 401 → 재발급 1회 → 원 요청 재시도 후 화면 성공', async ({ page }) => {
  const reissue = trackReissue(page, {
    status: 200,
    body: { access_token: 'a2', refresh_token: 'r2' },
  })
  const list = trackList(page, ['expired'])

  await page.goto('/notices/list')

  await expect(page.getByTestId('notice-row')).toHaveCount(1)
  await expect(page).toHaveURL(/\/notices\/list$/)
  expect(reissue.count()).toBe(1)
  expect(reissue.body()).toEqual({ refresh_token: 'r1' })
  expect(reissue.authorization()).toBeUndefined()
  expect(list.authorizations()).toEqual(['Bearer expired', 'Bearer a2'])
  expect(await readStorage(page, 'accessToken')).toBe('a2')
  expect(await readStorage(page, 'refreshToken')).toBe('r2')
})

test('S2: 동시에 401 이 나도 재발급은 한 번만 호출한다', async ({ page }) => {
  const reissue = trackReissue(page, {
    status: 200,
    body: { access_token: 'a2', refresh_token: 'r2' },
    delayMs: 250,
  })
  // 운영안내 상세는 휴관일과 영업시간을 동시에 부른다. 둘 다 첫 토큰에 401 을 준다.
  const closeDay = trackUnauthorizedOnce(page, closeDayApiPath, '[]')
  const openTime = trackUnauthorizedOnce(
    page,
    openTimeApiPath,
    JSON.stringify([
      {
        id: 1,
        openDate: '2026-07-13',
        startOpenTime: '09:00:00',
        endOpenTime: '18:00:00',
      },
    ]),
  )

  await page.goto('/notices/guide/hours/2026-07-13')

  await expect(page.getByLabel('영업 시작 시')).toHaveValue('09')
  expect(reissue.count()).toBe(1)
  expect(closeDay.authorizations()).toEqual(['Bearer expired', 'Bearer a2'])
  expect(openTime.authorizations()).toEqual(['Bearer expired', 'Bearer a2'])
})

test('S3: 재발급 401(만료된 토큰) → 세션 정리 후 로그인 이동', async ({
  page,
}) => {
  await expectSessionEndedOnReissue(page, {
    status: 401,
    body: errorBody(401, '만료된 토큰입니다.'),
  })
})

test('S4: 재발급 404(refreshToken 없음) → 세션 정리 후 로그인 이동', async ({
  page,
}) => {
  await expectSessionEndedOnReissue(page, {
    status: 404,
    body: errorBody(404, 'refreshToken이 존재하지 않습니다.'),
  })
})

test('S5: 재발급 400 → 세션 정리 후 로그인 이동', async ({ page }) => {
  await expectSessionEndedOnReissue(page, {
    status: 400,
    body: errorBody(400, '잘못된 요청입니다.'),
  })
})

test('S5b: 재발급 500 → 세션 정리 후 로그인 이동', async ({ page }) => {
  await expectSessionEndedOnReissue(page, {
    status: 500,
    body: errorBody(500, '내부 서버 오류가 발생했습니다.'),
  })
})

test.describe('refresh token 없음', () => {
  test.use({ storageState: session({ accessToken: 'expired' }) })

  test('S6: refresh token 이 없으면 재발급 없이 로그인으로 보낸다', async ({
    page,
  }) => {
    const reissue = trackReissue(page, { status: 200, body: {} })
    trackList(page, ['expired'])

    await page.goto('/notices/list')

    await expect(page).toHaveURL(/\/login$/)
    expect(reissue.count()).toBe(0)
    expect(await readStorage(page, 'accessToken')).toBeNull()
  })
})

test('S7: 재시도한 요청이 또 401 이면 재발급을 반복하지 않는다', async ({
  page,
}) => {
  const reissue = trackReissue(page, {
    status: 200,
    body: { access_token: 'a2', refresh_token: 'r2' },
  })
  const list = trackList(page, ['expired', 'a2'])

  await page.goto('/notices/list')

  await expect(page).toHaveURL(/\/login$/)
  expect(reissue.count()).toBe(1)
  expect(list.authorizations()).toEqual(['Bearer expired', 'Bearer a2'])
  expect(await readStorage(page, 'accessToken')).toBeNull()
})

test('S8: 403 은 재발급 없이 즉시 세션을 비운다', async ({ page }) => {
  const reissue = trackReissue(page, { status: 200, body: {} })
  await page.route(noticeListApiPath, async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify(errorBody(403, '접근할 수 있는 권한이 없습니다.')),
    })
  })

  await page.goto('/notices/list')

  await expect(page).toHaveURL(/\/login$/)
  expect(reissue.count()).toBe(0)
  expect(await readStorage(page, 'accessToken')).toBeNull()
  expect(await readStorage(page, 'refreshToken')).toBeNull()
})

test('S9: 로그인 API 의 401 은 재발급·로그아웃을 유발하지 않는다', async ({
  page,
}) => {
  const reissue = trackReissue(page, { status: 200, body: {} })
  await page.route(loginApiPath, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify(
        errorBody(401, '아이디 또는 비밀번호를 확인해주세요'),
      ),
    })
  })

  await page.goto('/login')
  await page.getByLabel('아이디').fill('admin')
  await page.getByRole('textbox', { name: '비밀번호', exact: true }).fill('pw')
  await page.getByRole('button', { name: '로그인' }).click()

  await expect(page.getByLabel('아이디')).toHaveValue('admin')
  await expect(page).toHaveURL(/\/login$/)
  expect(reissue.count()).toBe(0)
})

test('S11: 401·403 이 아닌 오류는 세션을 건드리지 않는다', async ({ page }) => {
  const reissue = trackReissue(page, { status: 200, body: {} })
  await page.route(noticeListApiPath, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(errorBody(500, '내부 서버 오류가 발생했습니다.')),
    })
  })

  await page.goto('/notices/list')

  await expect(
    page.getByText('공지사항을 불러오지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  expect(reissue.count()).toBe(0)
  expect(await readStorage(page, 'accessToken')).toBe('expired')
})

test.describe('세션 없음', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('S12: 토큰 없이 보호 경로에 들어오면 API 호출 없이 로그인으로 보낸다', async ({
    page,
  }) => {
    const list = trackList(page, [])

    await page.goto('/notices/list')

    await expect(page).toHaveURL(/\/login$/)
    expect(list.authorizations()).toEqual([])
  })
})

test('S13: 재발급 응답 형식이 다르면 성공으로 처리하지 않는다', async ({
  page,
}) => {
  await expectSessionEndedOnReissue(page, {
    status: 200,
    body: { access_token: 'a2' },
  })
})

async function expectSessionEndedOnReissue(
  page: Page,
  response: { status: number; body: unknown },
) {
  const reissue = trackReissue(page, response)
  const list = trackList(page, ['expired'])

  await page.goto('/notices/list')

  await expect(page).toHaveURL(/\/login$/)
  expect(reissue.count()).toBe(1)
  expect(list.authorizations()).toEqual(['Bearer expired'])
  expect(await readStorage(page, 'accessToken')).toBeNull()
  expect(await readStorage(page, 'refreshToken')).toBeNull()
}

// 재발급 요청을 세고 지정한 응답을 돌려준다.
function trackReissue(
  page: Page,
  response: { status: number; body: unknown; delayMs?: number },
) {
  let count = 0
  let body: unknown = null
  let authorization: string | undefined

  void page.route(reissueApiPath, async (route) => {
    count += 1
    body = route.request().postDataJSON()
    authorization = route.request().headers().authorization

    if (response.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, response.delayMs))
    }

    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    })
  })

  return {
    count: () => count,
    body: () => body,
    authorization: () => authorization,
  }
}

// unauthorizedTokens 에 든 access token 으로 온 목록 요청에는 401 을 준다.
function trackList(page: Page, unauthorizedTokens: string[]) {
  const authorizations: (string | undefined)[] = []

  void page.route(noticeListApiPath, async (route) => {
    const authorization = route.request().headers().authorization
    authorizations.push(authorization)

    if (unauthorizedTokens.some((token) => authorization === `Bearer ${token}`))
      return unauthorized(route)

    await fulfillNoticeList(route)
  })

  return { authorizations: () => authorizations }
}

// 첫 access token 으로 온 요청에만 401 을 주고, 그 뒤에는 성공시킨다.
function trackUnauthorizedOnce(page: Page, path: RegExp, body: string) {
  const authorizations: (string | undefined)[] = []

  void page.route(path, async (route) => {
    const authorization = route.request().headers().authorization
    authorizations.push(authorization)

    if (authorization === 'Bearer expired') return unauthorized(route)

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body,
    })
  })

  return { authorizations: () => authorizations }
}

function unauthorized(route: Route) {
  return route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify(errorBody(401, '만료된 토큰입니다.')),
  })
}

function fulfillNoticeList(route: Route) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 7, title: '재발급 대상 공지', kind: 'ALL', createAt: '2026-08-01' },
    ]),
  })
}

function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-08-10T22:30:00.000000',
    description: message,
  }
}

function readStorage(page: Page, key: string) {
  return page.evaluate((name) => window.localStorage.getItem(name), key)
}
