import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(documents-query-all.test-scenarios.md: S1~S5)를 mock 으로 변환한 것.
// 대상: GET /documents. 서버 사이드 페이지네이션(page/size=10)을 검증한다.
// 조회는 페이지 진입 시 발생하므로 goto 전에 route 를 건다. 실제 서버는 호출하지 않는다.

const documents = [
  { id: 1, title: '근무지침요령', type: 'PDF', createdAt: '2026-06-30T10:00:00.000' },
  { id: 2, title: '시설 안내도', type: 'PNG', createdAt: '2026-06-20T09:00:00.000' },
]

const fullPage = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  title: `자료 ${index + 1}`,
  type: 'PDF',
  createdAt: '2026-06-30T10:00:00.000',
}))

const secondPage = [
  { id: 11, title: '마지막 자료', type: 'PNG', createdAt: '2026-06-20T09:00:00.000' },
]

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-02-06T19:56:53.62201',
  description: '에러 설명',
})

async function routeStatus(page: Page, status: number, body: unknown) {
  await page.route('**/documents*', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

test('S1: 첫 페이지를 page=0&size=10 으로 요청하고 행 표시', async ({ page }) => {
  let firstUrl = ''
  await page.route('**/documents*', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    if (!firstUrl) firstUrl = route.request().url()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(documents),
    })
  })
  await page.goto('/notices/resources')

  await expect(page.getByText('근무지침요령')).toBeVisible()
  const url = new URL(firstUrl)
  expect(url.searchParams.get('page')).toBe('0')
  expect(url.searchParams.get('size')).toBe('10')
})

test('S2: 빈 목록([]) → 안내 문구', async ({ page }) => {
  await routeStatus(page, 200, [])
  await page.goto('/notices/resources')

  await expect(page.getByText('등록된 자료가 없습니다.')).toBeVisible()
})

test('S3: 500 서버 오류 → 별도 오류 화면 없이 빈 상태', async ({ page }) => {
  await routeStatus(page, 500, errorBody(500, '예상하지 못한 에러가 발생했습니다.'))
  await page.goto('/notices/resources')

  await expect(page.getByText('자료실')).toBeVisible()
  await expect(page.getByText('등록된 자료가 없습니다.')).toBeVisible()
  await expect(page.getByText('불러오지 못했습니다')).toHaveCount(0)
})

test('S4: 401 만료된 토큰 → 별도 오류 화면 없이 빈 상태', async ({ page }) => {
  await routeStatus(page, 401, errorBody(401, '만료된 토큰입니다.'))
  await page.goto('/notices/resources')

  await expect(page.getByText('등록된 자료가 없습니다.')).toBeVisible()
})

test('S5: 다음 페이지 이동 시 page 파라미터로 재요청', async ({ page }) => {
  const requestedPages: (string | null)[] = []
  await page.route('**/documents*', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    const requestedPage = new URL(route.request().url()).searchParams.get('page')
    requestedPages.push(requestedPage)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(requestedPage === '0' ? fullPage : secondPage),
    })
  })
  await page.goto('/notices/resources')

  await expect(page.getByText('자료 1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '다음 페이지' }).click()

  await expect(page.getByText('마지막 자료')).toBeVisible()
  expect(requestedPages).toContain('1')
})
