import { expect, test, type Page } from '@playwright/test'
import { mockDashboardApi } from '../support/dashboard-api'

// 대상: DASHBOARD_ANIMAL_OBSERVATION_QUERY_ALL (GET /dashboard/animal-observations).
// 승인 시나리오: harness/api/approvals/dashboard-animal-observation-query-all.test-scenarios.md

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-03T12:30:00'))
})

const rows = (page: Page) =>
  page
    .getByRole('region', { name: '개체관리', exact: true })
    .getByRole('listitem')

test('S1: 진입 시 GET /dashboard/animal-observations?page=1&size=3 을 Bearer 토큰으로 1회 호출한다', async ({
  page,
}) => {
  const requests = await mockDashboardApi(page)
  await page.goto('/')
  await expect(rows(page)).toHaveCount(3)

  expect(requests.animalObservations).toHaveLength(1)
  const { url, authorization } = requests.animalObservations[0]
  expect(url.searchParams.get('page')).toBe('1')
  expect(url.searchParams.get('size')).toBe('3')
  expect(url.searchParams.has('sort')).toBe(false)
  expect(authorization).toBe('Bearer test-access-token')
})

test('S2: content 를 카드 행으로 표시한다', async ({ page }) => {
  await mockDashboardApi(page, {
    data: {
      animalObservations: [
        { title: '식욕 저하 관찰', createdAt: '2026-09-03T09:30:00' },
        { title: '건강 상태 양호', createdAt: '2026-09-01T10:05:00' },
      ],
    },
  })
  await page.goto('/')

  await expect(rows(page)).toHaveCount(2)
  await expect(rows(page).nth(0)).toContainText('식욕 저하 관찰')
  await expect(rows(page).nth(0)).toContainText('3시간 전')
  await expect(rows(page).nth(1)).toContainText('건강 상태 양호')
  await expect(rows(page).nth(1)).toContainText('2026.09.01')
})

test('S3: 4건 이상 내려와도 3행만 표시한다', async ({ page }) => {
  await mockDashboardApi(page, {
    data: {
      animalObservations: Array.from({ length: 5 }, (_, index) => ({
        title: `관찰 ${index}`,
        createdAt: '2026-09-03T09:30:00',
      })),
    },
  })
  await page.goto('/')

  await expect(rows(page)).toHaveCount(3)
})

test('S4: 빈 content → 빈 상태 문구', async ({ page }) => {
  await mockDashboardApi(page, { data: { animalObservations: [] } })
  await page.goto('/')

  await expect(
    page.getByText('최근 관찰 기록이 없습니다.', { exact: true }),
  ).toBeVisible()
})

for (const status of [400, 500]) {
  test(`S${status === 400 ? 5 : 6}: ${status} → 대시보드 오류 상태`, async ({
    page,
  }) => {
    await mockDashboardApi(page, { status: { animalObservations: status } })
    await page.goto('/')

    await expect(
      page.getByText('대시보드를 불러오지 못했습니다.'),
    ).toBeVisible()
  })
}

for (const [name, body] of [
  [
    'content 누락',
    {
      totalPages: 1,
      totalElements: 0,
      size: 3,
      number: 0,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    },
  ],
  [
    '항목 필드 타입 불일치',
    {
      content: [{ title: null, createdAt: '2026-09-03T09:30:00' }],
      totalPages: 1,
      totalElements: 1,
      size: 3,
      number: 0,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    },
  ],
] as const) {
  test(`S7: 응답 형식 오류(${name}) → 오류 상태`, async ({ page }) => {
    await mockDashboardApi(page, { rawBody: { animalObservations: body } })
    await page.goto('/')

    await expect(
      page.getByText('대시보드를 불러오지 못했습니다.'),
    ).toBeVisible()
  })
}
