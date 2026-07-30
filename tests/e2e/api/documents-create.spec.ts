import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(documents-create.test-scenarios.md: S1~S9)를 mock 으로 변환한 것.
// 생성 흐름: 첨부파일을 POST /file(FILE_CREATE)로 업로드해 fileKey 를 얻은 뒤
// POST /documents(DOCUMENTS_CREATE)로 등록한다. 두 엔드포인트를 함께 mock 한다.
// 실제 서버를 호출하지 않고 page.route() 로 응답을 제어한다.

const uploadedFileKey = 'uploaded-file-key-1'

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-02-06T19:56:53.62201',
  description: '에러 설명',
})

async function routeUpload(page: Page) {
  await page.route('**/file', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ fileKey: uploadedFileKey }),
    })
  })
}

async function fillValidForm(page: Page) {
  await page.getByLabel(/제목/).fill('연동 테스트 자료')
  await page.getByRole('radio', { name: 'pdf' }).check({ force: true })
  await page.setInputFiles('#resource-files', {
    name: '테스트.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('pdf'),
  })
}

async function routeStatus(page: Page, status: number, message: string) {
  await page.route('**/documents', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(errorBody(status, message)),
    })
  })
}

async function expectCreateFailureDialog(page: Page) {
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('생성에 실패했습니다')
  await expect(page).toHaveURL(/\/notices\/resources\/create$/)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/notices/resources/create')
  await routeUpload(page)
})

test('S1: 업로드 후 등록 성공(201) → 목록 복귀, files=업로드 key, enum 매핑 확인', async ({
  page,
}) => {
  let requestBody: { title?: string; type?: string; files?: unknown } = {}
  await page.route('**/documents', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    requestBody = route.request().postDataJSON()
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: '자료 등록 성공' }),
    })
  })

  await fillValidForm(page)
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/notices\/resources$/)
  expect(requestBody.title).toBe('연동 테스트 자료')
  expect(requestBody.type).toBe('PDF')
  expect(requestBody.files).toEqual([uploadedFileKey])
})

test('S2: 제목 미입력 → 요청 미발생 + 검증 다이얼로그', async ({ page }) => {
  let postCalled = false
  await page.route('**/documents', async (route) => {
    if (route.request().method() === 'POST') postCalled = true
    await route.fallback()
  })
  // 파일만 첨부(업로드)하고 제목은 비운다.
  await page.getByRole('radio', { name: 'pdf' }).check({ force: true })
  await page.setInputFiles('#resource-files', {
    name: '테스트.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('pdf'),
  })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page.getByRole('alertdialog')).toContainText(
    '제목을 입력해 주세요',
  )
  expect(postCalled).toBe(false)
  await expect(page).toHaveURL(/\/notices\/resources\/create$/)
})

test('S3: 파일 미첨부 → 요청 미발생 + 검증 다이얼로그', async ({ page }) => {
  let postCalled = false
  await page.route('**/documents', async (route) => {
    if (route.request().method() === 'POST') postCalled = true
    await route.fallback()
  })
  // 제목만 입력하고 파일은 첨부하지 않는다.
  await page.getByLabel(/제목/).fill('연동 테스트 자료')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page.getByRole('alertdialog')).toContainText(
    '이미지 또는 파일을 추가해주세요',
  )
  expect(postCalled).toBe(false)
  await expect(page).toHaveURL(/\/notices\/resources\/create$/)
})

test('S4: 유효 입력 + 서버 400 → 생성 실패 다이얼로그', async ({ page }) => {
  // 프론트 검증을 통과한 요청에 route로 400을 주입한다.
  await routeStatus(page, 400, '자료 제목은 비어있을 수 없습니다.')
  await fillValidForm(page)
  await page.getByRole('button', { name: '생성하기' }).click()
  await expectCreateFailureDialog(page)
})

test('S5: 401 만료된 토큰 → 생성 실패 다이얼로그', async ({ page }) => {
  await routeStatus(page, 401, '만료된 토큰입니다.')
  await fillValidForm(page)
  await page.getByRole('button', { name: '생성하기' }).click()
  await expectCreateFailureDialog(page)
})

test('S6: 404 존재하지 않는 파일 → 생성 실패 다이얼로그', async ({ page }) => {
  await routeStatus(page, 404, '존재하지 않는 파일입니다.')
  await fillValidForm(page)
  await page.getByRole('button', { name: '생성하기' }).click()
  await expectCreateFailureDialog(page)
})

test('S7: 500 서버 오류 → 생성 실패 다이얼로그', async ({ page }) => {
  await routeStatus(page, 500, '예상하지 못한 에러가 발생했습니다.')
  await fillValidForm(page)
  await page.getByRole('button', { name: '생성하기' }).click()
  await expectCreateFailureDialog(page)
})

test('S8~S9: 로딩 표시 + 중복 제출 시 등록 요청 1회', async ({ page }) => {
  let requestCount = 0
  await page.route('**/documents', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    requestCount += 1
    await new Promise((resolve) => setTimeout(resolve, 400))
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: '자료 등록 성공' }),
    })
  })

  await fillValidForm(page)
  const submit = page.getByRole('button', { name: /생성/ })
  await submit.click()
  await expect(submit).toBeDisabled()
  await expect(submit).toHaveText('생성 중')
  await submit.click({ force: true }).catch(() => undefined)

  await expect(page).toHaveURL(/\/notices\/resources$/)
  expect(requestCount).toBe(1)
})
