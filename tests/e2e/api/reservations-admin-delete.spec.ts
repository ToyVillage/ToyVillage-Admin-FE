import { expect, test, type Page } from '@playwright/test'

// 승인 시나리오(reservations-admin-delete.test-scenarios.md)의 mock 변환.
// 대상: DELETE /reservation/{reservationId}. 상세(GET)는 200으로 채워 편집 폼이 렌더되게 한다.
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

const employeePath = /\/api\/reservation\/assigned-employee\/\d+(\?.*)?$/
const detailOrDeletePath = /\/api\/reservation\/\d+$/

async function routeEmployeesEmpty(page: Page) {
  await page.route(employeePath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ assigned: [], assignable: [] }),
    })
  })
}

test('S1: 삭제 확인 → DELETE 호출 후 목록 이동', async ({ page }) => {
  let deleteUrl = ''
  await routeEmployeesEmpty(page)
  await page.route(detailOrDeletePath, async (route) => {
    const request = route.request()
    if (request.method() === 'DELETE') {
      deleteUrl = request.url()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '단체예약 삭제가 완료되었습니다.' }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail),
    })
  })

  await page.goto('/notices/reservations/1')
  await page.getByRole('button', { name: '삭제하기' }).click()
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/notices\/reservations$/)
  expect(new URL(deleteUrl).pathname).toBe('/api/reservation/1')
})

test('S2: 삭제 404 → 서버 message 알림, 이동 없음', async ({ page }) => {
  await routeEmployeesEmpty(page)
  await page.route(detailOrDeletePath, async (route) => {
    const request = route.request()
    if (request.method() === 'DELETE') {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '존재하지 않는 단체예약 목록입니다.',
          status: 404,
          timestamp: '2026-08-08T12:00:00',
          description: 'RESERVATION_NOT_FOUND',
        }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail),
    })
  })

  await page.goto('/notices/reservations/1')
  await page.getByRole('button', { name: '삭제하기' }).click()
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('alert')).toHaveText(
    '존재하지 않는 단체예약 목록입니다.',
  )
  await expect(page).toHaveURL(/\/notices\/reservations\/1$/)
})
