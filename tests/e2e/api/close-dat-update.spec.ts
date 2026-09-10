import { expect, test, type Page, type Route } from '@playwright/test'

const closeScheduleApiPath = /\/api\/close-day(?:\?.*)?$/
const closeScheduleDetailApiPath = /\/api\/close-day\/[^/?]+(?:\?.*)?$/

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'close-date-update-test-token')
  })
})

test('S1: Contract body로 휴관일을 한 번 수정하고 갱신된 목록으로 이동한다', async ({
  page,
}) => {
  let listRequestCount = 0
  let updateRequestCount = 0
  let updateRequestBody: unknown
  let updateRequestHeaders: Record<string, string> = {}

  await page.route(closeScheduleApiPath, async (route) => {
    listRequestCount += 1
    await fulfillCloseScheduleList(
      route,
      listRequestCount === 1
        ? [createCloseSchedule()]
        : [
            createCloseSchedule(7, {
              title: '수정된 휴관일',
              startCloseTime: '2026-07-12',
              endCloseTime: '2026-07-13',
            }),
          ],
    )
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    const request = route.request()
    updateRequestCount += 1
    updateRequestBody = request.postDataJSON()
    updateRequestHeaders = request.headers()
    await fulfillUpdateSuccess(route)
  })

  await openUpdateTarget(page)
  await fillCloseSchedule(page, '2026-07-12', '2026-07-13', ' 수정된 휴관일 ')
  await page.getByRole('button', { name: '수정하기' }).click()

  await expect(page).toHaveURL(/\/notices\/guide$/)
  await expect(page.getByText('수정된 휴관일')).toBeVisible()
  expect(updateRequestCount).toBe(1)
  expect(updateRequestHeaders['content-type']).toContain('application/json')
  expect(updateRequestHeaders.authorization).toMatch(/^Bearer /)
  expect(updateRequestBody).toEqual({
    title: '수정된 휴관일',
    startCloseTime: '2026-07-12',
    endCloseTime: '2026-07-13',
  })
  await expect.poll(() => listRequestCount).toBeGreaterThanOrEqual(2)
})

test('S2: HTTP 400이면 입력을 유지하고 다시 제출할 수 있다', async ({
  page,
}) => {
  let updateRequestCount = 0
  await mockUpdateError(page, 400, '요청이 유효하지 않습니다.', () => {
    updateRequestCount += 1
  })

  await openUpdateTarget(page)
  await fillCloseSchedule(page, '2026-07-12', '2026-07-13', '검증 오류 휴관일')
  await page.getByRole('button', { name: '수정하기' }).click()
  await expectUpdateFailure(
    page,
    7,
    '2026-07-12',
    '2026-07-13',
    '검증 오류 휴관일',
  )

  await page.getByRole('button', { name: '수정하기' }).click()
  await expect.poll(() => updateRequestCount).toBe(2)
})

test('S3: HTTP 401이면 입력과 수정 화면을 유지한다', async ({ page }) => {
  await mockUpdateError(page, 401, '만료된 토큰입니다.')

  await openUpdateTarget(page)
  await fillCloseSchedule(page, '2026-07-12', '2026-07-13', '인증 오류 휴관일')
  await page.getByRole('button', { name: '수정하기' }).click()

  await expectUpdateFailure(
    page,
    7,
    '2026-07-12',
    '2026-07-13',
    '인증 오류 휴관일',
  )
})

test('S4: HTTP 404이면 수정 성공으로 처리하지 않는다', async ({ page }) => {
  await mockUpdateError(
    page,
    404,
    '해당 휴관일을 찾을수없습니다.',
    undefined,
    999,
  )

  await openUpdateTarget(page, 999)
  await fillCloseSchedule(page, '2026-07-12', '2026-07-13', '없는 휴관일')
  await page.getByRole('button', { name: '수정하기' }).click()

  await expectUpdateFailure(
    page,
    999,
    '2026-07-12',
    '2026-07-13',
    '없는 휴관일',
  )
})

test('S5: HTTP 500이면 입력을 유지하고 다시 제출할 수 있다', async ({
  page,
}) => {
  await mockUpdateError(page, 500, '예상하지 못한 에러가 발생했습니다.')

  await openUpdateTarget(page)
  await fillCloseSchedule(page, '2026-07-12', '2026-07-13', '서버 오류 휴관일')
  await page.getByRole('button', { name: '수정하기' }).click()

  await expectUpdateFailure(
    page,
    7,
    '2026-07-12',
    '2026-07-13',
    '서버 오류 휴관일',
  )
})

test('S6: pending 중 중복 제출을 막고 수정 상태를 표시한다', async ({
  page,
}) => {
  let updateRequestCount = 0
  let releaseResponse: (() => void) | undefined
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })

  await page.route(closeScheduleApiPath, async (route) => {
    await fulfillCloseScheduleList(route, [createCloseSchedule()])
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    updateRequestCount += 1
    await responseGate
    await fulfillUpdateSuccess(route)
  })

  await openUpdateTarget(page)
  await fillCloseSchedule(page, '2026-07-12', '2026-07-13', '중복 방지 휴관일')
  await page.getByRole('button', { name: '수정하기' }).evaluate((button) => {
    const form = button.closest('form')
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
  })

  await expect.poll(() => updateRequestCount).toBe(1)
  await expect(page.getByRole('button', { name: '수정 중' })).toBeDisabled()
  releaseResponse?.()

  await expect(page).toHaveURL(/\/notices\/guide$/)
  expect(updateRequestCount).toBe(1)
})

