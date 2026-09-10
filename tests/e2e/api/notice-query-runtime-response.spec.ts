import { expect, test } from '@playwright/test'

const detailApiPath = /\/api\/notice\/[^/?]+(?:\?.*)?$/

test('실제 서버의 완화된 상세 응답도 공지 폼에 표시한다', async ({ page }) => {
  await page.route(detailApiPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '7',
        title: '실제 응답 형태의 상세 공지',
        kind: 'ALL',
        content: '성공 응답을 조회 오류로 처리하지 않습니다.',
      }),
    })
  })

  await page.goto('/notices/list/7')

  await expect(page.getByLabel('제목')).toHaveValue(
    '실제 응답 형태의 상세 공지',
  )
  await expect(page.getByLabel('내용')).toHaveValue(
    '성공 응답을 조회 오류로 처리하지 않습니다.',
  )
  await expect(page.getByRole('radio', { name: '전체' })).toBeChecked()
  await expect(page.getByRole('alert')).toHaveCount(0)
})
