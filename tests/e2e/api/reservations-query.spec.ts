import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(reservations-query.test-scenarios.md: S1~S3)를 mock 으로 변환한 것.
// 대상: GET /reservation/{id} (RESERVATION_ADMIN_QUERY). 상세 진입 시 조회되므로 goto 전에 route 를 건다.
// 실제 서버는 호출하지 않는다.

const detail = {
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

async function routeDetail(page: Page, status: number, body: unknown) {
  // API 상세(/api/reservation/{id})만 가로챈다. 권한 목록(/reservation/permission/..)은 대상 아님.
  await page.route(/\/api\/reservation\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

test('S1: 상세 조회 성공 → 예약정보 카드에 매핑 값 표시', async ({ page }) => {
  await routeDetail(page, 200, detail)
  await page.goto('/notices/reservations/7')

  await expect(page.getByText('차은우')).toBeVisible()
  await expect(page.getByText('대덕소프트웨어마이스터고')).toBeVisible()
  await expect(page.getByText('대전광역시 유성구 장동')).toBeVisible()
  await expect(page.getByText('2026.07.02')).toBeVisible()
  await expect(page.getByText('2026.07.13')).toBeVisible()
  await expect(page.getByText('13 : 01 ~ 15 : 00')).toBeVisible()
  await expect(page.getByText('200,000원')).toBeVisible()
  await expect(page.getByText('사전답사 완료')).toBeVisible()
  await expect(page.getByText('010-7753-9698')).toBeVisible()
})

test('S2: 404 → "예약을 찾을 수 없습니다" 표시', async ({ page }) => {
  await routeDetail(page, 404, errorBody(404, '존재하지 않는 단체예약 목록입니다.'))
  await page.goto('/notices/reservations/999')

  await expect(page.getByText('예약을 찾을 수 없습니다')).toBeVisible()
})

test('S3: 500 → "예약을 찾을 수 없습니다" 표시', async ({ page }) => {
  await routeDetail(page, 500, errorBody(500, '내부 서버 오류가 발생했습니다.'))
  await page.goto('/notices/reservations/7')

  await expect(page.getByText('예약을 찾을 수 없습니다')).toBeVisible()
})