test('S7: HTTP 201 body가 Contract와 다르면 성공 처리하지 않는다', async ({
  page,
}) => {
  await mockUpdateResponse(page, 201, { result: 'ok' })

  await openUpdateTarget(page)
  await fillCloseSchedule(page, '2026-07-12', '2026-07-13', '응답 오류 휴관일')
  await page.getByRole('button', { name: '수정하기' }).click()

  await expectUpdateFailure(
    page,
    7,
    '2026-07-12',
    '2026-07-13',
    '응답 오류 휴관일',
  )
})

test('S8: HTTP 202는 승인된 성공 Status가 아니므로 거부한다', async ({
  page,
}) => {
  await mockUpdateResponse(page, 202, {
    message: '휴관일이 수정되었습니다.',
  })

  await openUpdateTarget(page)
  await fillCloseSchedule(page, '2026-07-12', '2026-07-13', '상태 오류 휴관일')
  await page.getByRole('button', { name: '수정하기' }).click()

  await expectUpdateFailure(
    page,
    7,
    '2026-07-12',
    '2026-07-13',
    '상태 오류 휴관일',
  )
})

test('S9: 잘못된 입력은 API 호출 전에 차단한다', async ({ page }) => {
  let updateRequestCount = 0

  await page.route(closeScheduleApiPath, async (route) => {
    await fulfillCloseScheduleList(route, [createCloseSchedule()])
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    updateRequestCount += 1
    await route.abort()
  })

  await openUpdateTarget(page)
  await page.getByLabel('시작일').fill('')
  await page.getByRole('button', { name: '수정하기' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    '휴관일을 입력해 주세요',
  )
  await page.getByRole('button', { name: '확인' }).click()

  await fillCloseSchedule(page, '2026-07-13', '2026-07-12', '날짜 순서 오류')
  await page.getByRole('button', { name: '수정하기' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    '종료일은 시작일과 같거나 이후여야 합니다',
  )
  await page.getByRole('button', { name: '확인' }).click()

  await page.getByLabel('종료일').fill('2026-07-13')
  await page.getByLabel(/제목/).fill('   ')
  await page.getByRole('button', { name: '수정하기' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    '제목을 입력해 주세요',
  )
  expect(updateRequestCount).toBe(0)
})

test('S10: 새 URL 새로고침은 실제 목록 조회 값으로 수정한다', async ({
  page,
}) => {
  let listRequestCount = 0
  let updateRequestBody: unknown

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'toyvillage:close-schedules',
      JSON.stringify([
        {
          id: '7',
          title: 'localStorage mock 휴관일',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
        },
      ]),
    )
  })
  await page.route(closeScheduleApiPath, async (route) => {
    listRequestCount += 1
    await fulfillCloseScheduleList(route, [
      createCloseSchedule(7, {
        title: 'API 상세 휴관일',
        startCloseTime: '2026-08-01',
        endCloseTime: '2026-08-02',
      }),
    ])
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    updateRequestBody = route.request().postDataJSON()
    await fulfillUpdateSuccess(route)
  })

  await page.goto('/notices/guide/7/edit')
  await expect(page.getByLabel(/제목/)).toHaveValue('API 상세 휴관일')
  await page.reload()

  await expect(page.getByLabel('시작일')).toHaveValue('2026-08-01')
  await expect(page.getByLabel('종료일')).toHaveValue('2026-08-02')
  await expect(page.getByLabel(/제목/)).toHaveValue('API 상세 휴관일')
  await page.getByRole('button', { name: '수정하기' }).click()

  await expect(page).toHaveURL(/\/notices\/guide$/)
  expect(updateRequestBody).toEqual({
    title: 'API 상세 휴관일',
    startCloseTime: '2026-08-01',
    endCloseTime: '2026-08-02',
  })
  await expect.poll(() => listRequestCount).toBeGreaterThanOrEqual(3)
})

async function openUpdateTarget(page: Page, id = 7) {
  await page.goto('/notices/guide')
  await page
    .getByRole('link', { name: '수정 전 휴관일 휴관 일정 수정' })
    .click()
  await expect(page).toHaveURL(new RegExp(`/notices/guide/${id}/edit$`))
}

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

async function expectUpdateFailure(
  page: Page,
  id: number,
  startDate: string,
  endDate: string,
  title: string,
) {
  await expect(page).toHaveURL(new RegExp(`/notices/guide/${id}/edit$`))
  await expect(page.getByLabel('시작일')).toHaveValue(startDate)
  await expect(page.getByLabel('종료일')).toHaveValue(endDate)
  await expect(page.getByLabel(/제목/)).toHaveValue(title)
  await expect(
    page.getByText('수정하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '수정하기' })).toBeEnabled()
}

async function mockUpdateError(
  page: Page,
  status: number,
  message: string,
  onUpdate?: () => void,
  id = 7,
) {
  await page.route(closeScheduleApiPath, async (route) => {
    await fulfillCloseScheduleList(route, [createCloseSchedule(id)])
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    onUpdate?.()
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

async function mockUpdateResponse(
  page: Page,
  status: number,
  body: Record<string, unknown>,
) {
  await page.route(closeScheduleApiPath, async (route) => {
    await fulfillCloseScheduleList(route, [createCloseSchedule()])
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

function createCloseSchedule(
  id = 7,
  overrides: Partial<{
    title: string
    startCloseTime: string
    endCloseTime: string
  }> = {},
) {
  return {
    id,
    title: '수정 전 휴관일',
    startCloseTime: '2026-07-10',
    endCloseTime: '2026-07-11',
    ...overrides,
  }
}

async function fulfillCloseScheduleList(
  route: Route,
  schedules: ReturnType<typeof createCloseSchedule>[],
) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(schedules),
  })
}

async function fulfillUpdateSuccess(route: Route) {
  await route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({ message: '휴관일이 수정되었습니다.' }),
  })
}
