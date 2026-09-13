import { expect, test, type Page, type Route } from '@playwright/test'
import { mockTaskApi } from '../support/task-api'

// 승인된 시나리오(task-delete.test-scenarios.md)를 변환한 것.
// 목록·상세 조회도 API 연동이라 `support/task-api` mock 상세에서 진행하고,
// 삭제 응답만 각 시나리오가 덮어쓴다(나중에 등록한 route 가 먼저 매칭된다).
// 삭제는 상세 화면의 케밥 메뉴가 소유한다.

const taskDeleteApiPath = /^https:\/\/[^/]+\/tasks\/[^/?]+(?:\?.*)?$/

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'task-delete-test-token')
  })
  await mockTaskApi(page)
})

test('S1: route ID로 업무를 한 번 삭제하고 목록으로 이동해 성공 토스트를 표시한다', async ({
  page,
}) => {
  let deleteRequestCount = 0
  let deleteRequestBody: string | null = 'not-checked'
  let deleteRequestHeaders: Record<string, string> = {}
  let deleteRequestSearch = 'not-checked'
  let deleteRequestPath = ''

  await page.route(taskDeleteApiPath, async (route) => {
    const request = route.request()
    if (request.method() !== 'DELETE') return route.fallback()

    deleteRequestCount += 1
    deleteRequestBody = request.postData()
    deleteRequestHeaders = request.headers()
    deleteRequestSearch = new URL(request.url()).search
    deleteRequestPath = new URL(request.url()).pathname
    await fulfillDeleteSuccess(route)
  })

  await openDeleteTarget(page)
  await confirmDelete(page)

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByRole('status')).toContainText(
    '데이터 삭제에 성공했습니다',
  )
  expect(deleteRequestCount).toBe(1)
  expect(deleteRequestPath).toBe('/tasks/1')
  expect(deleteRequestBody).toBeNull()
  expect(deleteRequestSearch).toBe('')
  expect(deleteRequestHeaders.authorization).toMatch(/^Bearer /)
})

test('S2: HTTP 400이면 현재 화면에서 다시 삭제할 수 있다', async ({ page }) => {
  let deleteRequestCount = 0
  await mockDeleteError(page, 400, '요청이 유효하지 않습니다.', () => {
    deleteRequestCount += 1
  })

  await openDeleteTarget(page)
  await confirmDelete(page)
  await expectDeleteFailure(page, 1)

  await confirmDelete(page)
  await expect.poll(() => deleteRequestCount).toBe(2)
})

test('S3: HTTP 401이면 상세 화면과 입력값을 유지한다', async ({ page }) => {
  await mockDeleteError(page, 401, '만료된 토큰입니다.')

  await openDeleteTarget(page)
  await confirmDelete(page)

  await expectDeleteFailure(page, 1)
  await expect(page.getByRole('heading', { name: '업무 제목' })).toBeVisible()
})

test('S4: HTTP 403이면 삭제 성공으로 처리하지 않는다', async ({ page }) => {
  await mockDeleteError(page, 403, '')

  await openDeleteTarget(page)
  await confirmDelete(page)

  await expectDeleteFailure(page, 1)
})

test('S5: HTTP 404이면 삭제 성공으로 처리하지 않는다', async ({ page }) => {
  await mockDeleteError(page, 404, '존재하지 않는 업무 지시입니다.')

  await openDeleteTarget(page, 2)
  await confirmDelete(page)

  await expectDeleteFailure(page, 2)
})

test('S6: HTTP 500이면 상세 화면에서 삭제를 재시도할 수 있다', async ({
  page,
}) => {
  await mockDeleteError(page, 500, '예상하지 못한 에러가 발생했습니다.')

  await openDeleteTarget(page)
  await confirmDelete(page)

  await expectDeleteFailure(page, 1)
})

test('S7: 연속 확인에도 삭제 요청은 한 번만 전송한다', async ({ page }) => {
  let deleteRequestCount = 0
  let releaseResponse: (() => void) | undefined
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })

  await page.route(taskDeleteApiPath, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()

    deleteRequestCount += 1
    await responseGate
    await fulfillDeleteSuccess(route)
  })

  await openDeleteTarget(page)
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

  await expect(page).toHaveURL(/\/tasks$/)
  expect(deleteRequestCount).toBe(1)
})

test('S8: HTTP 200 body가 Contract와 다르면 성공 처리하지 않는다', async ({
  page,
}) => {
  await mockDeleteResponse(page, 200, { result: 'ok' })

  await openDeleteTarget(page)
  await confirmDelete(page)

  await expectDeleteFailure(page, 1)
})

test('S9: HTTP 201은 승인된 성공 Status가 아니므로 거부한다', async ({
  page,
}) => {
  await mockDeleteResponse(page, 201, {
    message: '업무지시가 삭제되었습니다.',
  })

  await openDeleteTarget(page)
  await confirmDelete(page)

  await expectDeleteFailure(page, 1)
})

async function openDeleteTarget(page: Page, id = 1) {
  await page.goto(`/tasks/${id}`)
  await expect(menuTrigger(page)).toBeVisible()
}

// 상세 케밥 메뉴에서 `삭제` 를 골라 확인 다이얼로그를 연다.
async function openDeleteDialog(page: Page) {
  await menuTrigger(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
}

async function confirmDelete(page: Page) {
  await openDeleteDialog(page)
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인', exact: true })
    .click()
}

async function expectDeleteFailure(page: Page, id: number) {
  await expect(page.getByRole('alert')).toContainText(
    '데이터 삭제에 실패했습니다',
  )
  await expect(page).toHaveURL(new RegExp(`/tasks/${id}$`))
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(menuTrigger(page)).toBeEnabled()
}

function menuTrigger(page: Page) {
  return page.getByRole('button', { name: /업무 메뉴 열기$/ })
}

async function mockDeleteError(
  page: Page,
  status: number,
  message: string,
  onDelete?: () => void,
) {
  await page.route(taskDeleteApiPath, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()

    onDelete?.()
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({
        message,
        status,
        timestamp: '2026-08-29T12:00:00',
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
  await page.route(taskDeleteApiPath, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()

    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

async function fulfillDeleteSuccess(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ message: '업무지시가 삭제되었습니다.' }),
  })
}
