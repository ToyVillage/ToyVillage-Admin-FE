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

test('S1: 삭제 성공(200) → DELETE 요청, 삭제된 id 재조회 없음, 목록 복귀', async ({
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
  await page.goto('/notices/resources/1')
  await openDeleteAndConfirm(page)

  await expect(page).toHaveURL(/\/notices\/resources$/)
  expect(deleteCalled).toBe(true)
  // 삭제 후 상세 쿼리를 무효화하지 않으므로 상세 GET 은 최초 1회뿐이어야 한다(404 방지).
  expect(detailGetCount).toBe(1)
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
