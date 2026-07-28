import { expect, test, type Page, type Route } from '@playwright/test'

const noticeApiPath = /\/api\/notice(?:\?.*)?$/

test('S1: JSON body로 공지를 한 번 생성하고 갱신된 목록으로 이동한다', async ({
  page,
}) => {
  let createRequestCount = 0
  let createRequestBody: unknown
  let createRequestHeaders: Record<string, string> = {}

  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'notice-create-test-token')
  })
  await page.route(noticeApiPath, async (route) => {
    const request = route.request()

    if (request.method() === 'POST') {
      createRequestCount += 1
      createRequestBody = request.postDataJSON()
      createRequestHeaders = request.headers()
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: '공지 생성 성공' }),
      })
      return
    }

    await fulfillNoticeList(route, 'API 생성 공지')
  })

  await page.goto('/notices/list/create')
  await fillNotice(page, 'API 생성 공지', 'API 생성 내용')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/notices\/list$/)
  await expect(page.getByTestId('notice-row')).toContainText('API 생성 공지')
  expect(createRequestCount).toBe(1)
  expect(createRequestHeaders['content-type']).toContain('application/json')
  expect(createRequestHeaders.authorization).toMatch(/^Bearer /)
  expect(createRequestBody).toEqual({
    title: 'API 생성 공지',
    kind: '공지사항 분류',
    content: 'API 생성 내용',
  })
})

test('S2: HTTP 400이면 입력을 보존하고 다시 제출할 수 있다', async ({
  page,
}) => {
  await mockCreateError(page, 400, '요청이 유효하지 않습니다.')

  await page.goto('/notices/list/create')
  await fillNotice(page, '검증 오류 공지', '검증 오류 내용')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page, '검증 오류 공지', '검증 오류 내용')
})

test('S3: HTTP 500이면 입력을 보존하고 목록으로 이동하지 않는다', async ({
  page,
}) => {
  await mockCreateError(page, 500, '예상하지 못한 에러가 발생했습니다.')

  await page.goto('/notices/list/create')
  await fillNotice(page, '서버 오류 공지', '서버 오류 내용')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page, '서버 오류 공지', '서버 오류 내용')
})

test('S4: 연속 submit에도 생성 요청은 한 번만 전송한다', async ({ page }) => {
  let createRequestCount = 0
  let releaseResponse: (() => void) | undefined
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })

  await page.route(noticeApiPath, async (route) => {
    if (route.request().method() === 'POST') {
      createRequestCount += 1
      await responseGate
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: '공지 생성 성공' }),
      })
      return
    }

    await fulfillNoticeList(route, '중복 방지 공지')
  })

  await page.goto('/notices/list/create')
  await fillNotice(page, '중복 방지 공지', '중복 방지 내용')
  await page.getByRole('button', { name: '생성하기' }).evaluate((button) => {
    const form = button.closest('form')
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
  })

  await expect.poll(() => createRequestCount).toBe(1)
  releaseResponse?.()

  await expect(page).toHaveURL(/\/notices\/list$/)
  expect(createRequestCount).toBe(1)
})

test('S5: HTTP 201 응답이 Contract와 다르면 성공 처리하지 않는다', async ({
  page,
}) => {
  await page.route(noticeApiPath, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ result: 'ok' }),
    })
  })

  await page.goto('/notices/list/create')
  await fillNotice(page, '잘못된 응답 공지', '잘못된 응답 내용')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page, '잘못된 응답 공지', '잘못된 응답 내용')
})

async function fillNotice(page: Page, title: string, content: string) {
  await page.getByLabel(/제목/).fill(title)
  await page.getByLabel(/내용/).fill(content)
}

async function expectCreateFailure(page: Page, title: string, content: string) {
  await expect(page).toHaveURL(/\/notices\/list\/create$/)
  await expect(page.getByLabel(/제목/)).toHaveValue(title)
  await expect(page.getByLabel(/내용/)).toHaveValue(content)
  await expect(
    page.getByText('생성하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '생성하기' })).toBeEnabled()
}

async function mockCreateError(page: Page, status: number, message: string) {
  await page.route(noticeApiPath, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        message,
        status,
        timestamp: '2026-07-28T12:00:00',
        description: '에러 설명',
      }),
    })
  })
}

async function fulfillNoticeList(route: Route, title: string) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      {
        id: 7,
        title,
        kind: '공지사항 분류',
        createAt: '2026-07-28',
      },
    ]),
  })
}
