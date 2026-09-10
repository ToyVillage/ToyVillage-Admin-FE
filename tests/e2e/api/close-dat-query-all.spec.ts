import { expect, test } from '@playwright/test'

const apiPath = /\/api\/close-day(?:\?.*)?$/

test('S1: 휴관일 전체 조회 결과를 목록과 달력에 표시한다', async ({ page }) => {
  const requests: string[] = []
  const today = new Date()
  const date = toDateKey(today)

  await page.route(apiPath, async (route) => {
    requests.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 7,
          title: 'API 연동 휴관일',
          startCloseTime: date,
          endCloseTime: date,
        },
      ]),
    })
  })

  await page.goto('/notices/guide')

  await expect(page.getByText('API 연동 휴관일')).toBeVisible()
  await expect(
    page.getByLabel(`${formatFullDate(today)} 휴관 일정 있음`),
  ).toBeVisible()
  expect(requests).toHaveLength(1)

  const request = new URL(requests[0])
  expect(request.pathname).toBe('/api/close-day')
  expect(request.search).toBe('')
})

test('S2: 빈 배열이면 기존 빈 상태를 표시한다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    })
  })

  await page.goto('/notices/guide')

  await expect(page.getByText('아직 추가된 휴관일이 없습니다')).toBeVisible()
})

test('S3: 서버 오류를 mock 또는 빈 배열로 숨기지 않는다', async ({ page }) => {
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

  await page.goto('/notices/guide')

  await expect(page.getByRole('alert')).toHaveText(
    '휴관일을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByText('아직 추가된 휴관일이 없습니다')).toHaveCount(0)
})

test('S4: 휴관 일정 카드의 기존 수정 경로를 유지한다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 7,
          title: '이동할 휴관일',
          startCloseTime: '2026-07-28',
          endCloseTime: '2026-07-28',
        },
      ]),
    })
  })

  await page.goto('/notices/guide')

  await expect(
    page.getByRole('link', { name: '이동할 휴관일 휴관 일정 수정' }),
  ).toHaveAttribute('href', '/notices/guide/7/edit')
})

test('S5: Contract 필수 필드가 누락된 응답을 거부한다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 7,
          title: '잘못된 휴관일',
          startCloseTime: '2026-07-28',
        },
      ]),
    })
  })

  await page.goto('/notices/guide')

  await expect(page.getByRole('alert')).toHaveText(
    '휴관일을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByText('잘못된 휴관일')).toHaveCount(0)
})

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatFullDate(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}
