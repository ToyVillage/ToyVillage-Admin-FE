import { expect, test } from '@playwright/test'

const openTimeApiPath = /\/api\/open-time\/date(?:\?.*)?$/

test('S1: 날짜별 운영시간을 영업 시작과 종료 초기값으로 표시한다', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))

  await page.route(openTimeApiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          openDate: '2026-07-01',
          startOpenTime: '09:00:00',
          endOpenTime: '18:00:00',
        },
      ]),
    })
  })

  await page.goto('/notices/guide/hours/2026-07-01')

  await expect(page.getByLabel('영업 시작 시')).toHaveValue('09')
  await expect(page.getByLabel('영업 시작 분')).toHaveValue('00')
  await expect(
    page
      .getByRole('group', { name: '영업 시작 오전 오후 선택' })
      .getByRole('button', { name: '오전' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('영업 종료 시')).toHaveValue('06')
  await expect(page.getByLabel('영업 종료 분')).toHaveValue('00')
  await expect(
    page
      .getByRole('group', { name: '영업 종료 오전 오후 선택' })
      .getByRole('button', { name: '오후' }),
  ).toHaveAttribute('aria-pressed', 'true')

  const openTimeRequests = requests.filter((url) =>
    openTimeApiPath.test(new URL(url).pathname + new URL(url).search),
  )
  expect(openTimeRequests).toHaveLength(1)
  const request = new URL(openTimeRequests[0])
  expect(request.pathname).toBe('/api/open-time/date')
  expect(request.searchParams.get('date')).toBe('2026-07-01')
})

test('S2: 서버 오류를 기본 영업시간으로 숨기지 않는다', async ({ page }) => {
  await page.route(openTimeApiPath, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '예상하지 못한 에러가 발생했습니다.',
        status: 500,
        timestamp: '2026-07-30T12:00:00',
        description: '에러 설명',
      }),
    })
  })

  await page.goto('/notices/guide/hours/2026-07-01')

  await expect(page.getByRole('alert')).toHaveText(
    '영업시간을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByRole('button', { name: '저장하기' })).toHaveCount(0)
})

test('S3: Contract 필수 필드가 누락된 응답을 거부한다', async ({ page }) => {
  await page.route(openTimeApiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          openDate: '2026-07-01',
          startOpenTime: '09:00:00',
        },
      ]),
    })
  })

  await page.goto('/notices/guide/hours/2026-07-01')

  await expect(page.getByRole('alert')).toHaveText(
    '영업시간을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByLabel('영업 시작 시')).toHaveCount(0)
})

test('S4: 잘못된 route date는 운영시간 API를 호출하지 않는다', async ({
  page,
}) => {
  let requestCount = 0
  await page.route(openTimeApiPath, async (route) => {
    requestCount += 1
    await route.abort()
  })

  await page.goto('/notices/guide/hours/2026-02-30')

  await expect(page).toHaveURL(/\/notices\/guide$/)
  expect(requestCount).toBe(0)
})
