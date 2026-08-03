import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(reservations-permission-query-all.test-scenarios.md: S1~S2)를 mock 으로 변환한 것.
// 대상: GET /reseravtion/permission/{reservationId}. 상세 진입 시 예약 상세(/reservation/{id})도
// 함께 호출되므로 둘 다 mock 한다(예약 상세는 카드 렌더용 고정 200). 실제 서버는 호출하지 않는다.
// glob 대신 정규식을 써서 Vite 모듈 경로와 충돌하지 않게 한다.

const reservationDetail = {
  id: 7,
  reservationName: '차은우',
  leaderCount: 3,
  reservationCount: 20,
  location: '대전광역시 유성구',
  visitDate: '2026-07-12T09:41:00.123',
  exitTime: '11:00:00',
  visitSiteDate: '2026-07-01T10:00:00.000',
  visitSiteTime: '10:00:00',
  visitSiteExitTime: '11:00:00',
  visitSiteCount: 3,
  money: 200000,
}

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-02-06T19:56:53.62201',
  description: '에러 설명',
})

async function routeReservationDetail(page: Page) {
  await page.route(/\/api\/reservation\/\d+/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(reservationDetail),
    })
  })
}

async function routePermissions(page: Page, status: number, body: unknown) {
  await page.route(/\/api\/reseravtion\/permission\/\d+/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

test('S1: 권한 목록 200 → 페이지 권한 카드에 직원 이름 표시', async ({ page }) => {
  await routeReservationDetail(page)
  await routePermissions(page, 200, [{ name: '이서연' }, { name: '박민준' }])
  await page.goto('/notices/reservations/7')

  await expect(page.getByText('이서연')).toBeVisible()
  await expect(page.getByText('박민준')).toBeVisible()
})

test('S2: 권한 목록 500 → 직원 미표시(빈 배열로 숨기지 않음)', async ({ page }) => {
  await routeReservationDetail(page)
  await routePermissions(page, 500, errorBody(500, '예상하지 못한 에러가 발생했습니다.'))
  await page.goto('/notices/reservations/7')

  // 예약 상세는 200이라 카드(예약인)는 렌더되지만, 권한 직원은 표시되지 않는다.
  await expect(page.getByText('차은우')).toBeVisible()
  await expect(page.getByText('이서연')).toHaveCount(0)
})
