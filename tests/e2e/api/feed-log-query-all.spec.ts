import { expect, test, type Page } from '@playwright/test'
import {
  feedListPattern,
  mockFeedApi,
  todayIsoDate,
} from '../support/feed-api'

// 대상: GET /feed-log/admin?date&animalTaxonomic&page&size.
// 표의 네 열이 모두 목록 응답에 있어 행별 추가 조회가 없다는 점과
// 분류 탭이 서버 필터로 나간다는 점을 계약으로 고정한다. 실제 서버는 호출하지 않는다.

const rows = (page: Page) => page.getByTestId('feed-row')

test('S1: 진입 시 date=오늘 · page=0 · size=4 로 한 번만 조회한다', async ({
  page,
}) => {
  const requests: { url: string; headers: Record<string, string> }[] = []
  const api = await mockFeedApi(page)
  await page.route(feedListPattern, async (route) => {
    requests.push({
      url: route.request().url(),
      headers: route.request().headers(),
    })
    await route.fallback()
  })

  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(4)

  expect(requests).toHaveLength(1)
  const query = new URL(requests[0].url).searchParams
  expect(query.get('date')).toBe(todayIsoDate())
  expect(query.get('page')).toBe('0')
  expect(query.get('size')).toBe('4')
  // 전체 탭은 분류를 보내지 않는다.
  expect(query.get('animalTaxonomic')).toBeNull()
  expect(requests[0].headers.authorization).toBe('Bearer test-access-token')
  // 목록 응답만으로 표가 채워진다(행별 상세 조회 없음).
  expect(api.requests.adminDetail).toBe(0)
})

test('S2: 분류 탭을 누르면 animalTaxonomic 으로 다시 조회한다', async ({
  page,
}) => {
  const taxonomics: (string | null)[] = []
  await mockFeedApi(page)
  await page.route(feedListPattern, async (route) => {
    taxonomics.push(
      new URL(route.request().url()).searchParams.get('animalTaxonomic'),
    )
    await route.fallback()
  })

  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(4)

  await page.getByRole('button', { name: '파충류' }).click()
  await expect(rows(page)).toHaveCount(1)

  await page.getByRole('button', { name: '조류' }).click()
  await expect(rows(page)).toHaveCount(1)

  await page.getByRole('button', { name: '전체' }).click()
  await expect(rows(page)).toHaveCount(4)

  // 요청은 화면 갱신보다 늦게 기록될 수 있어 개수가 찰 때까지 기다린다.
  await expect.poll(() => taxonomics).toEqual([null, 'REPTILES', 'BIRDS', null])
})

test('S3: 총 페이지 수는 서버 응답(totalPageSize)을 따른다', async ({
  page,
}) => {
  const pages: (string | null)[] = []
  await mockFeedApi(page)
  await page.route(feedListPattern, async (route) => {
    pages.push(new URL(route.request().url()).searchParams.get('page'))
    await route.fallback()
  })

  await page.goto('/feeds')
  await expect(page.getByRole('button', { name: '2 페이지' })).toBeVisible()
  await expect(page.getByRole('button', { name: '3 페이지' })).toHaveCount(0)

  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page)).toHaveCount(2)

  await expect.poll(() => pages).toEqual(['0', '1'])
})

test('S4: 조회날짜를 바꾸면 그 날짜로 다시 조회한다', async ({ page }) => {
  const dates: (string | null)[] = []
  await mockFeedApi(page)
  await page.route(feedListPattern, async (route) => {
    dates.push(new URL(route.request().url()).searchParams.get('date'))
    await route.fallback()
  })

  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(4)

  const lastYear = String(new Date().getFullYear() - 1)
  await page.getByRole('button', { name: '조회 연도' }).click()
  await page.getByRole('option', { name: `${lastYear}년` }).click()
  await expect(rows(page)).toHaveCount(0)

  await expect.poll(() => dates).toHaveLength(2)
  expect(dates[1]?.startsWith(lastYear)).toBe(true)
})

// 명세 예시의 `feedDateTime` 은 `Z`(UTC)가 붙는다. 표에는 현지 시각으로 보여야 한다.
test('S4-1: UTC 로 온 급여일시를 현지 시각으로 표시한다', async ({ page }) => {
  await mockFeedApi(page)
  await page.route(feedListPattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        feedLogs: [
          {
            feedLogId: 1,
            staffName: '관리자',
            animalKind: '비단잉어',
            animalName: '금이',
            feedType: '사료',
            feedAmount: 0.1,
            feedDateTime: '2026-09-16T13:55:42.647Z',
          },
        ],
        totalPageSize: 1,
      }),
    })
  })

  await page.goto('/feeds')

  await expect(rows(page)).toHaveCount(1)
  const expected = new Date('2026-09-16T13:55:42.647Z')
  const hour = String(expected.getHours()).padStart(2, '0')
  const minute = String(expected.getMinutes()).padStart(2, '0')
  await expect(rows(page).first()).toContainText(`${hour}:${minute}`)
  await expect(rows(page).first()).toContainText('관리자')
  await expect(rows(page).first()).toContainText('0.1kg')
})

test('S5: 목록 응답 형식이 명세와 다르면 빈 목록이 아니라 오류를 알린다', async ({
  page,
}) => {
  await mockFeedApi(page)
  await page.route(feedListPattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ feedLogs: [{ feedLogId: 'one' }] }),
    })
  })

  await page.goto('/feeds')

  await expect(page.getByRole('alert')).toContainText(
    '급여 내역을 불러오지 못했습니다.',
  )
  await expect(rows(page)).toHaveCount(0)
})

test('S6: 목록 조회가 실패하면 오류를 알린다', async ({ page }) => {
  await mockFeedApi(page)
  await page.route(feedListPattern, async (route) => {
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
