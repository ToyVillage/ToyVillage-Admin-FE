import { expect, test, type Page, type Route } from '@playwright/test'

const byDatePath = /^https:\/\/[^/]+\/open-time\/date(?:\?.*)?$/
const createPath = /^https:\/\/[^/]+\/open-time(?:\?.*)?$/
const updatePath = /^https:\/\/[^/]+\/open-time\/\d+(?:\?.*)?$/
const date = '2026-07-13'
const hoursPath = `/notices/guide/hours/${date}`

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/[^/]+\/close-day(?:\?.*)?$/, (route) =>
    json(route, 200, []),
  )
  await page.route(byDatePath, (route) =>
    json(route, 200, [
      {
        id: null,
        openDate: date,
        startOpenTime: '07:40:00',
        endOpenTime: '19:40:00',
      },
    ]),
  )
})

test('S1: 저장값 없는 날짜는 등록 API로 한 번 저장하고 목록으로 이동한다', async ({
  page,
}) => {
  const requests: {
    method: string
    body: unknown
    headers: Record<string, string>
  }[] = []
  let updateCount = 0
  await page.route(createPath, async (route) => {
    const request = route.request()
    requests.push({
      method: request.method(),
      body: request.postDataJSON(),
      headers: request.headers(),
    })
    await json(route, 201, { message: '운영시간이 생성되었습니다.' })
  })
  await page.route(updatePath, async (route) => {
    updateCount += 1
    await route.abort()
  })

  await page.goto(hoursPath)
  await fillTimes(page)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/notices\/guide$/)
  expect(requests).toHaveLength(1)
  expect(requests[0].method).toBe('POST')
  expect(requests[0].headers['content-type']).toContain('application/json')
  expect(requests[0].headers.authorization).toMatch(/^Bearer /)
  expect(requests[0].body).toEqual({
    openDate: date,
    startOpenTime: '09:00:00',
    endOpenTime: '18:00:00',
  })
  expect(updateCount).toBe(0)
})

test('S2: HTTP 400이면 입력을 유지하고 다시 저장할 수 있다', async ({
  page,
}) => {
  await mockCreateError(page, 400, '요청이 유효하지 않습니다.')

  await page.goto(hoursPath)
  await fillTimes(page)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectSaveFailure(page)
})

test('S3: HTTP 401이면 세션을 비우고 로그인으로 보낸다', async ({ page }) => {
  await mockCreateError(page, 401, '만료된 토큰입니다.')

  await page.goto(hoursPath)
  await fillTimes(page)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/login$/)
  expect(
    await page.evaluate(() => localStorage.getItem('accessToken')),
  ).toBeNull()
})

test('S4: HTTP 500이면 입력을 유지하고 다시 저장할 수 있다', async ({
  page,
}) => {
  await mockCreateError(page, 500, '예상하지 못한 에러가 발생했습니다.')

  await page.goto(hoursPath)
  await fillTimes(page)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectSaveFailure(page)
})

test('S5: 연속 클릭에도 등록 요청은 한 번만 전송한다', async ({ page }) => {
  let createCount = 0
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(createPath, async (route) => {
    createCount += 1
    await gate
    await json(route, 201, { message: '운영시간이 생성되었습니다.' })
  })

  await page.goto(hoursPath)
  await fillTimes(page)
  await page.getByRole('button', { name: '저장하기' }).evaluate((button) => {
    ;(button as HTMLButtonElement).click()
    ;(button as HTMLButtonElement).click()
  })

  await expect(page.getByRole('button', { name: '저장 중' })).toBeDisabled()
  await expect.poll(() => createCount).toBe(1)
  release?.()

  await expect(page).toHaveURL(/\/notices\/guide$/)
  expect(createCount).toBe(1)
})

test('S6: Contract 밖 성공 응답은 성공으로 처리하지 않는다', async ({
  page,
}) => {
  let call = 0
  await page.route(createPath, async (route) => {
    call += 1
    if (call === 1) {
      await json(route, 200, { message: '운영시간이 생성되었습니다.' })
      return
    }
    await json(route, 201, { result: 'ok' })
  })

  await page.goto(hoursPath)
  await fillTimes(page)
  await page.getByRole('button', { name: '저장하기' }).click()
  await expectSaveFailure(page)

  await page.getByRole('button', { name: '저장하기' }).click()
  await expect.poll(() => call).toBe(2)
  await expectSaveFailure(page)
})

async function fillTimes(page: Page) {
  await page.getByLabel('영업 시작 시').fill('09')
  await page.getByLabel('영업 시작 분').fill('00')
  await page
    .getByRole('group', { name: '영업 시작 오전 오후 선택' })
    .getByRole('button', { name: '오전' })
    .click()
  await page.getByLabel('영업 종료 시').fill('06')
  await page.getByLabel('영업 종료 분').fill('00')
  await page
    .getByRole('group', { name: '영업 종료 오전 오후 선택' })
    .getByRole('button', { name: '오후' })
    .click()
}

async function expectSaveFailure(page: Page) {
  await expect(page).toHaveURL(new RegExp(`${hoursPath}$`))
  await expect(page.getByRole('status')).toHaveText(
    '저장하지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByLabel('영업 시작 시')).toHaveValue('09')
  await expect(page.getByLabel('영업 종료 시')).toHaveValue('06')
  await expect(page.getByRole('button', { name: '저장하기' })).toBeEnabled()
}

async function mockCreateError(page: Page, status: number, message: string) {
  await page.route(createPath, (route) =>
    json(route, status, {
      message,
      status,
      timestamp: '2026-09-17T12:00:00',
      description: '에러 설명',
    }),
  )
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
