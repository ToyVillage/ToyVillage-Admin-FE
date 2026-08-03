import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(reservations-query.test-scenarios.md: S1~S3)를 mock 으로 변환한 것.
// 대상: GET /reservation/{id}. 상세 진입 시 조회되므로 goto 전에 route 를 건다.
// 실제 서버는 호출하지 않는다.

const detail = {
  id: 7,
  // 권한 카드의 mock 직원 이름과 겹치지 않는 값(strict locator 충돌 방지).
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

async function routeDetail(page: Page, status: number, body: unknown) {
  // API 호출(/api/reservation/{id})만 가로챈다. glob 대신 정규식을 써서
  // Vite 모듈 경로(/src/entities/reservation/*.ts)와 충돌하지 않게 한다.
  await page.route(/\/api\/reservation\/\d+/, async (route) => {
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
  await expect(page.getByText('대전광역시 유성구')).toBeVisible()
  await expect(page.getByText('2026.07.12')).toBeVisible()
  await expect(page.getByText('09 : 41 ~ 11 : 00')).toBeVisible()
  await expect(page.getByText('200,000원')).toBeVisible()
})

test('S2: 404 → "예약을 찾을 수 없습니다" 표시', async ({ page }) => {
  await routeDetail(page, 404, errorBody(404, '존재하지 않는 예약입니다'))
  await page.goto('/notices/reservations/999')

  await expect(page.getByText('예약을 찾을 수 없습니다')).toBeVisible()
})

test('S3: 500 → "예약을 찾을 수 없습니다" 표시', async ({ page }) => {
  await routeDetail(page, 500, errorBody(500, '예상하지 못한 에러가 발생했습니다.'))
  await page.goto('/notices/reservations/7')

  await expect(page.getByText('예약을 찾을 수 없습니다')).toBeVisible()
})
