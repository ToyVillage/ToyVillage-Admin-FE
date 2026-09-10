import { expect, test } from '@playwright/test'

const apiPath = /\/api\/reservation(?:\?.*)?$/

interface ItemOverrides {
  id?: number
  title?: string
  counselDate?: string
  reservationDate?: string
  reservationTime?: string
  location?: string
  count?: number
  status?: string
}

function item(overrides: ItemOverrides = {}) {
  return {
    id: 1,
    title: '토이빌리지 단체예약',
    counselDate: '2026-07-02',
    reservationDate: '2026-07-13',
    reservationTime: '13:01:00',
    location: '대전광역시 유성구 장동',
    count: 20,
    status: '사전답사 완료',
    ...overrides,
  }
}

function body({
  beforeVisitSite = 3,
  doneVisitSite = 2,
  doneVisit = 5,
  content = [item()],
  totalPages = 1,
}: {
  beforeVisitSite?: number
  doneVisitSite?: number
  doneVisit?: number
  content?: ReturnType<typeof item>[]
  totalPages?: number
} = {}) {
  return JSON.stringify({
    beforeVisitSite,
    doneVisitSite,
    doneVisit,
    reservationAdminQueryListObjectResponse: {
      content,
      pageable: {
        pageNumber: 0,
        pageSize: 10,
        offset: 0,
        paged: true,
        unpaged: false,
      },
      totalPages,
      totalElements: content.length,
      size: 10,
      number: 0,
      first: true,
      last: totalPages <= 1,
      numberOfElements: content.length,
      empty: content.length === 0,
    },
  })
}

test('S1: 초기 진입 시 status/sort/page/size로 조회하고 목록·카운트를 표시한다', async ({
  page,
}) => {
  const requestURLs: string[] = []
  await page.route(apiPath, async (route) => {
    requestURLs.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: body(),
    })
  })

  await page.goto('/notices/reservations')

  await expect(page.getByTestId('reservation-row')).toHaveCount(1)
  const row = page.getByTestId('reservation-row')
  await expect(row).toContainText('토이빌리지 단체예약')
  await expect(row).toContainText('대전광역시 유성구 장동')
  await expect(row).toContainText('2026.07.02')
  await expect(row).toContainText('2026.07.13')
  await expect(row).toContainText('13 : 01')
  await expect(row).toContainText('20명')

  // 상태 카운트는 전체 기준값(before/done/doneVisit).
  await expect(page.getByText('3', { exact: true })).toBeVisible()

  const first = new URL(requestURLs[0])
  expect(first.searchParams.get('status')).toBe('BEFORE_SITE_VISIT')
  expect(first.searchParams.get('sort')).toBe('COUNSEL_DATE')
  expect(first.searchParams.get('page')).toBe('0')
  expect(first.searchParams.get('size')).toBe('10')
})

test('S2: 상태 카드 선택이 status 파라미터로 반영된다', async ({ page }) => {
  const requestURLs: string[] = []
  await page.route(apiPath, async (route) => {
    requestURLs.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: body(),
    })
  })

  await page.goto('/notices/reservations')
  await expect(page.getByTestId('reservation-row')).toHaveCount(1)

  await page.getByRole('button', { name: '사전답사 완료' }).click()

  await expect
    .poll(() =>
      requestURLs.some(
        (url) =>
          new URL(url).searchParams.get('status') === 'SITE_VISIT_COMPLETED',
      ),
    )
    .toBe(true)
})

test('S3: 검색어가 title 파라미터로 전달된다', async ({ page }) => {
  const requestURLs: string[] = []
  await page.route(apiPath, async (route) => {
    requestURLs.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: body(),
    })
  })

  await page.goto('/notices/reservations')
  await expect(page.getByTestId('reservation-row')).toHaveCount(1)

  await page.getByLabel('예약 검색').fill('대구')

  await expect
    .poll(() =>
      requestURLs.some(
        (url) => new URL(url).searchParams.get('title') === '대구',
      ),
    )
    .toBe(true)
})

test('S4: 정렬 선택이 sort 파라미터로 반영된다', async ({ page }) => {
  const requestURLs: string[] = []
  await page.route(apiPath, async (route) => {
    requestURLs.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: body(),
    })
  })

  await page.goto('/notices/reservations')
  await expect(page.getByTestId('reservation-row')).toHaveCount(1)

  await page.getByLabel('예약 정렬').click()
  await page.getByRole('menuitemradio', { name: '예약일순' }).click()

  await expect
    .poll(() =>
      requestURLs.some(
        (url) => new URL(url).searchParams.get('sort') === 'RESERVATION_DATE',
      ),
    )
    .toBe(true)
})

test('S6: 빈 목록이면 빈 상태 문구를 표시한다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: body({
        beforeVisitSite: 0,
        doneVisitSite: 0,
        doneVisit: 0,
        content: [],
        totalPages: 0,
      }),
    })
  })

  await page.goto('/notices/reservations')

  await expect(page.getByTestId('reservation-row')).toHaveCount(0)
  await expect(page.getByText('아직 단체예약이 없습니다')).toBeVisible()
})

test('S7: 서버 오류를 빈 목록으로 숨기지 않는다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '내부 서버 오류가 발생했습니다.',
        status: 500,
        timestamp: '2026-08-08T12:00:00',
        description: '내부 서버 오류가 발생했습니다.',
      }),
    })
  })

  await page.goto('/notices/reservations')

  await expect(page.getByRole('alert')).toHaveText(
    '단체예약을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
})

test('S8: 예약 행을 클릭하면 상세 경로로 이동한다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: body({ content: [item({ id: 1 })] }),
    })
  })

  await page.goto('/notices/reservations')
  await page.getByTestId('reservation-row').click()

  await expect(page).toHaveURL(/\/notices\/reservations\/1$/)
})
