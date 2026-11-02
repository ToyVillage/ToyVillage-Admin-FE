import { expect, test, type Page } from '@playwright/test'
import {
  feedListPattern,
  mockFeedApi,
  mockFeedLog,
  todayIsoDate,
} from '../support/feed-api'

// 대상: APP_FEED_LOG_QUERY_ALL_ADMIN_BY_DATE (GET /feed-log/admin) — `/feeds` 4층 탭.
// 승인 시나리오: harness/api/approvals/app-feed-log-query-all-admin-by-date.test-scenarios.md
// (2026-10-29 범위 변경: 전체 활동 시나리오는 app-all-activities-feed-log-query-fourth-floor 로 옮겼다.)

const ERROR_TEXT = '급여 내역을 불러오지 못했습니다. 다시 시도해 주세요.'

const rows = (page: Page) => page.getByTestId('feed-row')

function cells(page: Page, index: number) {
  return rows(page)
    .nth(index)
    .evaluate((row) =>
      [...row.children].map((cell) => cell.textContent?.trim() ?? ''),
    )
}

test('S1: date · page=1 · size=10 을 Bearer 토큰으로 1회 요청한다', async ({
  page,
}) => {
  const authorizations: (string | undefined)[] = []
  const api = await mockFeedApi(page)
  await page.route(feedListPattern, async (route) => {
    authorizations.push(route.request().headers().authorization)
    await route.fallback()
  })
  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(10)

  expect(api.listQueries).toHaveLength(1)
  const query = api.listQueries[0]
  expect(query.get('date')).toBe(todayIsoDate())
  expect(query.get('page')).toBe('1')
  expect(query.get('size')).toBe('10')
  expect(query.has('animalTaxonomic')).toBe(false)
  expect(query.has('sort')).toBe(false)
  expect(authorizations).toEqual(['Bearer test-access-token'])
})

test('S2: 응답 필드를 열에 매핑하고 단위를 붙인다', async ({ page }) => {
  const today = todayIsoDate()
  await mockFeedApi(page, {
    feedLogs: [
      mockFeedLog({
        feedLogId: 1,
        animalKind: '이구아나',
        animalName: '초록',
        feedType: '청경채',
        feedAmount: 150,
        remainingAmount: 20,
        significant: '',
        feedUnit: 'GML',
        feedDateTime: `${today}T08:40:00`,
      }),
      mockFeedLog({
        feedLogId: 2,
        animalKind: '물범',
        animalName: '바다',
        feedType: '고등어',
        feedAmount: 1.2,
        remainingAmount: null,
        significant: '콧잔등 상처',
        feedUnit: 'KGL',
        name: '김유영',
        feedDateTime: `${today}T16:22:00`,
      }),
    ],
  })
  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(2)

  expect((await cells(page, 0)).slice(0, 8)).toEqual([
    '이구아나',
    '초록',
    '08:40',
    '청경채',
    '150 g/ml',
    '20 g/ml',
    '-',
    '이승현',
  ])
  expect((await cells(page, 1)).slice(0, 8)).toEqual([
    '물범',
    '바다',
    '16:22',
    '고등어',
    '1.2 kg/l',
    '-',
    '콧잔등 상처',
    '김유영',
  ])
})

test('S3: 단위·특이사항 필드가 없으면 kg/l 과 - 로 보여준다', async ({
  page,
}) => {
  await mockFeedApi(page)
  await page.route(feedListPattern, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        feedLogs: [
          {
            feedLogId: 1,
            staffName: '김수인',
            animalKind: '표범',
            animalName: '레오',
            animalDeleted: false,
            feedType: '생닭',
            feedAmount: 1.2,
            remainingAmount: 0,
            feedDateTime: `${todayIsoDate()}T09:30:00`,
          },
        ],
        totalPageSize: 1,
      }),
    }),
  )
  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(1)

  const values = await cells(page, 0)
  expect(values[4]).toBe('1.2 kg/l')
  expect(values[6]).toBe('-')
})

test('S4: 총 페이지 수는 totalPageSize 를 따른다', async ({ page }) => {
  const api = await mockFeedApi(page)
  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(10)

  await page.getByRole('button', { name: '다음 페이지' }).click()
  await expect(rows(page)).toHaveCount(2)
  expect(api.listQueries.at(-1)?.get('page')).toBe('2')
  await expect(page.getByRole('button', { name: '3 페이지' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeDisabled()
})

test('S5: 기록이 없는 날은 빈 상태를 보여준다', async ({ page }) => {
  await mockFeedApi(page, { feedLogs: [] })
  await page.goto('/feeds')

  await expect(
    page.getByText('해당 날짜에 급여 내역이 없습니다.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '다음 페이지' })).toHaveCount(0)
})

for (const [label, response] of [
  ['500', { status: 500, body: { message: '내부 서버 오류가 발생했습니다.' } }],
  ['응답 형식 오류', { status: 200, body: {} }],
] as const) {
  test(`S6: 조회 실패(${label})`, async ({ page }) => {
    await mockFeedApi(page)
    await page.route(feedListPattern, (route) =>
      route.fulfill({
        status: response.status,
        contentType: 'application/json',
        body: JSON.stringify(response.body),
      }),
    )
    await page.goto('/feeds')

    await expect(page.getByText(ERROR_TEXT)).toBeVisible()
    await expect(rows(page)).toHaveCount(0)
  })
}
