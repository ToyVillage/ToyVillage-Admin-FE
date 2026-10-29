import { expect, test, type Page } from '@playwright/test'
import { mockAnimalManageApi } from '../support/animal-manage-api'
import {
  errorBody,
  feedHistoryPattern,
  fifthFloorFeedHistoryPattern,
  mockFeedApi,
  mockFifthFloorFeedLog,
  todayIsoDate,
} from '../support/feed-api'

// 대상: APP_FIFTH_FLOOR_FEED_LOG_QUERY_HISTORY_ADMIN (GET /feed-log/fifth-floor/admin/history/{animalManageId}).
// 승인 시나리오: harness/api/approvals/app-fifth-floor-feed-log-query-history-admin.test-scenarios.md

const rows = (page: Page) => page.getByTestId('feed-history-row')

function cells(page: Page, index: number) {
  return rows(page)
    .nth(index)
    .evaluate((row) =>
      [...row.children].map((cell) => cell.textContent?.trim() ?? ''),
    )
}

function dotted(isoDate: string) {
  return isoDate.replaceAll('-', '.')
}

function shifted(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

test('S1: 이력을 Bearer 토큰으로 1회 요청하고 4층 이력은 부르지 않는다', async ({
  page,
}) => {
  const authorizations: (string | undefined)[] = []
  await mockAnimalManageApi(page)
  const api = await mockFeedApi(page)
  await page.route(fifthFloorFeedHistoryPattern, async (route) => {
    authorizations.push(route.request().headers().authorization)
    await route.fallback()
  })

  await page.goto('/feeds/fifth-floor/animals/10')
  await expect(rows(page)).toHaveCount(2)

  expect(api.fifthFloor.requests.history).toBe(1)
  expect(authorizations).toEqual(['Bearer test-access-token'])
  expect(api.requests.history).toBe(0)
})

test('S2: 열 매핑·단위와 최신순 정렬', async ({ page }) => {
  await mockAnimalManageApi(page)
  // 응답은 날짜 오름차순으로 온다.
  await mockFeedApi(page, {
    fifthFloorFeedLogs: [
      mockFifthFloorFeedLog({
        feedLogId: 31,
        feedType: '펠렛',
        feedAmount: 10,
        feedDate: shifted(-2),
      }),
      mockFifthFloorFeedLog({
        feedLogId: 32,
        feedType: '냉동새우',
        feedAmount: 1.5,
        feedUnit: 'KGL',
        staffName: '이서준',
        feedDate: shifted(-1),
      }),
      mockFifthFloorFeedLog({ feedLogId: 33 }),
    ],
  })
  await page.goto('/feeds/fifth-floor/animals/10')

  await expect(rows(page)).toHaveCount(3)
  await expect(page.getByText('3건')).toBeVisible()
  expect(await cells(page, 0)).toEqual([
    dotted(todayIsoDate()),
    '펠렛',
    '15 g/ml',
    '박도현',
    '',
  ])
  expect((await cells(page, 1)).slice(0, 4)).toEqual([
    dotted(shifted(-1)),
    '냉동새우',
    '1.5 kg/l',
    '이서준',
  ])
  expect((await cells(page, 2))[0]).toBe(dotted(shifted(-2)))
})

test('S3: 404 나 빈 배열이면 이력 없음으로 보여준다', async ({ page }) => {
  await mockAnimalManageApi(page)
  // 기록이 없는 개체는 가짜 서버가 404 로 응답한다.
  await mockFeedApi(page, { fifthFloorFeedLogs: [] })
  await page.goto('/feeds/fifth-floor/animals/10')

  await expect(page.getByText('급여 이력이 없습니다.')).toBeVisible()
  await expect(page.getByText('0건')).toBeVisible()
  await expect(page.getByText('정보를 불러오지 못했습니다')).toHaveCount(0)

  await page.route(fifthFloorFeedHistoryPattern, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ feedLogs: [] }),
    }),
  )
  await page.reload()
  await expect(page.getByText('급여 이력이 없습니다.')).toBeVisible()
})

test('S4: 500 이나 응답 형식 오류면 오류 카드를 보여주고 다시 시도로 회복한다', async ({
  page,
}) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page)
  const responses = [
    { status: 500, body: errorBody(500, '내부 서버 오류가 발생했습니다.') },
    { status: 200, body: {} },
  ]
  await page.route(fifthFloorFeedHistoryPattern, async (route) => {
    const next = responses.shift()
    if (!next) {
      await route.fallback()
      return
    }
    await route.fulfill({
      status: next.status,
      contentType: 'application/json',
      body: JSON.stringify(next.body),
    })
  })
  await page.goto('/feeds/fifth-floor/animals/10')

  await expect(page.getByText('정보를 불러오지 못했습니다')).toBeVisible()
  await page.getByRole('button', { name: '다시 시도' }).click()
  await expect.poll(() => responses.length).toBe(0)
  await expect(page.getByText('정보를 불러오지 못했습니다')).toBeVisible()
  await page.getByRole('button', { name: '다시 시도' }).click()
  await expect(rows(page)).toHaveCount(2)
})

test('S5: 행을 누르면 그 기록 상세로 간다', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page)
  await page.goto('/feeds/fifth-floor/animals/10')

  await rows(page).first().click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/10$/)
})

test('S6: 개체 상세 버튼은 4층에 없으면 5층 이력을 찾아 간다', async ({
  page,
}) => {
  const feedButton = () =>
    page.getByRole('button', { name: '먹이 급여 기록 확인하기' })
  await mockAnimalManageApi(page)
  const api = await mockFeedApi(page)
  await page.goto('/species/2/individuals/10')

  await feedButton().click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/animals\/10$/)
  expect(api.requests.history).toBe(1)
  expect(api.fifthFloor.requests.history).toBeGreaterThanOrEqual(1)

  // 5층도 없으면(404) 이동하지 않고 알린다.
  await mockFeedApi(page, { fifthFloorFeedLogs: [] })
  await page.goto('/species/2/individuals/10')
  await feedButton().click()
  await expect(page.getByRole('alert')).toContainText('급여 기록이 없습니다')
  await expect(page).toHaveURL(/\/species\/2\/individuals\/10$/)

  // 5층 조회가 실패하면 알린다.
  await page.route(feedHistoryPattern, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify(errorBody(404, '존재하지 않는 개체입니다.')),
    }),
  )
  await page.route(fifthFloorFeedHistoryPattern, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(errorBody(500, '내부 서버 오류가 발생했습니다.')),
    }),
  )
  await page.goto('/species/2/individuals/10')
  await feedButton().click()
  await expect(page.getByRole('alert')).toContainText(
    '급여 기록을 불러오지 못했습니다',
  )
  await expect(page).toHaveURL(/\/species\/2\/individuals\/10$/)
})
