import { expect, test, type Page, type Route } from '@playwright/test'

const detailApiPath = /^https:\/\/[^/]+\/notice\/[^/?]+(?:\?.*)?$/
const listApiPath = /^https:\/\/[^/]+\/notice(?:\?.*)?$/
const targetTitle = '삭제 대상 공지'

test('S1: 목록 케밥에서 공지를 한 번 삭제하고 목록을 갱신한다', async ({
  page,
}) => {
  let deleted = false
  let deleteRequestCount = 0
  let deleteRequestPath = ''
  let deleteRequestBody: string | null = 'not-checked'
  let deleteRequestHeaders: Record<string, string> = {}

  await page.route(listApiPath, async (route) => {
    await fulfillNoticeList(route, deleted ? [] : [7])
  })
  await page.route(detailApiPath, async (route) => {
    const request = route.request()
    deleteRequestCount += 1
    deleteRequestPath = new URL(request.url()).pathname
    deleteRequestBody = request.postData()
    deleteRequestHeaders = request.headers()
    deleted = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: '공지 삭제가 완료되었습니다.' }),
    })
  })

  await page.goto('/notices/list')
  await confirmDelete(page)

  await expect(page).toHaveURL(/\/notices\/list$/)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(page.getByTestId('notice-row')).toHaveCount(0)
  expect(deleteRequestCount).toBe(1)
  expect(deleteRequestPath).toBe('/notice/7')
  expect(deleteRequestBody).toBeNull()
  expect(deleteRequestHeaders.authorization).toMatch(/^Bearer /)
})

test('S2: HTTP 400이면 mock 삭제로 대체하지 않고 다시 삭제할 수 있다', async ({
  page,
}) => {
  await mockDeleteError(page, 400, '요청이 유효하지 않습니다.')

  await page.goto('/notices/list')
  await confirmDelete(page)

  await expectDeleteFailure(page)
  expect(await getDeletedMockIds(page)).toEqual([])
  await expect(
    page.getByRole('button', { name: `${targetTitle} 관리 메뉴` }),
  ).toBeEnabled()
})

test('S3: HTTP 401이면 세션을 비우고 로그인으로 보낸다', async ({ page }) => {
  await mockDeleteError(page, 401, '만료된 토큰입니다.')

  await page.goto('/notices/list')
  await confirmDelete(page)

  await expect(page).toHaveURL(/\/login$/)
  expect(await getDeletedMockIds(page)).toEqual([])
  expect(
    await page.evaluate(() => localStorage.getItem('accessToken')),
  ).toBeNull()
})

test('S4: HTTP 404이면 삭제 성공으로 처리하지 않는다', async ({ page }) => {
  await mockDeleteError(page, 404, '존재하지 않는 공지사항입니다.', 999)

  await page.goto('/notices/list')
  await confirmDelete(page)

  await expectDeleteFailure(page)
  expect(await getDeletedMockIds(page)).toEqual([])
})

test('S5: HTTP 500이면 목록에서 삭제를 재시도할 수 있다', async ({ page }) => {
  await mockDeleteError(page, 500, '예상하지 못한 에러가 발생했습니다.')

  await page.goto('/notices/list')
  await confirmDelete(page)

  await expectDeleteFailure(page)
})

test('S6: 연속 확인에도 삭제 요청은 한 번만 전송한다', async ({ page }) => {
  let deleted = false
  let deleteRequestCount = 0
  let releaseResponse: (() => void) | undefined
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })

  await page.route(listApiPath, async (route) => {
    await fulfillNoticeList(route, deleted ? [] : [7])
  })
  await page.route(detailApiPath, async (route) => {
    deleteRequestCount += 1
    await responseGate
    deleted = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: '공지 삭제가 완료되었습니다.' }),
    })
  })

  await page.goto('/notices/list')
  await openDeleteDialog(page)
  await page
    .getByRole('button', { name: '확인', exact: true })
    .evaluate((button) => {
      button.click()
      button.click()
    })

  await expect.poll(() => deleteRequestCount).toBe(1)
  releaseResponse?.()

  await expect(page.getByTestId('notice-row')).toHaveCount(0)
  expect(deleteRequestCount).toBe(1)
})

test('S7: HTTP 200 응답이 Contract와 다르면 성공 처리하지 않는다', async ({
  page,
}) => {
  await page.route(listApiPath, async (route) => {
    await fulfillNoticeList(route, [7])
  })
  await page.route(detailApiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: 'ok' }),
    })
  })

  await page.goto('/notices/list')
  await confirmDelete(page)

  await expectDeleteFailure(page)
  expect(await getDeletedMockIds(page)).toEqual([])
})

async function openDeleteDialog(page: Page) {
  await page.getByRole('button', { name: `${targetTitle} 관리 메뉴` }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
}

async function confirmDelete(page: Page) {
  await openDeleteDialog(page)
  await page.getByRole('button', { name: '확인', exact: true }).click()
}

async function expectDeleteFailure(page: Page) {
  await expect(page).toHaveURL(/\/notices\/list$/)
  await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByTestId('notice-row')).toContainText(targetTitle)
}

async function getDeletedMockIds(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('toyvillage:notices:deleted')
    return raw ? (JSON.parse(raw) as unknown[]) : []
  })
}

async function mockDeleteError(
  page: Page,
  status: number,
  message: string,
  id = 7,
) {
  await page.route(listApiPath, async (route) => {
    await fulfillNoticeList(route, [id])
  })
  await page.route(detailApiPath, async (route) => {
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

async function fulfillNoticeList(route: Route, ids: number[]) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      notices: ids.map((id) => ({
        id,
        title: targetTitle,
        kind: '공지사항 분류',
        createdAt: '2026-07-28',
      })),
      totalPageSize: ids.length > 0 ? 1 : 0,
    }),
  })
}
