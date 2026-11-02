import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  fifthFloorFeedDetailPattern,
  mockFeedApi,
  mockFifthFloorFeedLog,
  todayIsoDate,
} from '../support/feed-api'

// 대상: APP_FIFTH_FLOOR_FEED_LOG_QUERY_ADMIN (GET /feed-log/fifth-floor/admin/{feedLogId}).
// 승인 시나리오: harness/api/approvals/app-fifth-floor-feed-log-query-admin.test-scenarios.md

async function fieldValues(page: Page) {
  const fields = page.locator('dl > div')
  await expect(fields.first()).toBeVisible()
  return fields.evaluateAll((cards) =>
    cards.map((card) => [
      card.querySelector('dt')?.textContent ?? '',
      card.querySelector('dd')?.textContent ?? '',
    ]),
  )
}

test('S1: 상세를 Bearer 토큰으로 1회 요청하고 4층 API 는 부르지 않는다', async ({
  page,
}) => {
  const authorizations: (string | undefined)[] = []
  const api = await mockFeedApi(page)
  await page.route(fifthFloorFeedDetailPattern, async (route) => {
    authorizations.push(route.request().headers().authorization)
    await route.fallback()
  })

  await page.goto('/feeds/fifth-floor/10')
  await expect(
    page.getByText('오스카 · 오돌이의 급여 기록입니다'),
  ).toBeVisible()

  expect(api.fifthFloor.requests.adminDetail).toBe(1)
  expect(authorizations).toEqual(['Bearer test-access-token'])
  expect(api.requests.adminDetail).toBe(0)
  expect(api.requests.history).toBe(0)
})

test('S2: 응답 필드를 칸에 매핑하고 단위를 붙인다', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds/fifth-floor/10')

  expect(await fieldValues(page)).toEqual([
    ['대상 개체', '오스카 · 오돌이'],
    ['급여일', todayIsoDate().replaceAll('-', '.')],
    ['급여자', '박도현'],
    ['먹이 종류', '펠렛'],
    ['급여량', '15 g/ml'],
  ])
  await expect(page.getByText('잔량', { exact: true })).toHaveCount(0)
  await expect(page.getByText('특이사항', { exact: true })).toHaveCount(0)

  await mockFeedApi(page, {
    fifthFloorFeedLogs: [
      mockFifthFloorFeedLog({ feedAmount: 1.2, feedUnit: 'KGL' }),
    ],
  })
  await page.reload()
  await expect(page.getByText('1.2 kg/l')).toBeVisible()
})

test('S3: 급여 이력 보기는 응답의 animalId 로 간다', async ({ page }) => {
  await mockFeedApi(page, {
    fifthFloorFeedLogs: [mockFifthFloorFeedLog({ animalId: 77 })],
  })
  await page.goto('/feeds/fifth-floor/10')

  await page.getByRole('button', { name: '급여 이력 보기' }).click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/animals\/77$/)
})

test('S4: 없는 기록(404)이면 목록으로 돌아간다', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds/fifth-floor/999')

  await expect(page).toHaveURL(/\/feeds$/)
})

test('S5: 500 이나 응답 형식 오류면 오류 카드를 보여주고 다시 시도로 회복한다', async ({
  page,
}) => {
  await mockFeedApi(page)
  const responses = [
    { status: 500, body: errorBody(500, '내부 서버 오류가 발생했습니다.') },
    { status: 200, body: {} },
  ]
  await page.route(fifthFloorFeedDetailPattern, async (route) => {
    const next = responses.shift()
    if (route.request().method() !== 'GET' || !next) {
      await route.fallback()
      return
    }
    await route.fulfill({
      status: next.status,
      contentType: 'application/json',
      body: JSON.stringify(next.body),
    })
  })
  await page.goto('/feeds/fifth-floor/10')

  await expect(page.getByText('정보를 불러오지 못했습니다')).toBeVisible()
  await page.getByRole('button', { name: '다시 시도' }).click()
  // 형식 오류도 같은 오류 카드다.
  await expect(page.getByText('정보를 불러오지 못했습니다')).toBeVisible()
  await expect.poll(() => responses.length).toBe(0)
  await page.getByRole('button', { name: '다시 시도' }).click()
  await expect(
    page.getByText('오스카 · 오돌이의 급여 기록입니다'),
  ).toBeVisible()
})
