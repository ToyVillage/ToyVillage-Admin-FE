import { expect, test, type Page } from '@playwright/test'
import { mockFeedApi, todayIsoDate } from '../support/feed-api'

// 대상: GET /feed-log/admin?date= (+ 행을 채우는 GET /feed-log/admin/{feedLogId},
// 분류를 채우는 GET /animal-manage/{animalManageId}).
// 목록 응답에 표 열 값이 없어 생긴 추가 호출을 계약으로 고정한다. 실제 서버는 호출하지 않는다.

const listPattern = /^https:\/\/[^/]+\/feed-log\/admin(?:\?.*)?$/

const rows = (page: Page) => page.getByTestId('feed-row')

test('S1: 진입 시 오늘 날짜로 목록을 한 번 조회하고 Bearer 토큰을 보낸다', async ({
  page,
}) => {
  const requests: { url: string; headers: Record<string, string> }[] = []
  const api = await mockFeedApi(page)
  await page.route(listPattern, async (route) => {
    requests.push({
      url: route.request().url(),
      headers: route.request().headers(),
    })
    await route.fallback()
  })

  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(4)

  expect(requests).toHaveLength(1)
  expect(new URL(requests[0].url).searchParams.get('date')).toBe(todayIsoDate())
  expect(requests[0].headers.authorization).toBe('Bearer test-access-token')
  // 오늘 급여 6건 → 행마다 상세 1회.
  expect(api.requests.adminDetail).toBe(6)
})

test('S2: 같은 개체가 여러 번 급여돼도 개체 조회는 개체당 한 번이다', async ({
  page,
}) => {
  const today = todayIsoDate()
  const api = await mockFeedApi(page, {
    feedLogs: [
      feedLog(1, 1, `${today}T09:00:00`),
      feedLog(2, 1, `${today}T12:00:00`),
      feedLog(3, 2, `${today}T13:00:00`),
    ],
  })

  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(3)

  expect(api.requests.adminDetail).toBe(3)
  expect(api.requests.animal).toBe(2)
})

test('S3: 목록 응답 형식이 명세와 다르면 빈 목록이 아니라 오류를 알린다', async ({
  page,
}) => {
  await mockFeedApi(page)
  await page.route(listPattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ feedLogs: [{ feedId: 'one' }] }),
    })
  })

  await page.goto('/feeds')

  await expect(page.getByRole('alert')).toContainText(
    '급여 내역을 불러오지 못했습니다.',
  )
  await expect(rows(page)).toHaveCount(0)
  await expect(
    page.getByText('해당 날짜에 급여 내역이 없습니다.'),
  ).toBeHidden()
})

test('S3-1: 목록 조회가 실패하면 오류를 알린다', async ({ page }) => {
  await mockFeedApi(page)
  await page.route(listPattern, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: '서버 오류' }),
    })
  })

  await page.goto('/feeds')

  await expect(page.getByRole('alert')).toContainText(
    '급여 내역을 불러오지 못했습니다.',
  )
})

test('S4: 조회날짜를 바꾸면 그 날짜로 다시 조회한다', async ({ page }) => {
  const dates: (string | null)[] = []
  await mockFeedApi(page)
  await page.route(listPattern, async (route) => {
    dates.push(new URL(route.request().url()).searchParams.get('date'))
    await route.fallback()
  })

  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(4)

  const lastYear = String(new Date().getFullYear() - 1)
  await page.getByRole('button', { name: '조회 연도' }).click()
  await page.getByRole('option', { name: `${lastYear}년` }).click()
  await expect(rows(page)).toHaveCount(0)

  expect(dates).toHaveLength(2)
  expect(dates[1]?.startsWith(lastYear)).toBe(true)
})

test('S5: 분류 탭을 누를 때마다 그 분류로 목록을 다시 조회한다', async ({
  page,
}) => {
  const dates: (string | null)[] = []
  await mockFeedApi(page)
  await page.route(listPattern, async (route) => {
    dates.push(new URL(route.request().url()).searchParams.get('date'))
    await route.fallback()
  })

  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(4)

  await page.getByRole('button', { name: '포유류' }).click()
  await expect(rows(page)).toHaveCount(4)

  await page.getByRole('button', { name: '파충류' }).click()
  await expect(rows(page)).toHaveCount(1)

  await page.getByRole('button', { name: '전체' }).click()
  await expect(rows(page)).toHaveCount(4)

  // 전체 → 포유류 → 파충류 → 전체. 서버에 분류 필터가 없어 요청 값은 날짜뿐이다.
  expect(dates).toHaveLength(4)
  expect(new Set(dates)).toEqual(new Set([todayIsoDate()]))
})

function feedLog(feedId: number, animalId: number, feedDateTime: string) {
  return {
    feedId,
    animalId,
    animalKind: '표범',
    animalName: `개체${animalId}`,
    animalTaxonomic: 'MAMMALS' as const,
    feedType: '생닭',
    feedAmount: 2,
    name: '김수인',
    feedDateTime,
    significant: '정상',
  }
}
