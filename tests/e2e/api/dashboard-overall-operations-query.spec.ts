import { expect, test, type Page } from '@playwright/test'
import { mockDashboardApi } from '../support/dashboard-api'

// 대상: DASHBOARD_OVERALL_OPERATIONS_QUERY (GET /dashboard/overall-operations).
// 승인 시나리오: harness/api/approvals/dashboard-overall-operations-query.test-scenarios.md

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-03T12:30:00'))
})

const card = (page: Page) =>
  page.getByRole('region', { name: '전체 업무', exact: true })

test('S1: 진입 시 GET /dashboard/overall-operations 를 Bearer 토큰으로 1회 호출한다', async ({
  page,
}) => {
  const requests = await mockDashboardApi(page)
  await page.goto('/')
  await expect(card(page).getByRole('img')).toBeVisible()

  expect(requests.overallOperations).toHaveLength(1)
  expect(requests.overallOperations[0].url.search).toBe('')
  expect(requests.overallOperations[0].authorization).toBe(
    'Bearer test-access-token',
  )
})

test('S2: 상태별 건수를 도넛 범례와 합계에 표시한다', async ({ page }) => {
  await mockDashboardApi(page, {
    data: {
      overallOperations: {
        TOTAL: 18,
        IN_PROGRESS: 7,
        COMPLETED: 9,
        EXPIRED: 2,
      },
    },
  })
  await page.goto('/')

  await expect(
    card(page).getByRole('img', {
      name: '전체 업무 18건: 완료 9, 진행중 7, 지연 2',
    }),
  ).toBeVisible()
  const rows = card(page).getByRole('listitem')
  await expect(rows.nth(0)).toHaveText('완료9')
  await expect(rows.nth(1)).toHaveText('진행중7')
  await expect(rows.nth(2)).toHaveText('지연2')
})

test('S3: 모두 0이면 전체 업무 0건', async ({ page }) => {
  await mockDashboardApi(page, {
    data: {
      overallOperations: { TOTAL: 0, IN_PROGRESS: 0, COMPLETED: 0, EXPIRED: 0 },
    },
  })
  await page.goto('/')

  await expect(
    card(page).getByRole('img', { name: /^전체 업무 0건/ }),
  ).toBeVisible()
})

test('S4: 500 → 대시보드 오류 상태', async ({ page }) => {
  await mockDashboardApi(page, { status: { overallOperations: 500 } })
  await page.goto('/')

  await expect(page.getByText('대시보드를 불러오지 못했습니다.')).toBeVisible()
})

for (const [name, body] of [
  ['COMPLETED 누락', { TOTAL: 16, IN_PROGRESS: 9, EXPIRED: 6 }],
  ['음수', { TOTAL: 30, IN_PROGRESS: 9, COMPLETED: -1, EXPIRED: 6 }],
] as const) {
  test(`S5: 응답 형식 오류(${name}) → 오류 상태`, async ({ page }) => {
    await mockDashboardApi(page, { rawBody: { overallOperations: body } })
    await page.goto('/')

    await expect(
      page.getByText('대시보드를 불러오지 못했습니다.'),
    ).toBeVisible()
  })
}
