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
        id: 5,
        openDate: date,
        startOpenTime: '10:00:00',
        endOpenTime: '19:00:00',
      },
    ]),
  )
})

test('S1: 저장값 있는 날짜는 조회 id로 수정 API를 한 번 호출한다', async ({
  page,
}) => {
  const requests: {
    path: string
    body: unknown
    headers: Record<string, string>
  }[] = []
  let createCount = 0
  await page.route(updatePath, async (route) => {
    const request = route.request()
    requests.push({
      path: new URL(request.url()).pathname,
      body: request.postDataJSON(),
      headers: request.headers(),
    })
    await json(route, 201, { message: '운영시간이 수정되었습니다.' })
  })
  await page.route(createPath, async (route) => {
    createCount += 1
    await route.abort()
  })

  await page.goto(hoursPath)
  await setTime(page, '영업 시작', '09', '30', '오전')
  await setTime(page, '영업 종료', '06', '00', '오후')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/notices\/guide$/)
  expect(requests).toHaveLength(1)
  expect(requests[0].path).toBe('/open-time/5')
  expect(requests[0].headers['content-type']).toContain('application/json')
  expect(requests[0].headers.authorization).toMatch(/^Bearer /)
  expect(requests[0].body).toEqual({
    openDate: date,
    startOpenTime: '09:30',
    endOpenTime: '18:00',
  })
  expect(createCount).toBe(0)
})

test('S2: 조회한 저장값을 초기값으로 표시한다', async ({ page }) => {
  await page.goto(hoursPath)

  await expect(page.getByLabel('영업 시작 시')).toHaveValue('10')
  await expect(page.getByLabel('영업 시작 분')).toHaveValue('00')
  await expect(periodButton(page, '영업 시작', '오전')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByLabel('영업 종료 시')).toHaveValue('07')
  await expect(page.getByLabel('영업 종료 분')).toHaveValue('00')
  await expect(periodButton(page, '영업 종료', '오후')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('S3: HTTP 400이면 입력을 유지하고 다시 저장할 수 있다', async ({
  page,
}) => {
  await mockUpdateError(page, 400, '요청이 유효하지 않습니다.')
  await editAndSave(page)
  await expectSaveFailure(page)
})

test('S4: HTTP 401이면 세션을 비우고 로그인으로 보낸다', async ({ page }) => {
  await mockUpdateError(page, 401, '만료된 토큰입니다.')
  await editAndSave(page)

  await expect(page).toHaveURL(/\/login$/)
  expect(
    await page.evaluate(() => localStorage.getItem('accessToken')),
  ).toBeNull()
})

test('S5: HTTP 404이면 수정 성공으로 처리하지 않는다', async ({ page }) => {
  await mockUpdateError(page, 404, '존재하지 않는 공지사항 분류 항목입니다.')
  await editAndSave(page)
  await expectSaveFailure(page)
})

test('S6: HTTP 500이면 입력을 유지한다', async ({ page }) => {
  await mockUpdateError(page, 500, '예상하지 못한 에러가 발생했습니다.')
  await editAndSave(page)
  await expectSaveFailure(page)
})

test('S7: 연속 클릭에도 수정 요청은 한 번만 전송한다', async ({ page }) => {
  let updateCount = 0
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(updatePath, async (route) => {
    updateCount += 1
    await gate
    await json(route, 201, { message: '운영시간이 수정되었습니다.' })
  })

  await page.goto(hoursPath)
  await setTime(page, '영업 시작', '09', '30', '오전')
  await page.getByRole('button', { name: '저장하기' }).evaluate((button) => {
    ;(button as HTMLButtonElement).click()
    ;(button as HTMLButtonElement).click()
  })

  await expect.poll(() => updateCount).toBe(1)
  release?.()

  await expect(page).toHaveURL(/\/notices\/guide$/)
  expect(updateCount).toBe(1)
})

test('S8: HTTP 200은 Contract 성공 status가 아니므로 거부한다', async ({
  page,
}) => {
  await page.route(updatePath, (route) =>
    json(route, 200, { message: '운영시간이 수정되었습니다.' }),
  )
  await editAndSave(page)
  await expectSaveFailure(page)
})

test('S9: 검증 실패는 수정 요청 전에 차단한다', async ({ page }) => {
  let updateCount = 0
  await page.route(updatePath, async (route) => {
    updateCount += 1
    await route.abort()
  })

  await page.goto(hoursPath)
  await setTime(page, '영업 종료', '10', '00', '오전')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByRole('status')).toHaveText(
    '영업 종료 시간은 시작 시간보다 늦어야 합니다',
  )
  expect(updateCount).toBe(0)
})

function periodButton(page: Page, label: string, name: '오전' | '오후') {
  return page
    .getByRole('group', { name: `${label} 오전 오후 선택` })
    .getByRole('button', { name })
}

async function setTime(
  page: Page,
  label: string,
  hour: string,
  minute: string,
  meridiem: '오전' | '오후',
) {
  await page.getByLabel(`${label} 시`).fill(hour)
  await page.getByLabel(`${label} 분`).fill(minute)
  await periodButton(page, label, meridiem).click()
}

async function editAndSave(page: Page) {
  await page.goto(hoursPath)
  await setTime(page, '영업 시작', '09', '30', '오전')
  await page.getByRole('button', { name: '저장하기' }).click()
}

async function expectSaveFailure(page: Page) {
  await expect(page).toHaveURL(new RegExp(`${hoursPath}$`))
  await expect(page.getByRole('status')).toHaveText(
    '저장하지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByLabel('영업 시작 시')).toHaveValue('09')
  await expect(page.getByLabel('영업 시작 분')).toHaveValue('30')
  await expect(page.getByRole('button', { name: '저장하기' })).toBeEnabled()
}

async function mockUpdateError(page: Page, status: number, message: string) {
  await page.route(updatePath, (route) =>
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
