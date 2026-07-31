import { expect, test, type Page, type Route } from '@playwright/test'

const closeScheduleApiPath = /\/api\/close-day(?:\?.*)?$/
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

test('휴관일 조회가 대기 중이어도 운영시간을 독립적으로 조회한다', async ({
  page,
}) => {
  let pendingCloseScheduleRoute: Route | undefined
  await page.route(closeScheduleApiPath, async (route) => {
    pendingCloseScheduleRoute = route
  })
  await mockOperatingHours(page, '2026-07-13')

  await page.goto('/notices/guide/hours/2026-07-13')

  await expect(page.getByText('휴관일을 조회하는 중입니다.')).toBeVisible()
  await expect(page.getByLabel('영업 시작 시')).toHaveValue('09')
  await expect(page.getByLabel('영업 종료 시')).toHaveValue('06')

  await pendingCloseScheduleRoute?.abort()
})

test('휴관일 조회가 실패해도 조회된 운영시간을 유지한다', async ({ page }) => {
  await page.route(closeScheduleApiPath, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '예상하지 못한 에러가 발생했습니다.',
        status: 500,
        timestamp: '2026-07-31T12:00:00',
        description: '에러 설명',
      }),
    })
  })
  await mockOperatingHours(page, '2026-07-13')

  await page.goto('/notices/guide/hours/2026-07-13')

  await expect(page.getByRole('alert')).toHaveText(
    '휴관일을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByLabel('영업 시작 시')).toHaveValue('09')
  await expect(page.getByLabel('영업 종료 시')).toHaveValue('06')
})
