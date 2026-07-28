import { expect, test, type Page, type Route } from '@playwright/test'

const apiPath = /\/api\/close-day(?:\?.*)?$/

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'close-date-create-test-token')
  })
})

test('S1: Contract body로 휴관일을 한 번 생성하고 갱신된 목록으로 이동한다', async ({
  page,
}) => {
  let createRequestCount = 0
  let createRequestBody: unknown
  let createRequestHeaders: Record<string, string> = {}

  await page.route(apiPath, async (route) => {
    const request = route.request()

    if (request.method() === 'POST') {
      createRequestCount += 1
      createRequestBody = request.postDataJSON()
      createRequestHeaders = request.headers()
      await fulfillCreateSuccess(route)
      return
    }

    await fulfillCloseScheduleList(route, 'API 생성 휴관일')
  })

  await page.goto('/notices/guide/create')
  await fillCloseSchedule(page, '2026-07-10', '2026-07-11', ' API 생성 휴관일 ')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/notices\/guide$/)
  await expect(page.getByText('API 생성 휴관일')).toBeVisible()
  expect(createRequestCount).toBe(1)
  expect(createRequestHeaders['content-type']).toContain('application/json')
  expect(createRequestHeaders.authorization).toMatch(/^Bearer /)
  expect(createRequestBody).toEqual({
    title: 'API 생성 휴관일',
    startCloseTime: '2026-07-10',
    endCloseTime: '2026-07-11',
  })
})

test('S2: HTTP 400이면 입력을 보존하고 다시 제출할 수 있다', async ({
  page,
}) => {
  let createRequestCount = 0

  await page.route(apiPath, async (route) => {
    createRequestCount += 1
    await fulfillCreateError(route, 400, '요청이 유효하지 않습니다.')
  })

  await page.goto('/notices/guide/create')
  await fillCloseSchedule(page, '2026-07-10', '2026-07-11', '검증 오류 휴관일')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(
    page,
    '2026-07-10',
    '2026-07-11',
    '검증 오류 휴관일',
  )
  await page.getByRole('button', { name: '생성하기' }).click()
  await expect.poll(() => createRequestCount).toBe(2)
})

test('S3: HTTP 500이면 입력을 보존하고 목록으로 이동하지 않는다', async ({
  page,
}) => {
  await page.route(apiPath, async (route) => {
    await fulfillCreateError(route, 500, '예상하지 못한 에러가 발생했습니다.')
  })

  await page.goto('/notices/guide/create')
  await fillCloseSchedule(page, '2026-07-10', '2026-07-11', '서버 오류 휴관일')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(
    page,
    '2026-07-10',
    '2026-07-11',
    '서버 오류 휴관일',
  )
})

test('S4: Contract와 다른 성공 응답을 생성 성공으로 처리하지 않는다', async ({
  page,
}) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 123 }),
    })
  })

  await page.goto('/notices/guide/create')
  await fillCloseSchedule(
    page,
    '2026-07-10',
    '2026-07-11',
    '잘못된 응답 휴관일',
  )
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(
    page,
    '2026-07-10',
    '2026-07-11',
    '잘못된 응답 휴관일',
  )
})

test('S5: pending 중 중복 제출을 막고 생성 상태를 표시한다', async ({
  page,
}) => {
  let createRequestCount = 0
  let releaseResponse: (() => void) | undefined
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })

  await page.route(apiPath, async (route) => {
    if (route.request().method() === 'POST') {
      createRequestCount += 1
      await responseGate
      await fulfillCreateSuccess(route)
      return
    }

    await fulfillCloseScheduleList(route, '중복 방지 휴관일')
  })

  await page.goto('/notices/guide/create')
  await fillCloseSchedule(page, '2026-07-10', '2026-07-11', '중복 방지 휴관일')
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
  await expect(page.getByRole('button', { name: '생성 중' })).toBeDisabled()
  releaseResponse?.()

  await expect(page).toHaveURL(/\/notices\/guide$/)
  expect(createRequestCount).toBe(1)
})

test('S6: 잘못된 입력은 API 호출 전에 차단한다', async ({ page }) => {
  let createRequestCount = 0

  await page.route(apiPath, async (route) => {
    createRequestCount += 1
    await route.abort()
  })

  await page.goto('/notices/guide/create')
  await page.getByRole('button', { name: '생성하기' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    '휴관일을 입력해 주세요',
  )
  await page.getByRole('button', { name: '확인' }).click()

  await fillCloseSchedule(page, '2026-07-11', '2026-07-10', '날짜 순서 오류')
  await page.getByRole('button', { name: '생성하기' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    '종료일은 시작일과 같거나 이후여야 합니다',
  )
  await page.getByRole('button', { name: '확인' }).click()

  await page.getByLabel('종료일').fill('2026-07-11')
  await page.getByLabel(/제목/).fill('   ')
  await page.getByRole('button', { name: '생성하기' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    '제목을 입력해 주세요',
  )
  expect(createRequestCount).toBe(0)
})

async function fillCloseSchedule(
  page: Page,
  startDate: string,
  endDate: string,
  title: string,
) {
  await page.getByLabel('시작일').fill(startDate)
  await page.getByLabel('종료일').fill(endDate)
  await page.getByLabel(/제목/).fill(title)
}

async function expectCreateFailure(
  page: Page,
  startDate: string,
  endDate: string,
  title: string,
) {
  await expect(page).toHaveURL(/\/notices\/guide\/create$/)
  await expect(page.getByLabel('시작일')).toHaveValue(startDate)
  await expect(page.getByLabel('종료일')).toHaveValue(endDate)
  await expect(page.getByLabel(/제목/)).toHaveValue(title)
  await expect(
    page.getByText('생성하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '생성하기' })).toBeEnabled()
}

async function fulfillCreateSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ message: '휴관일이 생성되었습니다.' }),
  })
}

async function fulfillCreateError(
  route: Route,
  status: number,
  message: string,
) {
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
}

async function fulfillCloseScheduleList(route: Route, title: string) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      {
        id: 7,
        title,
        startCloseTime: '2026-07-10',
        endCloseTime: '2026-07-11',
      },
    ]),
  })
}
