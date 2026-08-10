import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(reservations-permission-query-all.test-scenarios.md: S1~S2)를 mock 으로 변환한 것.
// 대상: GET /reservation/permission/{reservationId}. 상세 진입 시 예약 상세(/reservation/{id})도
// 함께 호출되므로 둘 다 mock 한다(예약 상세는 카드 렌더용 고정 200). 실제 서버는 호출하지 않는다.
// 정규식으로 Vite 모듈 경로와 충돌하지 않게 한다.

const reservationDetail = {
  counselDate: '2026-07-02',
  visitDate: '2026-07-13',
  visitTime: '13:01:00',
  exitTime: '15:00:00',
  reservationName: '차은우',
  reservationCount: 20,
  location: '대전광역시 유성구 장동',
  title: '대덕소프트웨어마이스터고',
  money: 200000,
  status: '사전답사 완료',
  leaderCount: 3,
  leaderPhoneNumber: '010-7753-9698',
}

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-08-08T12:00:00',
  description: message,
})

async function routeReservationDetail(page: Page) {
  await page.route(/\/api\/reservation\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(reservationDetail),
    })
  })
}

async function routePermissions(page: Page, status: number, body: unknown) {
  await page.route(/\/api\/reservation\/permission\/\d+$/, async (route) => {
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
  await routePermissions(page, 200, [
    { appAdminId: 11, name: '이서연' },
    { appAdminId: 12, name: '박민준' },
  ])
  await page.goto('/notices/reservations/7')

  await expect(page.getByText('이서연')).toBeVisible()
  await expect(page.getByText('박민준')).toBeVisible()
})

test('S2: 권한 목록 500 → 직원 미표시(빈 배열로 숨기지 않음)', async ({ page }) => {
  await routeReservationDetail(page)
  await routePermissions(page, 500, errorBody(500, '내부 서버 오류가 발생했습니다.'))
  await page.goto('/notices/reservations/7')

  // 예약 상세는 200이라 카드(예약인)는 렌더되지만, 권한 직원은 표시되지 않는다.
  await expect(page.getByText('차은우')).toBeVisible()
  await expect(page.getByText('이서연')).toHaveCount(0)
})
