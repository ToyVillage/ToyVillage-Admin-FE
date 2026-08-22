import { test, expect, type Page } from '@playwright/test'

// 단체예약 상세 화면 테스트.
// 상세는 RESERVATION_ADMIN_QUERY(GET /reservation/{id}), 권한 목록/삭제는
// RESERVATION_PERMISSION_QUERY_ALL / _DELETE 로 조회하므로 page.route 로 mock 한다.

const detail = {
  counselDate: '2026-07-02',
  visitDate: '2026-07-13',
  visitTime: '13:01:00',
  exitTime: '15:00:00',
  reservationName: '차은우',
  reservationCount: 18,
  location: '대구광역시 수성구',
  title: '대구어린이집',
  money: 200000,
  status: '사전답사 완료',
  leaderCount: 3,
  leaderPhoneNumber: '010-7753-9698',
}

async function routeDetail(page: Page, status = 200, body: unknown = detail) {
  await page.route(/\/api\/reservation\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

async function routePermissions(page: Page, items: { appAdminId: number; name: string }[]) {
  await page.route(/\/api\/reservation\/permission\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(items),
    })
  })
}

test('S1: 상세 표시', async ({ page }) => {
  await routeDetail(page)
  await routePermissions(page, [{ appAdminId: 11, name: '이서연' }])
  await page.goto('/notices/reservations/1')

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '예약정보' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '페이지 권한' })).toBeVisible()
  await expect(page.getByText('상담일', { exact: true })).toBeVisible()
  await expect(page.getByText('예약 시간', { exact: true })).toBeVisible()
  await expect(page.getByText('예약인', { exact: true })).toBeVisible()
  await expect(page.getByText('입장료', { exact: true })).toBeVisible()
  await expect(page.getByText('인솔자 연락처', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('searchbox', { name: '검색할 직원 이름' }),
  ).toBeVisible()
})

test('S2: 예약 값 렌더', async ({ page }) => {
  await routeDetail(page)
  await routePermissions(page, [{ appAdminId: 11, name: '이서연' }])
  await page.goto('/notices/reservations/1')

  await expect(page.getByText('대구어린이집')).toBeVisible()
  await expect(page.getByText('13 : 01 ~ 15 : 00')).toBeVisible()
  await expect(page.getByText('차은우')).toBeVisible()
  await expect(page.getByText('200,000원')).toBeVisible()
  await expect(page.getByText('18명')).toBeVisible()
  await expect(page.getByText('사전답사 완료')).toBeVisible()
})

test('S3: 존재하지 않는 예약', async ({ page }) => {
  await routeDetail(page, 404, {
    message: '존재하지 않는 단체예약 목록입니다.',
    status: 404,
    timestamp: '2026-08-08T12:00:00',
    description: '존재하지 않는 단체예약 목록입니다.',
  })
  await routePermissions(page, [])
  await page.goto('/notices/reservations/9999')

  await expect(
    page.getByRole('heading', { name: '예약을 찾을 수 없습니다.' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
})

test('S4: 뒤로가기', async ({ page }) => {
  await routeDetail(page)
  await routePermissions(page, [{ appAdminId: 11, name: '이서연' }])
  await page.goto('/notices/reservations/1')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/notices\/reservations$/)
  await expect(
    page.getByRole('heading', { name: '단체예약 현황' }),
  ).toBeVisible()
})

test('S5: 권한 직원 목록 + 검색', async ({ page }) => {
  await routeDetail(page)
  await routePermissions(page, [
    { appAdminId: 11, name: '이서연' },
    { appAdminId: 12, name: '박민준' },
  ])
  await page.goto('/notices/reservations/1')

  await expect(page.getByText('이서연')).toBeVisible()
  await expect(page.getByText('박민준')).toBeVisible()

  await page.getByRole('searchbox', { name: '검색할 직원 이름' }).fill('이서연')
  await expect(page.getByText('이서연')).toBeVisible()
  await expect(page.getByText('박민준')).toHaveCount(0)
})

test('S6: 직원 권한 제거', async ({ page }) => {
  await routeDetail(page)

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
  await page.route(/\/api\/reservation\/permission\/\d+\/\S+/, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()
    await route.fulfill({ status: 204 })
  })

  await page.goto('/notices/reservations/1')

  await expect(page.getByText('이서연')).toBeVisible()
  await page.getByRole('button', { name: '이서연 권한 제거' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '확인' }).click()

  await expect(page.getByText('이서연')).toHaveCount(0)
})
