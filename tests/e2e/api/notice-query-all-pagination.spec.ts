import { expect, test } from '@playwright/test'

const apiPath = /\/api\/notice(?:\?.*)?$/

test('서버의 다음 페이지까지 조회해 11번째 공지와 카테고리를 표시한다', async ({
  page,
}) => {
  const requestedPages: string[] = []

  await page.route(apiPath, async (route) => {
    const requestURL = new URL(route.request().url())
    const serverPage = requestURL.searchParams.get('page') ?? ''
    requestedPages.push(serverPage)

    const startId = Number(serverPage) * 10 + 1
    const pageSize = serverPage === '0' ? 10 : 3
    const notices = Array.from({ length: pageSize }, (_, index) => {
      const id = startId + index

      return {
        id,
        title: `공지 ${id}`,
        kind: id > 10 ? '두 번째 페이지 분류' : '첫 번째 페이지 분류',
        createAt: `2026-07-${String(28 - id).padStart(2, '0')}`,
      }
    })

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(notices),
    })
  })

  await page.goto('/notices/list')

  await expect(
    page.getByRole('button', { name: '두 번째 페이지 분류' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '3 페이지' }).click()
  await expect(
    page.getByTestId('notice-row').filter({ hasText: '공지 11' }),
  ).toBeVisible()
  expect(requestedPages).toEqual(['0', '1'])
})
