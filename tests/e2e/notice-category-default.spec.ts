import { expect, test } from '@playwright/test'

const apiPath = /\/api\/notice(?:\?.*)?$/

test('공지 분류 ALL은 전체로 표시하고 전체 탭을 기본 선택한다', async ({
  page,
}) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          title: '전체 공지',
          kind: 'ALL',
          createAt: '2026-07-28',
        },
      ]),
    })
  })

  await page.goto('/notices/list')

  await expect(page.getByRole('button', { name: '전체' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: 'ALL' })).toHaveCount(0)
  await expect(page.getByTestId('notice-row')).toContainText('전체')
  await expect(page.getByTestId('notice-row')).not.toContainText('ALL')
})
