import { expect, test, type Page, type Route } from '@playwright/test'

const fileApiPath = /\/api\/file(?:\?.*)?$/
const noticeApiPath = /\/api\/notice(?:\?.*)?$/

test('S1: 파일 하나를 multipart로 업로드하고 key를 공지 생성에 전달한다', async ({
  page,
}) => {
  let uploadRequestCount = 0
  let uploadRequestBody = ''
  let uploadRequestHeaders: Record<string, string> = {}
  let noticeRequestBody: unknown

  await page.route(fileApiPath, async (route) => {
    const request = route.request()
    uploadRequestCount += 1
    uploadRequestBody = request.postData() ?? ''
    uploadRequestHeaders = request.headers()
    await fulfillUpload(route, 'notice-key.pdf')
  })
  await page.route(noticeApiPath, async (route) => {
    if (route.request().method() === 'POST') {
      noticeRequestBody = route.request().postDataJSON()
      await fulfillNoticeCreate(route)
      return
    }

    await fulfillNoticeList(route, '첨부 공지')
  })

  await page.goto('/notices/list/create')
  await fillNotice(page, '첨부 공지', '첨부 내용')
  await uploadFiles(page, [
    {
      name: 'notice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('pdf-content'),
    },
  ])
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/notices\/list$/)
  expect(uploadRequestCount).toBe(1)
  expect(uploadRequestHeaders['content-type']).toContain('multipart/form-data')
  expect(uploadRequestHeaders.authorization).toMatch(/^Bearer /)
  expect(uploadRequestBody).toContain('name="files"')
  expect(uploadRequestBody).toContain('filename="notice.pdf"')
  expect(noticeRequestBody).toEqual({
    title: '첨부 공지',
    kind: 'ALL',
    content: '첨부 내용',
    files: ['notice-key.pdf'],
  })
})

test('S2: 여러 파일을 요청당 하나씩 순서대로 업로드한다', async ({ page }) => {
  const uploadBodies: string[] = []
  let noticeRequestBody: unknown

  await page.route(fileApiPath, async (route) => {
    uploadBodies.push(route.request().postData() ?? '')
    await fulfillUpload(route, `file-key-${uploadBodies.length}`)
  })
  await page.route(noticeApiPath, async (route) => {
    if (route.request().method() === 'POST') {
      noticeRequestBody = route.request().postDataJSON()
      await fulfillNoticeCreate(route)
      return
    }

    await fulfillNoticeList(route, '다중 첨부 공지')
  })

  await page.goto('/notices/list/create')
  await fillNotice(page, '다중 첨부 공지', '다중 첨부 내용')
  await uploadFiles(page, [
    {
      name: 'first.png',
      mimeType: 'image/png',
      buffer: Buffer.from('first'),
    },
    {
      name: 'second.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('second'),
    },
  ])
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/notices\/list$/)
  expect(uploadBodies).toHaveLength(2)
  expect(uploadBodies[0]).toContain('filename="first.png"')
  expect(uploadBodies[0].match(/name="files"/g)).toHaveLength(1)
  expect(uploadBodies[1]).toContain('filename="second.jpg"')
  expect(uploadBodies[1].match(/name="files"/g)).toHaveLength(1)
  expect(noticeRequestBody).toEqual({
    title: '다중 첨부 공지',
    kind: 'ALL',
    content: '다중 첨부 내용',
    files: ['file-key-1', 'file-key-2'],
  })
})

