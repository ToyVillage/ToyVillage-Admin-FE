import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(documents-query.test-scenarios.md: S1~S3)를 mock 으로 변환한 것.
// 대상: GET /documents/{id}. 상세 진입 시 조회되므로 goto 전에 route 를 건다.
// 실제 서버는 호출하지 않는다.

const detail = {
  id: 7,
  title: '상세 자료 제목',
  type: 'PDF',
  createdAt: '2026-06-30T10:00:00.000',
  files: [
    { fileName: '문서.pdf', fileKey: 'key-1' },
    { fileName: '안내.png', fileKey: 'key-2' },
  ],
}

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-02-06T19:56:53.62201',
  description: '에러 설명',
})

async function routeDetail(page: Page, status: number, body: unknown) {
  await page.route('**/documents/*', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

test('S1: 상세 조회 성공 → 편집 폼에 제목·첨부 표시', async ({ page }) => {
  await routeDetail(page, 201, detail)
  await page.goto('/notices/resources/7')

  await expect(page.getByLabel(/제목/)).toHaveValue('상세 자료 제목')
  await expect(page.getByText('문서.pdf')).toBeVisible()
  await expect(page.getByText('안내.png')).toBeVisible()
})

test('S2: 404 → 별도 안내 화면 없이 빈 폼 유지', async ({ page }) => {
  // 디자인에 없는 '자료를 찾을 수 없습니다' 화면은 두지 않는다.
  await routeDetail(page, 404, errorBody(404, '존재하지 않는 자료입니다.'))
  await page.goto('/notices/resources/999')

  await expect(page.getByText('자료를 찾을 수 없습니다')).toHaveCount(0)
  await expect(page.getByLabel(/제목/)).toHaveValue('')
})

test('S3: 500 → 별도 안내 화면 없이 빈 폼 유지', async ({ page }) => {
  await routeDetail(page, 500, errorBody(500, '예상하지 못한 에러가 발생했습니다.'))
  await page.goto('/notices/resources/7')

  await expect(page.getByText('자료를 찾을 수 없습니다')).toHaveCount(0)
  await expect(page.getByLabel(/제목/)).toHaveValue('')
})
