import { expect, test, type Page } from '@playwright/test'
import { mockDashboardApi } from '../support/dashboard-api'
import { mockFeedApi } from '../support/feed-api'

// 대상: DASHBOARD_FEED_LOG_QUERY_ALL (GET /dashboard/feed-logs).
// 승인 시나리오: harness/api/approvals/dashboard-feed-log-query-all.test-scenarios.md

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-03T12:30:00'))
})

const rows = (page: Page) =>
  page
    .getByRole('region', { name: '먹이 급여 관리', exact: true })
    .getByRole('listitem')

test('S1: 진입 시 GET /dashboard/feed-logs?page=1&size=3 을 Bearer 토큰으로 1회 호출한다', async ({
  page,
}) => {
  const requests = await mockDashboardApi(page)
  await page.goto('/')
  await expect(rows(page)).toHaveCount(3)

  expect(requests.feedLogs).toHaveLength(1)
  const { url, authorization } = requests.feedLogs[0]
  expect(url.searchParams.get('page')).toBe('1')
  expect(url.searchParams.get('size')).toBe('3')
  expect(url.searchParams.has('sort')).toBe(false)
  expect(authorization).toBe('Bearer test-access-token')
})

test('S2: content 를 카드 행으로 표시한다', async ({ page }) => {
  await mockDashboardApi(page, {
    data: {
      feedLogs: [
        {
          feedLogId: 31,
          animalKind: '사자',
          animalName: '라이언',
          feedDateTime: '2026-09-03T09:30:00',
        },
        {
          feedLogId: 30,
          animalKind: '호랑이',
          animalName: '타이거',
          feedDateTime: '2026-09-02T16:10:00',
        },
      ],
    },
  })
  await page.goto('/')

  await expect(rows(page)).toHaveCount(2)
  await expect(rows(page).nth(0)).toContainText('사자 · 라이언')
  await expect(rows(page).nth(0)).toContainText('2026.09.03 09:30')
  await expect(rows(page).nth(1)).toContainText('호랑이 · 타이거')
  await expect(rows(page).nth(1)).toContainText('2026.09.02 16:10')
})

test('S3: 4건 이상 내려와도 3행만 표시한다', async ({ page }) => {
  await mockDashboardApi(page, {
    data: {
      feedLogs: Array.from({ length: 5 }, (_, index) => ({
        feedLogId: index + 1,
        animalKind: '사자',
        animalName: `개체 ${index}`,
        feedDateTime: '2026-09-03T09:30:00',
      })),
    },
  })
  await page.goto('/')

  await expect(rows(page)).toHaveCount(3)
})

test('S4: 빈 content → 빈 상태 문구', async ({ page }) => {
  await mockDashboardApi(page, { data: { feedLogs: [] } })
  await page.goto('/')

  await expect(
    page.getByText('최근 먹이 급여 기록이 없습니다.', { exact: true }),
  ).toBeVisible()
})

for (const status of [400, 500]) {
  test(`S${status === 400 ? 5 : 6}: ${status} → 대시보드 오류 상태`, async ({
    page,
  }) => {
    await mockDashboardApi(page, { status: { feedLogs: status } })
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
      content: [
        {
          feedLogId: 1,
          animalKind: '사자',
          animalName: 7,
          feedDateTime: '2026-09-03T09:30:00',
        },
      ],
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
  [
    'feedLogId 누락',
    {
      content: [
        {
          animalKind: '사자',
          animalName: '라이언',
          feedDateTime: '2026-09-03T09:30:00',
        },
      ],
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
    await mockDashboardApi(page, { rawBody: { feedLogs: body } })
    await page.goto('/')

    await expect(
      page.getByText('대시보드를 불러오지 못했습니다.'),
    ).toBeVisible()
  })
}

test('S8: 행을 누르면 급여 상세로 이동한다', async ({ page }) => {
  await mockFeedApi(page)
  await mockDashboardApi(page, {
    data: {
      feedLogs: [
        {
          feedLogId: 2,
          animalKind: '사자',
          animalName: '심바',
          feedDateTime: '2026-09-03T09:10:00',
        },
      ],
    },
  })
  await page.goto('/')

  await rows(page).getByText('사자 · 심바', { exact: true }).click()
  await expect(page).toHaveURL(/\/feeds\/2$/)
})
