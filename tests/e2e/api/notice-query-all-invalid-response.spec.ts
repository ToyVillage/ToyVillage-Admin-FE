import { expect, test } from '@playwright/test'

const apiPath = /\/api\/notice(?:\?.*)?$/

test('날짜가 없는 응답도 공지 목록을 표시한다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: '7',
          title: '날짜 없는 공지',
          kind: 'GENERAL',
        },
      ]),
    })
  })

  await page.goto('/notices/list')

  await expect(page.getByTestId('notice-row')).toHaveCount(1)
  await expect(page.getByTestId('notice-row')).toContainText('날짜 없는 공지')
  await expect(page.getByTestId('notice-row')).toContainText('GENERAL')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText('Unexpected Application Error!')).toHaveCount(0)
})
