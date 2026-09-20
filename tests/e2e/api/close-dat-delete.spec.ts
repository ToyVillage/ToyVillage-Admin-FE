import { expect, test, type Page, type Route } from '@playwright/test'

const closeScheduleApiPath = /^https:\/\/[^/]+\/close-day(?:\?.*)?$/
const closeScheduleDetailApiPath =
  /^https:\/\/[^/]+\/close-day\/[^/?]+(?:\?.*)?$/
const targetTitle = '삭제 대상 휴관일'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'close-date-delete-test-token')
  })
})

test('S1: 카드 케밥에서 휴관일을 한 번 삭제하고 목록을 갱신한다', async ({
  page,
}) => {
  let listRequestCount = 0
  let deleteRequestCount = 0
  let deleteRequestBody: string | null = 'not-checked'
  let deleteRequestHeaders: Record<string, string> = {}
  let deleteRequestSearch = 'not-checked'
  let deleteRequestPath = 'not-checked'

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
    deleteRequestPath = new URL(request.url()).pathname
    await fulfillDeleteSuccess(route)
  })

  await page.goto('/notices/guide')
  await confirmDelete(page)

  await expect(page).toHaveURL(/\/notices\/guide$/)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(page.getByText(targetTitle)).toHaveCount(0)
  expect(deleteRequestCount).toBe(1)
  expect(deleteRequestPath).toBe('/close-day/7')
  expect(deleteRequestBody).toBeNull()
  expect(deleteRequestSearch).toBe('')
  expect(deleteRequestHeaders.authorization).toMatch(/^Bearer /)
  await expect.poll(() => listRequestCount).toBeGreaterThanOrEqual(2)
})

test('S2: HTTP 400이면 목록에서 다시 삭제할 수 있다', async ({ page }) => {
  let deleteRequestCount = 0
  await mockDeleteError(page, 400, '요청이 유효하지 않습니다.', () => {
    deleteRequestCount += 1
  })

  await page.goto('/notices/guide')
  await confirmDelete(page)
  await expectDeleteFailure(page)

  await confirmDelete(page)
  await expect.poll(() => deleteRequestCount).toBe(2)
})

test('S3: HTTP 401이면 세션을 비우고 로그인으로 보낸다', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem('refreshToken')
  })
  await mockDeleteError(page, 401, '만료된 토큰입니다.')

  await page.goto('/notices/guide')
  await confirmDelete(page)

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toHaveCount(0)
})

test('S4: HTTP 404이면 삭제 성공으로 처리하지 않는다', async ({ page }) => {
  await mockDeleteError(
    page,
    404,
    '해당 휴관일을 찾을수없습니다.',
    undefined,
    999,
  )

  await page.goto('/notices/guide')
  await confirmDelete(page)

  await expectDeleteFailure(page)
})

test('S5: HTTP 500이면 목록에서 삭제를 재시도할 수 있다', async ({ page }) => {
  await mockDeleteError(page, 500, '예상하지 못한 에러가 발생했습니다.')

  await page.goto('/notices/guide')
  await confirmDelete(page)

  await expectDeleteFailure(page)
})

test('S6: 연속 확인에도 삭제 요청은 한 번만 전송한다', async ({ page }) => {
  let deleteRequestCount = 0
  let releaseResponse: (() => void) | undefined
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })
  let listRequestCount = 0

  await page.route(closeScheduleApiPath, async (route) => {
    listRequestCount += 1
    await fulfillCloseScheduleList(
      route,
      listRequestCount === 1 ? [createCloseSchedule()] : [],
    )
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    deleteRequestCount += 1
    await responseGate
    await fulfillDeleteSuccess(route)
  })

  await page.goto('/notices/guide')
  await openDeleteDialog(page)
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인', exact: true })
    .evaluate((button) => {
      button.click()
      button.click()
    })

  await expect.poll(() => deleteRequestCount).toBe(1)
  releaseResponse?.()

  await expect(page.getByText(targetTitle)).toHaveCount(0)
  expect(deleteRequestCount).toBe(1)
})

test('S7: HTTP 201 body가 Contract와 달라도 삭제 성공으로 처리한다', async ({
  page,
}) => {
  await mockDeleteResponse(page, 201, { result: 'ok' })

  await page.goto('/notices/guide')
  await confirmDelete(page)

  await expectDeleteSuccess(page)
})

test('S8: HTTP 200도 삭제 성공으로 처리한다', async ({ page }) => {
  await mockDeleteResponse(page, 200, {
    message: '휴관일이 삭제되었습니다.',
  })

  await page.goto('/notices/guide')
  await confirmDelete(page)

  await expectDeleteSuccess(page)
})

test('S9: 새로고침 후 실제 목록 조회 값을 카드에서 삭제한다', async ({
  page,
}) => {
  let deleteRequestPath = ''
  let deleted = false

  await page.route(closeScheduleApiPath, async (route) => {
    await fulfillCloseScheduleList(
      route,
      deleted ? [] : [{ ...createCloseSchedule(), title: 'API 삭제 대상' }],
    )
  })
  await page.route(closeScheduleDetailApiPath, async (route) => {
    deleteRequestPath = new URL(route.request().url()).pathname
    deleted = true
    await fulfillDeleteSuccess(route)
  })

  await page.goto('/notices/guide')
  await expect(page.getByText('API 삭제 대상')).toBeVisible()
  await page.reload()

  await page.getByRole('button', { name: 'API 삭제 대상 메뉴' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인', exact: true })
    .click()

  await expect(page.getByText('API 삭제 대상')).toHaveCount(0)
  expect(deleteRequestPath).toBe('/close-day/7')
})

async function openDeleteDialog(page: Page) {
  await page.getByRole('button', { name: `${targetTitle} 메뉴` }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
}

async function confirmDelete(page: Page) {
  await openDeleteDialog(page)
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인', exact: true })
    .click()
}

async function expectDeleteSuccess(page: Page) {
  await expect(page).toHaveURL(/\/notices\/guide$/)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
}

async function expectDeleteFailure(page: Page) {
  await expect(page).toHaveURL(/\/notices\/guide$/)
  await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByText(targetTitle)).toBeVisible()
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

// 휴관일 관리는 오늘이 속한 달의 카드를 보여 주므로 이번 달 날짜로 만든다.
function thisMonthDate(day: number) {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${String(day).padStart(2, '0')}`
}

function createCloseSchedule(id = 7) {
  return {
    id,
    title: targetTitle,
    startCloseTime: thisMonthDate(10),
    endCloseTime: thisMonthDate(10),
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
