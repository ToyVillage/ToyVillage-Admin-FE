import { expect, test, type Page, type Route } from '@playwright/test'

const detailApiPath = /\/api\/notice\/[^/?]+(?:\?.*)?$/
const listApiPath = /\/api\/notice(?:\?.*)?$/

test('S1: route ID로 공지를 한 번 삭제하고 목록으로 이동한다', async ({
  page,
}) => {
  let deleteRequestCount = 0
  let deleteRequestBody: string | null = 'not-checked'
  let deleteRequestHeaders: Record<string, string> = {}

  await page.route(detailApiPath, async (route) => {
    const request = route.request()

    if (request.method() === 'DELETE') {
      deleteRequestCount += 1
      deleteRequestBody = request.postData()
      deleteRequestHeaders = request.headers()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '공지 삭제가 완료되었습니다.' }),
      })
      return
    }

    await fulfillNoticeDetail(route, 7)
  })
  await page.route(listApiPath, async (route) => {
    await fulfillNoticeList(route)
  })

  await page.goto('/notices/list/7')
  await confirmDelete(page)

  await expect(page).toHaveURL(/\/notices\/list$/)
  await expect(page.getByTestId('notice-row')).toHaveCount(0)
  expect(deleteRequestCount).toBe(1)
  expect(deleteRequestBody).toBeNull()
  expect(deleteRequestHeaders.authorization).toMatch(/^Bearer /)
})

test('S2: HTTP 400이면 mock 삭제로 대체하지 않고 다시 삭제할 수 있다', async ({
  page,
}) => {
  await mockDeleteError(page, 400, '요청이 유효하지 않습니다.')

  await page.goto('/notices/list/7')
  await confirmDelete(page)

  await expectDeleteFailure(page, 7)
  expect(await getDeletedMockIds(page)).toEqual([])
})

test('S3: HTTP 401이면 상세 화면과 캐시를 유지한다', async ({ page }) => {
  await mockDeleteError(page, 401, '만료된 토큰입니다.')

  await page.goto('/notices/list/7')
  await confirmDelete(page)

  await expectDeleteFailure(page, 7)
  await expect(page.getByLabel('제목')).toHaveValue('삭제 대상 공지')
})

test('S4: HTTP 404이면 삭제 성공으로 처리하지 않는다', async ({ page }) => {
  await mockDeleteError(page, 404, '존재하지 않는 공지사항입니다.', 999)

  await page.goto('/notices/list/999')
  await confirmDelete(page)

  await expectDeleteFailure(page, 999)
  expect(await getDeletedMockIds(page)).toEqual([])
})

test('S5: HTTP 500이면 상세 화면에서 삭제를 재시도할 수 있다', async ({
  page,
}) => {
  await mockDeleteError(page, 500, '예상하지 못한 에러가 발생했습니다.')

  await page.goto('/notices/list/7')
  await confirmDelete(page)

  await expectDeleteFailure(page, 7)
})

test('S6: 연속 확인에도 삭제 요청은 한 번만 전송한다', async ({ page }) => {
  let deleteRequestCount = 0
  let releaseResponse: (() => void) | undefined
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })

  await page.route(detailApiPath, async (route) => {
    if (route.request().method() === 'DELETE') {
      deleteRequestCount += 1
      await responseGate
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '공지 삭제가 완료되었습니다.' }),
      })
      return
    }

    await fulfillNoticeDetail(route, 7)
  })
  await page.route(listApiPath, async (route) => {
    await fulfillNoticeList(route)
  })

  await page.goto('/notices/list/7')
  await page.getByRole('button', { name: '삭제하기' }).click()
  await page
    .getByRole('button', { name: '확인', exact: true })
    .evaluate((button) => {
      button.click()
      button.click()
    })

  await expect.poll(() => deleteRequestCount).toBe(1)
  releaseResponse?.()

  await expect(page).toHaveURL(/\/notices\/list$/)
  expect(deleteRequestCount).toBe(1)
})

test('S7: HTTP 200 응답이 Contract와 다르면 성공 처리하지 않는다', async ({
  page,
}) => {
  await page.route(detailApiPath, async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: 'ok' }),
      })
      return
    }

    await fulfillNoticeDetail(route, 7)
  })

  await page.goto('/notices/list/7')
  await confirmDelete(page)

  await expectDeleteFailure(page, 7)
  expect(await getDeletedMockIds(page)).toEqual([])
})

async function confirmDelete(page: Page) {
  await page.getByRole('button', { name: '삭제하기' }).click()
  await page.getByRole('button', { name: '확인', exact: true }).click()
}

async function expectDeleteFailure(page: Page, id: number) {
  await expect(page).toHaveURL(new RegExp(`/notices/list/${id}$`))
  await expect(
    page.getByText('삭제하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '삭제하기' })).toBeEnabled()
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
  await page.route(detailApiPath, async (route) => {
    if (route.request().method() === 'DELETE') {
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
      return
    }

    await fulfillNoticeDetail(route, id)
  })
}

async function fulfillNoticeDetail(route: Route, id: number) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id,
      title: '삭제 대상 공지',
      kind: '공지사항 분류',
      content: '삭제 대상 공지 내용',
      createAt: '2026-07-28',
    }),
  })
}

async function fulfillNoticeList(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]),
  })
}
