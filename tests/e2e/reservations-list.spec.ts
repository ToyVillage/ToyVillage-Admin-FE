import { test, expect, type Page } from '@playwright/test'

// 단체예약 현황(리스트) 화면 테스트.
// 리스트는 RESERVATION_ADMIN_QUERY_ALL(GET /reservation)로 조회하므로 page.route 로 mock 한다.
// 권한 부여/선택(체크박스) 기능은 생성/수정 페이지로 이동하여 제거되었다.
// 상태 카드는 필터 탭으로 동작한다(기본 '사전답사 전'). 데이터가 전 페이지 취합되므로
// 상태 필터/검색/정렬/페이지네이션은 클라이언트에서 처리한다.

const content = [
  { id: 1, title: '대구어린이집', counselDate: '2026-07-08', reservationDate: '2026-07-10', reservationTime: '13:01:00', location: '대구광역시', count: 18, status: '사전답사 전' },
  { id: 2, title: '행복유치원', counselDate: '2026-07-06', reservationDate: '2026-07-14', reservationTime: '10:30:00', location: '서울특별시', count: 24, status: '사전답사 전' },
  { id: 3, title: '푸른숲어린이집', counselDate: '2026-07-05', reservationDate: '2026-07-16', reservationTime: '14:00:00', location: '부산광역시', count: 15, status: '사전답사 전' },
  { id: 4, title: '햇살유치원', counselDate: '2026-07-03', reservationDate: '2026-07-12', reservationTime: '11:15:00', location: '인천광역시', count: 30, status: '사전답사 전' },
  { id: 5, title: '무지개어린이집', counselDate: '2026-07-02', reservationDate: '2026-07-22', reservationTime: '09:45:00', location: '광주광역시', count: 20, status: '사전답사 전' },
  { id: 6, title: '별빛유치원', counselDate: '2026-06-28', reservationDate: '2026-07-11', reservationTime: '13:30:00', location: '대전광역시', count: 22, status: '사전답사 완료' },
  { id: 7, title: '한빛어린이집', counselDate: '2026-06-25', reservationDate: '2026-07-08', reservationTime: '16:20:00', location: '강원도', count: 12, status: '방문 완료' },
]

const listBody = {
  beforeVisitSite: 5,
  doneVisitSite: 1,
  doneVisit: 1,
  reservationAdminQueryListObjectResponse: {
    content,
    pageable: { pageNumber: 0, pageSize: 10, offset: 0, paged: true, unpaged: false },
    totalPages: 1,
    totalElements: content.length,
    size: 10,
    number: 0,
    first: true,
    last: true,
    numberOfElements: content.length,
    empty: false,
  },
}

async function routeList(page: Page, body: unknown = listBody) {
  // 목록 호출(/api/reservation?...)만 가로챈다(상세 /api/reservation/{id} 는 제외).
  await page.route(/\/api\/reservation\?/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

test('S1: 리스트 표시', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')

  await expect(page.getByRole('heading', { name: '단체예약 현황' })).toBeVisible()
  await expect(page.getByRole('button', { name: /사전답사 전/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /사전답사 완료/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /방문 완료/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: '단체예약 생성하기' }),
  ).toBeVisible()
  await expect(page.getByText('상담일', { exact: true })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: '예약 검색' })).toBeVisible()
  await expect(page.getByTestId('reservation-row').first()).toBeVisible()
  await expect(page.getByRole('button', { name: '2 페이지' })).toBeVisible()
})

test('S2: 상태 필터 (방문 완료)', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')
  await page.getByRole('button', { name: /방문 완료/ }).click()

  await expect(page.getByText('한빛어린이집')).toBeVisible()
  await expect(page.getByText('대구어린이집')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /방문 완료/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('S3: 검색', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')
  const search = page.getByRole('searchbox', { name: '예약 검색' })

  await search.fill('행복')
  await expect(page.getByText('행복유치원')).toBeVisible()
  await expect(page.getByText('대구어린이집')).toHaveCount(0)

  await search.fill('존재하지않는단체')
  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
})

test('S4: 정렬 (상담일순 → 예약일순)', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')

  // 기본 상담일순(사전답사 전): 첫 행은 상담일이 가장 늦은 대구어린이집
  await expect(page.getByTestId('reservation-row').first()).toContainText(
    '대구어린이집',
  )

  await page.getByRole('button', { name: '예약 정렬' }).click()
  await page.getByRole('menuitemradio', { name: '예약일순' }).click()

  // 예약일순: 첫 행은 예약일이 가장 늦은 무지개어린이집
  await expect(page.getByTestId('reservation-row').first()).toContainText(
    '무지개어린이집',
  )
})

test('S5: 행 클릭 → 상세 이동', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')
  await page.getByTestId('reservation-row').first().click()
  await expect(page).toHaveURL(/\/notices\/reservations\/\d+$/)
})

test('S6: 단체예약 생성하기 → 생성 페이지 이동', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')
  await page.getByRole('button', { name: '단체예약 생성하기' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations\/create$/)
})

test('S7: 페이지네이션·리셋', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')

  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(page.getByRole('button', { name: '2 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  // 정렬 변경 시 1페이지로 리셋
  await page.getByRole('button', { name: '예약 정렬' }).click()
  await page.getByRole('menuitemradio', { name: '예약일순' }).click()
  await expect(page.getByRole('button', { name: '1 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('S8: 데이터 없음 빈 상태', async ({ page }) => {
  await routeList(page, {
    beforeVisitSite: 0,
    doneVisitSite: 0,
    doneVisit: 0,
    reservationAdminQueryListObjectResponse: {
      content: [],
      pageable: { pageNumber: 0, pageSize: 10, offset: 0, paged: true, unpaged: false },
      totalPages: 0,
      totalElements: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 0,
      empty: true,
    },
  })
  await page.goto('/notices/reservations')

  await expect(page.getByText('아직 단체예약이 없습니다')).toBeVisible()
  await expect(page.getByTestId('reservation-row')).toHaveCount(0)
})
