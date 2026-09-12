import { expect, test, type Page, type Route } from '@playwright/test'

const loginApiPath = /^https:\/\/[^/]+\/app\/auth\/login(?:\?.*)?$/
const reissueApiPath = /^https:\/\/[^/]+\/app\/auth\/reissue(?:\?.*)?$/
const noticeApiPath = /^https:\/\/[^/]+\/notice(?:\?.*)?$/

// 로그인 화면은 세션이 없는 상태에서 시작한다.
test.use({ storageState: { cookies: [], origins: [] } })

const successBody = {
  access_token: 'a1',
  refresh_token: 'r1',
  name: '김직원',
  role: 'EMPLOYEE',
}

test('S1: 정규화한 아이디와 원본 비밀번호로 한 번 POST 한다', async ({
  page,
}) => {
  const requests: { method: string; body: string | null; auth?: string }[] = []
  await routeLogin(page, requests, { status: 200, body: successBody })

  await page.goto('/login')
  await page.getByLabel('아이디').fill('  admin  ')
  await passwordInput(page).fill('  password  ')
  await page.getByRole('button', { name: '로그인' }).click()

  await expect(page).toHaveURL(/\/$/)
  expect(requests).toHaveLength(1)
  expect(requests[0].method).toBe('POST')
  expect(JSON.parse(requests[0].body ?? '{}')).toEqual({
    username: 'admin',
    password: '  password  ',
  })
  expect(requests[0].auth).toBeUndefined()
})

test('S2: 200 응답의 토큰과 사용자 정보를 저장하고 홈으로 이동한다', async ({
  page,
}) => {
  await routeLogin(page, [], { status: 200, body: successBody })

  await submitValidLogin(page)

  await expect(page).toHaveURL(/\/$/)
  expect(await readStorage(page, 'accessToken')).toBe('a1')
  expect(await readStorage(page, 'refreshToken')).toBe('r1')
  expect(
    JSON.parse((await readStorage(page, 'toyvillage.session.user')) ?? 'null'),
  ).toEqual({ name: '김직원', role: 'EMPLOYEE' })
})

test('S3: role APP_ADMIN 응답도 동일하게 저장한다', async ({ page }) => {
  await routeLogin(page, [], {
    status: 200,
    body: { ...successBody, name: '관리자', role: 'APP_ADMIN' },
  })

  await submitValidLogin(page)

  await expect(page).toHaveURL(/\/$/)
  expect(
    JSON.parse((await readStorage(page, 'toyvillage.session.user')) ?? 'null'),
  ).toEqual({ name: '관리자', role: 'APP_ADMIN' })
})

test('S4: 저장한 access token 이 다음 API 요청의 Bearer 헤더로 붙는다', async ({
  page,
}) => {
  await routeLogin(page, [], { status: 200, body: successBody })

  let noticeAuthorization: string | undefined
  await page.route(noticeApiPath, async (route) => {
    noticeAuthorization = route.request().headers().authorization
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    })
  })

  await submitValidLogin(page)
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/notices/list')
  await expect.poll(() => noticeAuthorization).toBe('Bearer a1')
})

test('S5: HTTP 401이면 로그인 화면을 유지하고 토큰을 저장하지 않는다', async ({
  page,
}) => {
  let reissueCount = 0
  await page.route(reissueApiPath, async (route) => {
    reissueCount += 1
    await route.abort()
  })
  await routeLogin(page, [], {
    status: 401,
    body: errorBody(401, '아이디 또는 비밀번호를 확인해주세요'),
  })

  await submitValidLogin(page)

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByLabel('아이디')).toHaveValue('admin')
  await expect(passwordInput(page)).toHaveValue('')
  await expect(passwordInput(page)).toBeFocused()
  expect(await readStorage(page, 'accessToken')).toBeNull()
  expect(await readStorage(page, 'refreshToken')).toBeNull()
  expect(reissueCount).toBe(0)
})

