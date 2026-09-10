import { expect, test } from '@playwright/test'

const apiPath = /\/api\/notice(?:\?.*)?$/

test('S1: page=0, size=10으로 조회하고 목록을 표시한다', async ({ page }) => {
  const requestURLs: string[] = []
  await page.route(apiPath, async (route) => {
    requestURLs.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 7,
          title: 'API 연동 공지',
          kind: '공지사항 분류',
          createAt: '2026-07-27',
        },
      ]),
    })
  })

  await page.goto('/notices/list')

  await expect(page.getByTestId('notice-row')).toHaveCount(1)
  await expect(page.getByTestId('notice-row')).toContainText('API 연동 공지')
  await expect(page.getByTestId('notice-row')).toContainText('공지사항 분류')
  await expect(page.getByTestId('notice-row')).toContainText('2026-07-27')
  expect(requestURLs).toHaveLength(1)

  const requestURL = new URL(requestURLs[0])
  expect(requestURL.searchParams.get('page')).toBe('0')
  expect(requestURL.searchParams.get('size')).toBe('10')
})

test('S2: 빈 배열이면 기존 빈 상태를 표시한다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    })
  })

  await page.goto('/notices/list')

  await expect(page.getByTestId('notice-row')).toHaveCount(0)
  await expect(page.getByText('표시할 공지가 없습니다')).toBeVisible()
})

test('S3: 서버 오류를 빈 배열로 숨기지 않는다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '예상하지 못한 에러가 발생했습니다.',
        status: 500,
        timestamp: '2026-07-27T12:00:00',
        description: '에러 설명',
      }),
    })
  })

  await page.goto('/notices/list')

  await expect(page.getByRole('alert')).toHaveText(
    '공지사항을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByText('표시할 공지가 없습니다')).toHaveCount(0)
})

test('S4: 공지 행을 클릭하면 기존 상세 경로로 이동한다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 7,
          title: '이동할 공지',
          kind: '공지사항 분류',
          createAt: '2026-07-27',
        },
      ]),
    })
  })

  await page.goto('/notices/list')
  await page.getByTestId('notice-row').click()

  await expect(page).toHaveURL(/\/notices\/list\/7$/)
})
