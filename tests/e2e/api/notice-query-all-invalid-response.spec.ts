import { expect, test } from '@playwright/test'

const apiPath = /^https:\/\/[^/]+\/notice(?:\?.*)?$/

test('날짜·팀이 없는 응답도 공지 목록을 전체로 표시한다', async ({ page }) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        notices: [
          {
            id: '7',
            title: '날짜 없는 공지',
          },
        ],
        totalPageSize: 1,
      }),
    })
  })

  await page.goto('/notices/list')

  await expect(page.getByTestId('notice-row')).toHaveCount(1)
  await expect(page.getByTestId('notice-row')).toContainText('날짜 없는 공지')
  await expect(page.getByTestId('notice-row')).toContainText('전체')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText('Unexpected Application Error!')).toHaveCount(0)
})