test('S6: HTTP 400이면 로그인 화면을 유지하고 토큰을 저장하지 않는다', async ({
  page,
}) => {
  await routeLogin(page, [], {
    status: 400,
    body: errorBody(400, '잘못된 요청입니다.'),
  })

  await submitValidLogin(page)

  await expect(page).toHaveURL(/\/login$/)
  expect(await readStorage(page, 'accessToken')).toBeNull()
})

test('S7: HTTP 500이면 로그인 화면을 유지하고 토큰을 저장하지 않는다', async ({
  page,
}) => {
  await routeLogin(page, [], {
    status: 500,
    body: errorBody(500, '내부 서버 오류가 발생했습니다.'),
  })

  await submitValidLogin(page)

  await expect(page).toHaveURL(/\/login$/)
  expect(await readStorage(page, 'accessToken')).toBeNull()
})

test('S8: 응답 필드가 누락되면 성공으로 처리하지 않는다', async ({ page }) => {
  await routeLogin(page, [], { status: 200, body: { access_token: 'a1' } })

  await submitValidLogin(page)

  await expect(page).toHaveURL(/\/login$/)
  expect(await readStorage(page, 'accessToken')).toBeNull()
})

test('S9: role 이 허용값 밖이면 성공으로 처리하지 않는다', async ({ page }) => {
  await routeLogin(page, [], {
    status: 200,
    body: { ...successBody, role: 'OWNER' },
  })

  await submitValidLogin(page)

  await expect(page).toHaveURL(/\/login$/)
  expect(await readStorage(page, 'accessToken')).toBeNull()
})

test('S10: 제출 중 연속 submit 에도 요청은 한 번만 나간다', async ({
  page,
}) => {
  const requests: { method: string; body: string | null }[] = []
  await routeLogin(page, requests, {
    status: 200,
    body: successBody,
    delayMs: 700,
  })

  await page.goto('/login')
  await page.getByLabel('아이디').fill('admin')
  await passwordInput(page).fill('password')
  const submit = page.getByRole('button', { name: '로그인' })
  await submit.evaluate((button) => {
    const form = button.closest('form')
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
  })

  await expect(page.getByRole('button', { name: '로그인 중' })).toBeDisabled()
  await expect(page).toHaveURL(/\/$/)
  expect(requests).toHaveLength(1)
})

test('S11: 빈 아이디·빈 비밀번호는 요청을 보내지 않는다', async ({ page }) => {
  const requests: { method: string; body: string | null }[] = []
  await routeLogin(page, requests, { status: 200, body: successBody })

  await page.goto('/login')
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page.getByText('아이디를 입력해주세요')).toBeVisible()

  await page.getByLabel('아이디').fill('admin')
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page.getByText('비밀번호를 입력해주세요')).toBeVisible()

  expect(requests).toHaveLength(0)
})

async function submitValidLogin(page: Page) {
  await page.goto('/login')
  await page.getByLabel('아이디').fill('admin')
  await passwordInput(page).fill('password')
  await page.getByRole('button', { name: '로그인' }).click()
}

function passwordInput(page: Page) {
  return page.getByRole('textbox', { name: '비밀번호', exact: true })
}

async function readStorage(page: Page, key: string) {
  return page.evaluate((name) => window.localStorage.getItem(name), key)
}

function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-08-10T22:30:00.000000',
    description: message,
  }
}

async function routeLogin(
  page: Page,
  requests: { method: string; body: string | null; auth?: string }[],
  response: { status: number; body: unknown; delayMs?: number },
) {
  await page.route(loginApiPath, async (route: Route) => {
    const request = route.request()
    requests.push({
      method: request.method(),
      body: request.postData(),
      auth: request.headers().authorization,
    })

    if (response.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, response.delayMs))
    }

    await route.fulfill({
      status: response.status,
      contentType: 'application/json',
      body: JSON.stringify(response.body),
    })
  })
}
