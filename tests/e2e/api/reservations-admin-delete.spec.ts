import { expect, test, type Page } from '@playwright/test'

// 승인 시나리오(reservations-admin-delete.test-scenarios.md)의 mock 변환.
// 대상: DELETE /reservation/{reservationId}.
// 2026-09-20 디자인 개편으로 삭제 진입점은 수정 화면이 아니라 **목록 행 케밥**이다.
// 목록(GET /reservation?)을 200으로 채워 행을 렌더하고 케밥 → 삭제 → 확인으로 검증한다.
// 실제 서버는 호출하지 않는다.

const listPath = /^https:\/\/[^/]+\/reservation\?/
const deletePath = /^https:\/\/[^/]+\/reservation\/\d+$/

const listBody = {
  beforeVisitSite: 1,
  doneVisitSite: 0,
  doneVisit: 0,
  reservationAdminQueryListObjectResponse: {
    content: [
      {
        id: 1,
        title: '대덕소프트웨어마이스터고',
        counselDate: '2026-07-02',
        reservationDate: '2026-07-13',
        reservationTime: '13:01:00',
        location: '대전광역시',
        count: 20,
        status: '사전답사 전',
      },
    ],
    totalPages: 1,
  },
}

async function routeList(page: Page) {
  await page.route(listPath, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(listBody),
    })
  })
}

// 목록에서 첫 행의 케밥 → 삭제 → 확인.
async function deleteFirstRow(page: Page) {
  await page.goto('/notices/reservations')
  await page
    .getByRole('button', { name: '대덕소프트웨어마이스터고 관리 메뉴' })
    .click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByRole('button', { name: '확인' }).click()
}

test('S1: 삭제 확인 → DELETE 호출 후 목록 갱신', async ({ page }) => {
  let deleteUrl = ''
  await routeList(page)
  await page.route(deletePath, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()
    deleteUrl = route.request().url()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: '단체예약 삭제가 완료되었습니다.' }),
    })
  })

  await deleteFirstRow(page)

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  expect(new URL(deleteUrl).pathname).toBe('/reservation/1')
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})

test('S2: 삭제 404 → 실패 토스트, 목록 유지', async ({ page }) => {
  await routeList(page)
  await page.route(deletePath, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()
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
  })

  await deleteFirstRow(page)

  await expect(page.getByRole('alert')).toHaveText(
    '존재하지 않는 단체예약 목록입니다.',
  )
  await expect(page.getByTestId('reservation-row')).toHaveCount(1)
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})
