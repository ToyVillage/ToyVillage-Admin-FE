import { expect, test, type Page } from '@playwright/test'

const apiPath = /\/api\/close-day(?:\?.*)?$/
const openTimeApiPath = /\/api\/open-time\/date(?:\?.*)?$/

async function mockOperatingHours(page: Page, date: string) {
  await page.route(openTimeApiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          openDate: date,
          startOpenTime: '09:00:00',
          endOpenTime: '18:00:00',
        },
      ]),
    })
  })
}

test('S1: 날짜별 정상 조회 결과를 상세 화면에 표시한다', async ({
  page,
}) => {
  const requests: string[] = []
  await mockOperatingHours(page, '2026-07-13')

  await page.route(apiPath, async (route) => {
    requests.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          title: '정기 휴관',
          startCloseTime: '2026-07-13',
          endCloseTime: '2026-07-13',
        },
      ]),
    })
  })

  await page.goto('/notices/guide/hours/2026-07-13')

  await expect(
    page.getByRole('heading', { name: '7월 13일 영업시간' }),
  ).toBeVisible()
  await expect(page.getByText('휴관 일정: 정기 휴관')).toBeVisible()
  expect(requests).toHaveLength(1)

  const request = new URL(requests[0])
  expect(request.pathname).toBe('/api/close-day')
  expect(request.searchParams.get('date')).toBe('2026-07-13')
  expect([...request.searchParams.keys()]).toEqual(['date'])
})

test('S2: 빈 결과는 오류 없이 기존 상세 UI를 표시한다', async ({ page }) => {
  await mockOperatingHours(page, '2026-07-14')

  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    })
  })

  await page.goto('/notices/guide/hours/2026-07-14')

  await expect(
    page.getByRole('heading', { name: '7월 14일 영업시간' }),
  ).toBeVisible()
  await expect(page.getByText('휴관 일정:')).toHaveCount(0)
  await expect(
    page.getByText('운영시간 수정은 현재 지원되지 않습니다.'),
  ).toBeVisible()
})

test('S3: HTTP 404를 빈 결과로 해석하지 않는다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '해당 휴관일을 찾을 수 없습니다.',
        status: 404,
        timestamp: '2026-07-31T12:00:00',
        description: '정의되지 않은 서버 응답',
      }),
    })
  })

  await page.goto('/notices/guide/hours/2026-07-13')

  await expect(page.getByRole('alert')).toHaveText(
    '휴관일을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByRole('button', { name: '저장하기' })).toHaveCount(0)
})

test('S4: 서버 오류를 빈 배열로 숨기지 않는다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '예상하지 못한 에러가 발생했습니다.',
        status: 500,
        timestamp: '2026-07-28T12:00:00',
        description: '에러 설명',
      }),
    })
  })

  await page.goto('/notices/guide/hours/2026-07-13')

  await expect(page.getByRole('alert')).toHaveText(
    '휴관일을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByRole('button', { name: '저장하기' })).toHaveCount(0)
})

test('S5: 잘못된 route date는 API를 호출하지 않는다', async ({ page }) => {
  let requestCount = 0
  await page.route(apiPath, async (route) => {
    requestCount += 1
    await route.abort()
  })

  await page.goto('/notices/guide/hours/2026-02-30')

  await expect(page).toHaveURL(/\/notices\/guide$/)
  expect(requestCount).toBe(0)
})

test('S6: Contract 필수 필드가 누락된 응답을 거부한다', async ({
  page,
}) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          title: '잘못된 휴관',
          startCloseTime: '2026-07-13',
        },
      ]),
    })
  })

  await page.goto('/notices/guide/hours/2026-07-13')

  await expect(page.getByRole('alert')).toHaveText(
    '휴관일을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByText('잘못된 휴관')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '저장하기' })).toHaveCount(0)
})