test('S3: 파일 업로드가 실패하면 공지 생성 요청을 보내지 않는다', async ({
  page,
}) => {
  let noticeCreateRequestCount = 0

  await page.route(fileApiPath, async (route) => {
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
  await page.route(noticeApiPath, async (route) => {
    if (route.request().method() === 'POST') {
      noticeCreateRequestCount += 1
    }
    await route.abort()
  })

  await page.goto('/notices/list/create')
  await fillNotice(page, '업로드 실패 공지', '업로드 실패 내용')
  await uploadFiles(page, [
    {
      name: 'failure.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('failure'),
    },
  ])
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page, '업로드 실패 공지', '업로드 실패 내용')
  expect(noticeCreateRequestCount).toBe(0)
})

test('S4: 성공 응답 형식이 Contract와 다르면 공지를 생성하지 않는다', async ({
  page,
}) => {
  let noticeCreateRequestCount = 0

  await page.route(fileApiPath, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ key: 123 }),
    })
  })
  await page.route(noticeApiPath, async (route) => {
    if (route.request().method() === 'POST') {
      noticeCreateRequestCount += 1
    }
    await route.abort()
  })

  await page.goto('/notices/list/create')
  await fillNotice(page, '응답 오류 공지', '응답 오류 내용')
  await uploadFiles(page, [
    {
      name: 'invalid.png',
      mimeType: 'image/png',
      buffer: Buffer.from('invalid'),
    },
  ])
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page, '응답 오류 공지', '응답 오류 내용')
  expect(noticeCreateRequestCount).toBe(0)
})

test('S5: 50MB를 초과한 파일은 API 요청 전에 거부한다', async ({ page }) => {
  let uploadRequestCount = 0

  await page.route(fileApiPath, async (route) => {
    uploadRequestCount += 1
    await route.abort()
  })

  await page.goto('/notices/list/create')
  await uploadFiles(page, [
    {
      name: 'oversized.bin',
      mimeType: 'application/octet-stream',
      buffer: Buffer.alloc(50 * 1024 * 1024 + 1),
    },
  ])

  await expect(page.getByRole('alert')).toContainText(
    'oversized.bin은 50MB를 초과해 첨부할 수 없습니다.',
  )
  expect(uploadRequestCount).toBe(0)
})

test('S6: 업로드 중 연속 submit에도 파일과 공지를 한 번만 생성한다', async ({
  page,
}) => {
  let uploadRequestCount = 0
  let noticeCreateRequestCount = 0
  let releaseUpload: (() => void) | undefined
  const uploadGate = new Promise<void>((resolve) => {
    releaseUpload = resolve
  })

  await page.route(fileApiPath, async (route) => {
    uploadRequestCount += 1
    await uploadGate
    await fulfillUpload(route, 'single-key.pdf')
  })
  await page.route(noticeApiPath, async (route) => {
    if (route.request().method() === 'POST') {
      noticeCreateRequestCount += 1
      await fulfillNoticeCreate(route)
      return
    }

    await fulfillNoticeList(route, '중복 방지 첨부 공지')
  })

  await page.goto('/notices/list/create')
  await fillNotice(page, '중복 방지 첨부 공지', '중복 방지 첨부 내용')
  await uploadFiles(page, [
    {
      name: 'single.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('single'),
    },
  ])
  await page.getByRole('button', { name: '생성하기' }).evaluate((button) => {
    const form = button.closest('form')
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
  })

  await expect.poll(() => uploadRequestCount).toBe(1)
  releaseUpload?.()

  await expect(page).toHaveURL(/\/notices\/list$/)
  expect(uploadRequestCount).toBe(1)
  expect(noticeCreateRequestCount).toBe(1)
})

async function uploadFiles(
  page: Page,
  files: Array<{ name: string; mimeType: string; buffer: Buffer }>,
) {
  await page.getByLabel('첨부파일 선택').setInputFiles(files)
}

async function fillNotice(page: Page, title: string, content: string) {
  await page.getByLabel(/제목/).fill(title)
  await page.getByLabel(/내용/).fill(content)
}

async function expectCreateFailure(page: Page, title: string, content: string) {
  await expect(page).toHaveURL(/\/notices\/list\/create$/)
  await expect(page.getByLabel(/제목/)).toHaveValue(title)
  await expect(page.getByLabel(/내용/)).toHaveValue(content)
  await expect(
    page.getByText('생성하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '생성하기' })).toBeEnabled()
}

async function fulfillUpload(route: Route, key: string) {
  await route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({ key, fileUrl: `/files/${key}` }),
  })
}

async function fulfillNoticeCreate(route: Route) {
  await route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify({ message: '공지 생성 성공' }),
  })
}

async function fulfillNoticeList(route: Route, title: string) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      {
        id: 7,
        title,
        kind: '공지사항 분류',
        createAt: '2026-07-28',
      },
    ]),
  })
}
