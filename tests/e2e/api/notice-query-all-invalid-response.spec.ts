import { expect, test } from '@playwright/test'

const apiPath = /\/api\/notice(?:\?.*)?$/

test('필수 날짜가 없는 응답은 목록 렌더 오류 대신 조회 오류로 표시한다', async ({
  page,
}) => {
  await page.route(apiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 7,
          title: '날짜 없는 공지',
          kind: '공지사항 분류',
        },
      ]),
    })
  })

  await page.goto('/notices/list')

  await expect(page.getByRole('alert')).toHaveText(
    '공지사항을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByText('Unexpected Application Error!')).toHaveCount(0)
})
