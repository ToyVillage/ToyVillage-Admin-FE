import { expect, test } from '@playwright/test'

const detailApiPath = /\/api\/notice\/[^/?]+(?:\?.*)?$/

test('S1: route ID로 상세 조회하고 기존 폼에 표시한다', async ({ page }) => {
  const requestURLs: string[] = []
  await page.route(detailApiPath, async (route) => {
    requestURLs.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 7,
        title: 'API 상세 공지',
        kind: '공지사항 분류',
        content: 'API에서 조회한 공지사항 내용입니다.',
        createdAt: '2026-07-28',
        files: [
          {
            fileName: 'notice.pdf',
            fileKey: 'notice-key.pdf',
          },
        ],
      }),
    })
  })

  await page.goto('/notices/list/7')

  await expect(page.getByLabel('제목')).toHaveValue('API 상세 공지')
  await expect(page.getByLabel('내용')).toHaveValue(
    'API에서 조회한 공지사항 내용입니다.',
  )
  await expect(page.getByRole('radio', { name: '공지사항 분류' })).toBeChecked()
  await expect(
    page.getByRole('group', { name: '첨부파일' }).getByText('notice.pdf'),
  ).toBeVisible()
  expect(requestURLs).toHaveLength(1)
  expect(new URL(requestURLs[0]).pathname).toBe('/api/notice/7')
})

test('S2: HTTP 404는 기존 복구 UI로 표시한다', async ({ page }) => {
  await page.route(detailApiPath, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '존재하지 않는 공지사항입니다.',
        status: 404,
        timestamp: '2026-07-28T12:00:00',
        description: '에러 설명',
      }),
    })
  })

  await page.goto('/notices/list/999')

  await expect(
    page.getByRole('heading', { name: '공지사항을 찾을 수 없습니다.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: '공지사항 목록으로 돌아가기' }),
  ).toHaveAttribute('href', '/notices/list')
})

test('S3: 서버 오류를 not-found나 mock으로 숨기지 않는다', async ({ page }) => {
  await page.route(detailApiPath, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '예상하지 못한 에러가 발생했습니다.',
        status: 500,
        timestamp: '2026-07-28T12:00:00',
        description: '에러 설명',
      }),
    })
  })

  await page.goto('/notices/list/7')

  await expect(page.getByRole('alert')).toContainText(
    '공지사항을 불러오지 못했습니다.',
  )
  await expect(page.getByRole('alert')).toContainText('다시 시도해 주세요.')
  await expect(
    page.getByRole('heading', { name: '공지사항을 찾을 수 없습니다.' }),
  ).toHaveCount(0)
})

test('S4: 잘못된 route ID는 API를 호출하지 않는다', async ({ page }) => {
  let requestCount = 0
  await page.route(detailApiPath, async (route) => {
    requestCount += 1
    await route.abort()
  })

  await page.goto('/notices/list/not-a-number')

  await expect(
    page.getByRole('heading', { name: '공지사항을 찾을 수 없습니다.' }),
  ).toBeVisible()
  expect(requestCount).toBe(0)
})
