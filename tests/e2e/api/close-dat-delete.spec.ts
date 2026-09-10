import { expect, test, type Page, type Route } from '@playwright/test'

const closeScheduleApiPath = /\/api\/close-day(?:\?.*)?$/
const closeScheduleDetailApiPath = /\/api\/close-day\/[^/?]+(?:\?.*)?$/

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'close-date-delete-test-token')
  })
})

test('S1: route ID로 휴관일을 한 번 삭제하고 갱신된 목록으로 이동한다', async ({
  page,
}) => {
  let listRequestCount = 0
  let deleteRequestCount = 0
  let deleteRequestBody: string | null = 'not-checked'
  let deleteRequestHeaders: Record<string, string> = {}
  let deleteRequestSearch = 'not-checked'

  await page.route(closeScheduleApiPath, async (route) => {
    listRequestCount += 1
    await fulfillCloseScheduleList(
      route,
      listRequestCount === 1 ? [createCloseSchedule()] : [],
    )
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    const request = route.request()
    deleteRequestCount += 1
    deleteRequestBody = request.postData()
    deleteRequestHeaders = request.headers()
    deleteRequestSearch = new URL(request.url()).search
    await fulfillDeleteSuccess(route)
  })

  await openDeleteTarget(page)
  await confirmDelete(page)

  await expect(page).toHaveURL(/\/notices\/guide$/)
  await expect(page.getByText('삭제 대상 휴관일')).toHaveCount(0)
  expect(deleteRequestCount).toBe(1)
  expect(deleteRequestBody).toBeNull()
  expect(deleteRequestSearch).toBe('')
  expect(deleteRequestHeaders.authorization).toMatch(/^Bearer /)
  await expect.poll(() => listRequestCount).toBeGreaterThanOrEqual(2)
})

test('S2: HTTP 400이면 현재 화면에서 다시 삭제할 수 있다', async ({ page }) => {
  let deleteRequestCount = 0
  await mockDeleteError(page, 400, '요청이 유효하지 않습니다.', () => {
    deleteRequestCount += 1
  })

  await openDeleteTarget(page)
  await confirmDelete(page)
  await expectDeleteFailure(page, 7)

  await confirmDelete(page)
  await expect.poll(() => deleteRequestCount).toBe(2)
})

test('S3: HTTP 401이면 수정 화면과 입력값을 유지한다', async ({ page }) => {
  await mockDeleteError(page, 401, '만료된 토큰입니다.')

  await openDeleteTarget(page)
  await confirmDelete(page)

  await expectDeleteFailure(page, 7)
  await expect(page.getByLabel(/제목/)).toHaveValue('삭제 대상 휴관일')
})

test('S4: HTTP 404이면 삭제 성공으로 처리하지 않는다', async ({ page }) => {
  await mockDeleteError(
    page,
    404,
    '해당 휴관일을 찾을수없습니다.',
    undefined,
    999,
  )

  await openDeleteTarget(page, 999)
  await confirmDelete(page)

  await expectDeleteFailure(page, 999)
})

test('S5: HTTP 500이면 수정 화면에서 삭제를 재시도할 수 있다', async ({
  page,
}) => {
  await mockDeleteError(page, 500, '예상하지 못한 에러가 발생했습니다.')

  await openDeleteTarget(page)
  await confirmDelete(page)

  await expectDeleteFailure(page, 7)
})

test('S6: 연속 확인에도 삭제 요청은 한 번만 전송한다', async ({ page }) => {
  let deleteRequestCount = 0
  let releaseResponse: (() => void) | undefined
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })

  await page.route(closeScheduleApiPath, async (route) => {
    await fulfillCloseScheduleList(route, [createCloseSchedule()])
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    deleteRequestCount += 1
    await responseGate
    await fulfillDeleteSuccess(route)
  })

  await openDeleteTarget(page)
  await page.getByRole('button', { name: '삭제하기' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인', exact: true })
    .evaluate((button) => {
      button.click()
      button.click()
    })

  await expect.poll(() => deleteRequestCount).toBe(1)
  releaseResponse?.()

  await expect(page).toHaveURL(/\/notices\/guide$/)
  expect(deleteRequestCount).toBe(1)
})

test('S7: HTTP 201 body가 Contract와 다르면 성공 처리하지 않는다', async ({
  page,
}) => {
  await mockDeleteResponse(page, 201, { result: 'ok' })

  await openDeleteTarget(page)
  await confirmDelete(page)

  await expectDeleteFailure(page, 7)
})

test('S8: HTTP 200은 승인된 성공 Status가 아니므로 거부한다', async ({
  page,
}) => {
  await mockDeleteResponse(page, 200, {
    message: '휴관일이 삭제되었습니다.',
  })

  await openDeleteTarget(page)
  await confirmDelete(page)

  await expectDeleteFailure(page, 7)
})

test('S9: 새 URL 새로고침은 실제 목록 조회 값을 삭제한다', async ({ page }) => {
  let listRequestCount = 0
  let deleteRequestCount = 0

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'toyvillage:close-schedules',
      JSON.stringify([
        {
          id: '7',
          title: 'localStorage mock 삭제 대상',
          startDate: '2026-01-01',
          endDate: '2026-01-02',
        },
      ]),
    )
  })
  await page.route(closeScheduleApiPath, async (route) => {
    listRequestCount += 1
    await fulfillCloseScheduleList(route, [
      {
        ...createCloseSchedule(),
        title: 'API 삭제 대상',
        startCloseTime: '2026-08-01',
        endCloseTime: '2026-08-02',
      },
    ])
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    deleteRequestCount += 1
    await fulfillDeleteSuccess(route)
  })

  await page.goto('/notices/guide/7/edit')
  await expect(page.getByLabel(/제목/)).toHaveValue('API 삭제 대상')
  await page.reload()

  await expect(page.getByLabel('시작일')).toHaveValue('2026-08-01')
  await expect(page.getByLabel('종료일')).toHaveValue('2026-08-02')
  await expect(page.getByLabel(/제목/)).toHaveValue('API 삭제 대상')
  await confirmDelete(page)

  await expect(page).toHaveURL(/\/notices\/guide$/)
  expect(deleteRequestCount).toBe(1)
  await expect.poll(() => listRequestCount).toBeGreaterThanOrEqual(3)
})

async function openDeleteTarget(page: Page, id = 7) {
  await page.goto('/notices/guide')
  await page
    .getByRole('link', { name: '삭제 대상 휴관일 휴관 일정 수정' })
    .click()
  await expect(page).toHaveURL(new RegExp(`/notices/guide/${id}/edit$`))
}

async function confirmDelete(page: Page) {
  await page.getByRole('button', { name: '삭제하기' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인', exact: true })
    .click()
}

async function expectDeleteFailure(page: Page, id: number) {
  await expect(page).toHaveURL(new RegExp(`/notices/guide/${id}/edit$`))
  await expect(
    page.getByText('삭제하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '삭제하기' })).toBeEnabled()
}

async function mockDeleteError(
  page: Page,
  status: number,
  message: string,
  onDelete?: () => void,
  id = 7,
) {
  await page.route(closeScheduleApiPath, async (route) => {
    await fulfillCloseScheduleList(route, [createCloseSchedule(id)])
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    onDelete?.()
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

async function mockDeleteResponse(
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

function createCloseSchedule(id = 7) {
  return {
    id,
    title: '삭제 대상 휴관일',
    startCloseTime: '2026-07-28',
    endCloseTime: '2026-07-28',
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

async function fulfillDeleteSuccess(route: Route) {
  await route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({ message: '휴관일이 삭제되었습니다.' }),
  })
}
