import { expect, test } from '@playwright/test'

const apiPath = /\/api\/notice(?:\?.*)?$/

test('accessToken이 있으면 Bearer 인증 헤더를 전송한다', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'test-access-token')
  })

  await page.route(apiPath, async (route) => {
    expect(route.request().headers().authorization).toBe(
      'Bearer test-access-token',
    )
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    })
  })

  await page.goto('/notices/list')

  await expect(page.getByText('표시할 공지가 없습니다')).toBeVisible()
})
