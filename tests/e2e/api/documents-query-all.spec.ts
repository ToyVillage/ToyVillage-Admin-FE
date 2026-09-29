import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(documents-query-all.test-scenarios.md: S1~S5)를 mock 으로 변환한 것.
// 대상: GET /documents. 서버 사이드 페이지네이션(page/size=10)과 types 필터를 검증한다.
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

const jpgDocuments = [
  { id: 3, title: '체험 공간 이미지', type: 'JPG', createdAt: '2026-06-10T09:00:00.000' },
]

const page200 = (
  items: typeof documents,
  totalPageSize: number,
) => ({ documents: items, totalPageSize })

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

test('S1: 첫 페이지를 page=1&size=10 으로 요청하고 행 표시', async ({ page }) => {
  let firstUrl = ''
  await page.route('**/documents*', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    if (!firstUrl) firstUrl = route.request().url()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(page200(documents, 1)),
    })
  })
  await page.goto('/notices/resources')

  await expect(page.getByText('근무지침요령')).toBeVisible()
  const url = new URL(firstUrl)
  expect(url.searchParams.get('page')).toBe('1')
  expect(url.searchParams.get('size')).toBe('10')
  // '전체' 탭에서는 types 를 보내지 않는다.
  expect(url.searchParams.getAll('types')).toEqual([])
})

test('S2: 빈 목록(documents: []) → 안내 문구', async ({ page }) => {
  await routeStatus(page, 200, page200([], 0))
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
      body: JSON.stringify(
        requestedPage === '1' ? page200(fullPage, 2) : page200(secondPage, 2),
      ),
    })
  })
  await page.goto('/notices/resources')

  await expect(page.getByText('자료 1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '다음 페이지' }).click()

  await expect(page.getByText('마지막 자료')).toBeVisible()
  expect(requestedPages).toContain('2')
})

test('S6: totalPageSize 만큼만 페이지 번호를 그린다', async ({ page }) => {
  await routeStatus(page, 200, page200(fullPage, 2))
  await page.goto('/notices/resources')

  await expect(page.getByRole('button', { name: '2 페이지' })).toBeVisible()
  await expect(page.getByRole('button', { name: '3 페이지' })).toHaveCount(0)
})

test('S7: 파일 유형 탭 선택 → types 필터로 재요청(page 는 1로 리셋)', async ({
  page,
}) => {
  const requestedUrls: string[] = []
  await page.route('**/documents*', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    const url = new URL(route.request().url())
    requestedUrls.push(url.toString())
    const filtered = url.searchParams.getAll('types').includes('JPG')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        filtered ? page200(jpgDocuments, 1) : page200(documents, 1),
      ),
    })
  })
  await page.goto('/notices/resources')
  await expect(page.getByText('근무지침요령')).toBeVisible()

  await page.getByRole('button', { name: 'jpg/jpeg', exact: true }).click()

  await expect(page.getByText('체험 공간 이미지')).toBeVisible()
  const filteredUrl = requestedUrls
    .map((value) => new URL(value))
    .find((url) => url.searchParams.getAll('types').includes('JPG'))
  expect(filteredUrl).toBeDefined()
  // 배열이지만 `types[]=` 가 아니라 `types=JPG` 로 보낸다.
  expect(filteredUrl?.search).toContain('types=JPG')
  expect(filteredUrl?.searchParams.get('page')).toBe('1')
})

test('S8: totalPageSize 가 줄면 범위를 벗어난 page 에서 마지막 페이지로 복귀', async ({
  page,
}) => {
  await routeStatus(page, 200, page200(documents, 1))
  await page.goto('/notices/resources?page=5')

  await expect(page.getByText('근무지침요령')).toBeVisible()
  // 첫 페이지는 기본값이라 URL 에 page 를 남기지 않는다.
  await expect(page).toHaveURL(/\/notices\/resources$/)
})
