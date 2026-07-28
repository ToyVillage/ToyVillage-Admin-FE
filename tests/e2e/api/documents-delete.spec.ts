import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(documents-delete.test-scenarios.md: S1~S3)를 mock 으로 변환한 것.
// 상세(GET /documents/{id})로 편집 폼을 띄운 뒤 DELETE /documents/{id}로 삭제한다.
// 실제 서버는 호출하지 않는다.

const detail = {
  id: 1,
  title: '삭제할 자료',
  type: 'PDF',
  createdAt: '2026-06-30T10:00:00.000',
  files: [{ fileName: '문서.pdf', fileKey: 'key-1' }],
}

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-02-06T19:56:53.62201',
  description: '에러 설명',
})

async function routeDelete(
  page: Page,
  del: { status: number; body: unknown; onCalled?: () => void },
) {
  await page.route('**/documents/*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
      return
    }
    if (method === 'DELETE') {
      del.onCalled?.()
      await route.fulfill({
        status: del.status,
        contentType: 'application/json',
        body: JSON.stringify(del.body),
      })
      return
    }
    await route.fallback()
  })
}

async function openDeleteAndConfirm(page: Page) {
  await expect(page.getByLabel(/제목/)).toHaveValue('삭제할 자료')
  await page.getByRole('button', { name: '삭제하기' }).click()
  const dialog = page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '확인' }).click()
}

test('S1: 삭제 성공(200) → 목록 복귀, 재진입 시 캐시 없이 신규 요청', async ({
  page,
}) => {
  let deleteCalled = false
  let detailGetCount = 0
  await page.route('**/documents/*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      detailGetCount += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
      return
    }
    if (method === 'DELETE') {
      deleteCalled = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '자료 삭제 성공' }),
      })
      return
    }
    await route.fallback()
  })

  // 1. 상세 진입 → 데이터 도착 후 폼 표시 확인
  await page.goto('/notices/resources/1')
  await expect(page.getByLabel(/제목/)).toHaveValue('삭제할 자료')
  expect(detailGetCount).toBe(1)

  // 2. 삭제 → 목록 복귀, 삭제 직후 상세 재조회 없음
  await openDeleteAndConfirm(page)
  await expect(page).toHaveURL(/\/notices\/resources$/)
  expect(deleteCalled).toBe(true)
  expect(detailGetCount).toBe(1)

  // 3. 삭제된 id 로 상세 재진입 → gcTime:0 으로 캐시가 제거됨 → 신규 GET 발생(stale 없음)
  await page.goto('/notices/resources/1')
  await expect(page.getByLabel(/제목/)).toHaveValue('삭제할 자료')
  expect(detailGetCount).toBe(2)
})

test('S2: 404 존재하지 않는 자료 → 삭제 실패 다이얼로그', async ({ page }) => {
  await routeDelete(page, {
    status: 404,
    body: errorBody(404, '존재하지 않는 자료입니다.'),
  })
  await page.goto('/notices/resources/1')
  await openDeleteAndConfirm(page)

  await expect(page.getByRole('alertdialog')).toContainText('삭제에 실패')
})

test('S3: 500 → 삭제 실패 다이얼로그', async ({ page }) => {
  await routeDelete(page, {
    status: 500,
    body: errorBody(500, '예상하지 못한 에러가 발생했습니다.'),
  })
  await page.goto('/notices/resources/1')
  await openDeleteAndConfirm(page)

  await expect(page.getByRole('alertdialog')).toContainText('삭제에 실패')
})
