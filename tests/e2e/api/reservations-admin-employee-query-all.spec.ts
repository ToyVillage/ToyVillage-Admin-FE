import { expect, test, type Page } from '@playwright/test'

// 승인 시나리오(reservations-admin-employee-query-all.test-scenarios.md: S1~S4)의 mock 변환.
// 대상: GET /reservation/assigned-employee/{reservationId}. 상세(/reservation/{id})도 200으로 채워 편집 폼이 렌더되게 한다.
// 이름 검색은 서버 파라미터 없이 프론트에서 필터한다.
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
const detailPath = /\/api\/reservation\/\d+$/

async function routeDetailOk(page: Page) {
  await page.route(detailPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail),
    })
  })
}

test('S1: 배정됨/배정가능 목록 표시 + path 확인', async ({ page }) => {
  const employeeURLs: string[] = []
  await routeDetailOk(page)
  await page.route(employeePath, async (route) => {
    employeeURLs.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        assigned: [{ appAdminId: 3, name: '이승현' }],
        assignable: [{ appAdminId: 7, name: '김직원' }],
      }),
    })
  })

  await page.goto('/notices/reservations/1')

  await expect(
    page.getByRole('list', { name: '배정된 담당자' }).getByText('이승현'),
  ).toBeVisible()
  await expect(
    page.getByRole('list', { name: '배정 가능 담당자' }).getByText('김직원'),
  ).toBeVisible()

  expect(employeeURLs.length).toBeGreaterThan(0)
  expect(new URL(employeeURLs[0]).pathname).toBe(
    '/api/reservation/assigned-employee/1',
  )
})

test('S2: 권한 검색어는 프론트에서 필터(서버 name 파라미터 없음)', async ({
  page,
}) => {
  await routeDetailOk(page)
  await page.route(employeePath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        assigned: [{ appAdminId: 3, name: '이승현' }],
        assignable: [{ appAdminId: 7, name: '김직원' }],
      }),
    })
  })

  await page.goto('/notices/reservations/1')
  await expect(
    page.getByRole('list', { name: '배정된 담당자' }).getByText('이승현'),
  ).toBeVisible()
  await expect(
    page.getByRole('list', { name: '배정 가능 담당자' }).getByText('김직원'),
  ).toBeVisible()

  await page.getByLabel('배정 직원 검색').fill('이승')

  // 서버로 name 을 보내지 않고, 받아둔 목록을 프론트에서 필터한다:
  // 일치하는 담당자만 남고 불일치(김직원)는 사라진다.
  await expect(
    page.getByRole('list', { name: '배정된 담당자' }).getByText('이승현'),
  ).toBeVisible()
  await expect(page.getByText('김직원')).toHaveCount(0)
})

test('S3: 빈 목록 → 배정됨 없음 안내', async ({ page }) => {
  await routeDetailOk(page)
  await page.route(employeePath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ assigned: [], assignable: [] }),
    })
  })

  await page.goto('/notices/reservations/1')

  await expect(page.getByText('아직 배정된 담당자가 없습니다.')).toBeVisible()
  await expect(
    page.getByRole('list', { name: '배정 가능 담당자' }).getByRole('listitem'),
  ).toHaveCount(0)
})

test('S4: 직원 목록 500 → 성공 빈 목록으로 위장하지 않음(폼은 유지)', async ({
  page,
}) => {
  await routeDetailOk(page)
  await page.route(employeePath, async (route) => {
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

  await page.goto('/notices/reservations/1')

  // 상세 폼은 정상 렌더(그레이스풀 디그레이드). 데이터 계층은 오류를 throw 하며 빈 성공으로 변환하지 않는다.
  await expect(page.getByLabel('단체명', { exact: true })).toHaveValue(
    '대덕소프트웨어마이스터고',
  )
  await expect(
    page.getByRole('list', { name: '배정 가능 담당자' }).getByRole('listitem'),
  ).toHaveCount(0)
})
