import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(documents-update.test-scenarios.md: S1~S5)를 mock 으로 변환한 것.
// 상세(GET /documents/{id})로 편집 폼을 띄운 뒤 PUT /documents/{id}로 수정한다.
// 실제 서버는 호출하지 않는다.

const detail = {
  id: 1,
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

// GET 은 항상 상세를 반환하고, PUT 은 주어진 status/body 로 응답한다.
async function routePut(
  page: Page,
  put: { status: number; body: unknown; onBody?: (body: unknown) => void },
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
    if (method === 'PUT') {
      put.onBody?.(route.request().postDataJSON())
      await route.fulfill({
        status: put.status,
        contentType: 'application/json',
        body: JSON.stringify(put.body),
      })
      return
    }
    await route.fallback()
  })
}

test('S1: 수정 성공(201) → 기존 file key 재전송, 목록 복귀', async ({ page }) => {
  let putBody: { title?: string; type?: string; files?: unknown } = {}
  await routePut(page, {
    status: 201,
    body: { message: '자료 수정 성공' },
    onBody: (body) => {
      putBody = body as typeof putBody
    },
  })
  await page.goto('/notices/resources/1')

  await expect(page.getByLabel(/제목/)).toHaveValue('상세 자료 제목')
  await page.getByLabel(/제목/).fill('수정된 제목')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/notices\/resources$/)
  expect(putBody.title).toBe('수정된 제목')
  expect(putBody.type).toBe('PDF')
  expect(putBody.files).toEqual(['key-1', 'key-2'])
})

test('S2: 400 → 저장 실패 다이얼로그', async ({ page }) => {
  await routePut(page, {
    status: 400,
    body: errorBody(400, '자료 제목은 비어있을 수 없습니다.'),
  })
  await page.goto('/notices/resources/1')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByRole('alertdialog')).toContainText('저장에 실패')
  await expect(page).toHaveURL(/\/notices\/resources\/1$/)
})

test('S3: 404 → 저장 실패 다이얼로그', async ({ page }) => {
  await routePut(page, {
    status: 404,
    body: errorBody(404, '존재하지 않는 자료입니다.'),
  })
  await page.goto('/notices/resources/1')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByRole('alertdialog')).toContainText('저장에 실패')
})

test('S4: 500 → 저장 실패 다이얼로그', async ({ page }) => {
  await routePut(page, {
    status: 500,
    body: errorBody(500, '예상하지 못한 에러가 발생했습니다.'),
  })
  await page.goto('/notices/resources/1')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByRole('alertdialog')).toContainText('저장에 실패')
})
