import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(reservations-permission-delete.test-scenarios.md: S1~S2)를 mock 으로 변환한 것.
// 대상: DELETE /reservation/permission/{reservationId}/{appAdminId}. 상세 진입 시 예약 상세·권한 목록도
// 호출되므로 함께 mock 한다. 실제 서버는 호출하지 않는다.

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

test('S1: 제거 성공 → DELETE 호출 후 목록에서 사라지고 다이얼로그 닫힘', async ({
  page,
}) => {
  await routeReservationDetail(page)

  // 첫 조회는 직원 1명, 삭제 후 재조회는 빈 목록.
  let permissionCalls = 0
  await page.route(/\/api\/reservation\/permission\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    permissionCalls += 1
    const body = permissionCalls === 1 ? [{ appAdminId: 11, name: '이서연' }] : []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })

  let deleteHit = false
  await page.route(/\/api\/reservation\/permission\/\d+\/\S+/, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()
    deleteHit = true
    // 204 No Content(본문 없음).
    await route.fulfill({ status: 204 })
  })

  await page.goto('/notices/reservations/7')
  await expect(page.getByText('이서연')).toBeVisible()

  await page.getByRole('button', { name: '이서연 권한 제거' }).click()
  await expect(page.getByText('정말 삭제하시겠습니까?')).toBeVisible()
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page.getByText('정말 삭제하시겠습니까?')).toHaveCount(0)
  await expect(page.getByText('이서연')).toHaveCount(0)
  expect(deleteHit).toBe(true)
})

test('S2: DELETE 500 → 목록 유지, 확인 다이얼로그 유지', async ({ page }) => {
  await routeReservationDetail(page)

  await page.route(/\/api\/reservation\/permission\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ appAdminId: 11, name: '이서연' }]),
    })
  })

  await page.route(/\/api\/reservation\/permission\/\d+\/\S+/, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()
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

  await page.goto('/notices/reservations/7')
  await page.getByRole('button', { name: '이서연 권한 제거' }).click()
  await page.getByRole('button', { name: '확인' }).click()

  // 실패 시 임의로 제거하지 않고 다이얼로그를 유지한다.
  await expect(page.getByText('정말 삭제하시겠습니까?')).toBeVisible()
  await expect(page.getByText('이서연')).toBeVisible()
})
