import { test, expect, type Page } from '@playwright/test'

// 승인 시나리오(reservations-detail.approved.json: S1~S7) 변환.
// `/notices/reservations/:id` 는 읽기 전용 상세다(수정은 `/:id/edit`).
// 상세(GET /reservation/{id})와 담당자(GET /reservation/assigned-employee/{id})를 mock 한다.
// 실제 서버는 호출하지 않는다.

const detail = {
  counselDate: '2026-08-13',
  visitDate: '2026-08-20',
  visitTime: '13:01:00',
  exitTime: '15:00:00',
  reservationName: '이승현',
  reservationCount: 12,
  location: '대구광역시',
  title: '대구유치원',
  money: 48000,
  status: '사전답사 완료',
  leaderCount: 3,
  leaderPhoneNumber: '010-7753-9698',
  visitSiteCount: 8,
  visitSiteDate: '2026-08-16',
  visitSiteTime: '10:00:00',
  visitSiteExitTime: '15:00:00',
}

const employeePath = /^https:\/\/[^/]+\/reservation\/assigned-employee\/\d+(\?.*)?$/
const reservationPath = /^https:\/\/[^/]+\/reservation\/\d+$/

async function routeEmployees(
  page: Page,
  assigned: { appAdminId: number; name: string }[],
) {
  await page.route(employeePath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        assigned,
        assignable: [{ appAdminId: 7, name: '김직원' }],
      }),
    })
  })
}

async function routeDetail(page: Page, ok = true) {
  await page.route(reservationPath, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    if (!ok) {
      return route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: '예약을 찾을 수 없습니다.' }),
      })
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail),
    })
  })
}

async function gotoView(
  page: Page,
  assigned: { appAdminId: number; name: string }[] = [
    { appAdminId: 3, name: '이승현' },
  ],
) {
  await routeEmployees(page, assigned)
  await routeDetail(page)
  await page.goto('/notices/reservations/7')
  await expect(page.getByText('대구유치원')).toBeVisible()
}

test('S1: 읽기 전용 상세 표시', async ({ page }) => {
  await gotoView(page)

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  for (const title of [
    '상담일 관련',
    '방문일 관련',
    '사전답사 관련',
    '페이지 권한',
  ]) {
    await expect(page.getByRole('button', { name: new RegExp(title) })).toBeVisible()
  }
})

test('S2: 예약 값 렌더', async ({ page }) => {
  await gotoView(page)

  await expect(page.getByText('대구유치원')).toBeVisible()
  await expect(page.getByText('대구광역시')).toBeVisible()
  await expect(page.getByText('2026.08.13')).toBeVisible()
  await expect(page.getByText('010-7753-9698')).toBeVisible()
  await expect(page.getByText('48,000')).toBeVisible()
  await expect(page.getByText('2026.08.20')).toBeVisible()
  await expect(page.getByText('2026.08.16')).toBeVisible()
  await expect(page.getByText('13 : 01')).toBeVisible()
  await expect(page.getByText('10 : 00')).toBeVisible()
})

test('S3: 편집 요소가 없다', async ({ page }) => {
  await gotoView(page)

  await expect(page.getByRole('textbox')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '저장하기' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '삭제하기' })).toHaveCount(0)
})

test('S4: 섹션 접기/펼치기', async ({ page }) => {
  await gotoView(page)

  const header = page.getByRole('button', { name: /상담일 관련/ })
  await expect(header).toHaveAttribute('aria-expanded', 'true')

  await header.click()
  await expect(header).toHaveAttribute('aria-expanded', 'false')
  // 접혀도 상태 배지는 보인다.
  await expect(header).toContainText('완료')
  await expect(page.getByText('대구유치원')).toHaveCount(0)

  await header.click()
  await expect(header).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('대구유치원')).toBeVisible()
})

test('S5: 배정 담당자 목록 / 미배정 안내', async ({ page }) => {
  await gotoView(page)
  await expect(page.getByText('배정됨')).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: '이승현' })).toBeVisible()
  // 읽기 전용이라 배정 조작 버튼은 없다.
  await expect(page.getByRole('button', { name: /배정 추가/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /배정 취소/ })).toHaveCount(0)
})

test('S5: 미배정이면 안내 문구', async ({ page }) => {
  await gotoView(page, [])
  await expect(
    page.getByText('아직 배정된 담당자가 없습니다.'),
  ).toBeVisible()
})

test('S6: 뒤로가기', async ({ page }) => {
  await gotoView(page)
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})

test('S7: 존재하지 않는 예약 → 목록으로', async ({ page }) => {
  await routeEmployees(page, [])
  await routeDetail(page, false)
  await page.goto('/notices/reservations/999')
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})
