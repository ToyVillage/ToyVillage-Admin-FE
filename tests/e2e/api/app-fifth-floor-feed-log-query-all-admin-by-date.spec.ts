import { expect, test, type Page } from '@playwright/test'
import {
  fifthFloorFeedListPattern,
  mockFeedApi,
  mockFifthFloorFeedLogs,
  todayIsoDate,
} from '../support/feed-api'

// 대상: APP_FIFTH_FLOOR_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE (GET /feed-log/fifth-floor/admin) — `/feeds` 5층 탭.
// 승인 시나리오: harness/api/approvals/app-fifth-floor-feed-log-query-all-admin-by-date.test-scenarios.md
// (2026-10-29 범위 변경: 전체 활동 시나리오 S1–S6 은 app-all-activities-feed-log-query-fifth-floor 로 옮겼다.)

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-27T10:00:00'))
})

// `/feeds` 5층 탭(S7–S10). beforeEach 가 오늘을 2026-10-27 로 고정하므로 기본 5층 데이터의 오늘 기록을 그 날짜로 옮긴다.
const FEEDS_TODAY = '2026-10-27'
const feedRows = (page: Page) => page.getByTestId('feed-row')

function feedCells(page: Page, index: number) {
  return feedRows(page)
    .nth(index)
    .evaluate((row) =>
      [...row.children].map((cell) => cell.textContent?.trim() ?? ''),
    )
}

function mockFeedsFifthFloor(page: Page) {
  return mockFeedApi(page, {
    fifthFloorFeedLogs: mockFifthFloorFeedLogs.map((log) => ({
      ...log,
      feedDate: log.feedDate === todayIsoDate() ? FEEDS_TODAY : log.feedDate,
    })),
  })
}

test('S7: /feeds 5층 탭은 date · page=1 · size=10 을 1회 요청하고 4층 목록은 부르지 않는다', async ({
  page,
}) => {
  const authorizations: (string | undefined)[] = []
  const api = await mockFeedsFifthFloor(page)
  await page.route(fifthFloorFeedListPattern, async (route) => {
    authorizations.push(route.request().headers().authorization)
    await route.fallback()
  })
  await page.goto('/feeds?floor=5')
  await expect(feedRows(page)).toHaveCount(10)

  expect(api.fifthFloor.listQueries).toHaveLength(1)
  const query = api.fifthFloor.listQueries[0]
  expect(query.get('date')).toBe(FEEDS_TODAY)
  expect(query.get('page')).toBe('1')
  expect(query.get('size')).toBe('10')
  expect(query.has('animalTaxonomic')).toBe(false)
  expect(query.has('sort')).toBe(false)
  expect(authorizations).toEqual(['Bearer test-access-token'])
  expect(api.requests.list).toBe(0)
})

test('S8: /feeds 5층 탭 페이지네이션은 totalPageSize 를 따른다', async ({
  page,
}) => {
  const api = await mockFeedsFifthFloor(page)
  await page.goto('/feeds?floor=5')
  await expect(feedRows(page)).toHaveCount(10)

  await page.getByRole('button', { name: '다음 페이지' }).click()
  await expect(feedRows(page)).toHaveCount(2)
  await expect(feedRows(page).nth(0)).toContainText('오순이')
  await expect(feedRows(page).nth(1)).toContainText('자이언')
  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeDisabled()
  expect(api.fifthFloor.listQueries.at(-1)?.get('page')).toBe('2')
})

test('S9: /feeds 5층 탭 열 매핑과 단위', async ({ page }) => {
  await mockFeedsFifthFloor(page)
  await page.goto('/feeds?floor=5')
  await expect(feedRows(page)).toHaveCount(10)

  expect(await feedCells(page, 0)).toEqual([
    '아로와나',
    '아로',
    '냉동새우',
    '30 g/ml',
    '박도현',
    '',
  ])
  await page.goto('/feeds?floor=5&page=2')
  await expect(feedRows(page)).toHaveCount(2)
  expect((await feedCells(page, 1)).slice(0, 4)).toEqual([
    '자이언트구라미',
    '자이언',
    '펠렛',
    '1.2 kg/l',
  ])
})

for (const [label, response] of [
  ['500', { status: 500, body: { message: '내부 서버 오류가 발생했습니다.' } }],
  ['응답 형식 오류', { status: 200, body: {} }],
] as const) {
  test(`S10: /feeds 5층 탭 조회 실패(${label})`, async ({ page }) => {
    await mockFeedsFifthFloor(page)
    await page.route(fifthFloorFeedListPattern, (route) =>
      route.fulfill({
        status: response.status,
        contentType: 'application/json',
        body: JSON.stringify(response.body),
      }),
    )
    await page.goto('/feeds?floor=5')

    await expect(
      page.getByText('급여 내역을 불러오지 못했습니다. 다시 시도해 주세요.'),
    ).toBeVisible()
  })
}
