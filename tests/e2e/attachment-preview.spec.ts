import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { createMockNotices, mockNoticeApi } from './support/notice-api'
import { mockTaskApi, mockTasks } from './support/task-api'
import { mockWorkReportApi } from './support/task-report-api'

// 승인된 시나리오(attachment-preview.approved.json: S1~S8)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 파일 서버(VITE_FILE_BASE_URL)는 page.route 로 흉내 낸다. 기본값은 playwright.config.ts 와 같다.
const fileServerOrigin = new URL(
  process.env.VITE_FILE_BASE_URL ?? 'https://cdn.e2e.invalid',
).origin

// 1x1 PNG
const pngBody = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)
const pdfBody = buildPdf(3)
const hwpBody = Buffer.from('hwp original body')

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'attachment-preview-test-token')
  })
})

test('S1: 이미지 미리보기', async ({ page }) => {
  await mockTaskApi(page)
  await mockFileServer(page, 200)
  await page.goto('/tasks/1')

  await previewButton(page, '휴관안내.png').click()

  const dialog = page.getByRole('dialog', { name: '휴관안내.png' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('img', { name: '휴관안내.png' })).toBeVisible()
})

test('S2: PDF 미리보기와 페이지 이동', async ({ page }) => {
  await mockTaskApi(page)
  await mockFileServer(page, 200)
  await page.goto('/tasks/1')

  await previewButton(page, '당일 지침.pdf').click()

  const dialog = page.getByRole('dialog', { name: '당일 지침.pdf' })
  const previous = dialog.getByRole('button', { name: '이전 페이지' })
  const next = dialog.getByRole('button', { name: '다음 페이지' })
  await expect(dialog.getByText('1 / 3')).toBeVisible()
  await expect(previous).toBeDisabled()

  await next.click()
  await next.click()
  await expect(dialog.getByText('3 / 3')).toBeVisible()
  await expect(next).toBeDisabled()

  await previous.click()
  await expect(dialog.getByText('2 / 3')).toBeVisible()
})

test('S3: 모달에서 내려받기', async ({ page }) => {
  await mockTaskApi(page)
  await mockFileServer(page, 200)
  await page.goto('/tasks/1')
  await previewButton(page, '휴관안내.png').click()
  const dialog = page.getByRole('dialog', { name: '휴관안내.png' })
  await expect(dialog.getByRole('img', { name: '휴관안내.png' })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await dialog.getByRole('button', { name: '다운로드' }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('휴관안내.png')
  expect(await readFile(await download.path())).toEqual(pngBody)
  await expect(dialog).toBeVisible()
})

test('S4: 모달 닫기 — 닫기 / Escape / 배경 클릭', async ({ page }) => {
  await mockTaskApi(page)
  await mockFileServer(page, 200)
  await page.goto('/tasks/1')
  const trigger = previewButton(page, '휴관안내.png')
  const dialog = page.getByRole('dialog', { name: '휴관안내.png' })

  await trigger.click()
  await dialog.getByRole('button', { name: '닫기' }).click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await expect(dialog).toBeVisible()
  // 모달 바깥(어두운 배경)의 왼쪽 위 모서리를 누른다.
  await page.mouse.click(5, 5)
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('S5: 공지사항·업무보고 상세에서도 열림', async ({ page }) => {
  await mockNoticeApi(page)
  await mockWorkReportApi(page)
  await mockFileServer(page, 200)

  await page.goto('/notices/list/1')
  await page.getByRole('button', { name: '휴관안내.png 미리보기' }).click()
  await expect(page.getByRole('dialog', { name: '휴관안내.png' })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.goto('/task-reports/1')
  await previewButton(page, '휴관안내.png').click()
  await expect(page.getByRole('dialog', { name: '휴관안내.png' })).toBeVisible()
})

test('S6: 미리보기 불가 형식은 바로 내려받기', async ({ page }) => {
  const tasks = mockTasks.map((task) =>
    task.id === 1
      ? {
          ...task,
          files: [{ fileName: '운영계획.hwp', fileKey: 'task/plan.hwp' }],
        }
      : { ...task },
  )
  await mockTaskApi(page, { tasks })
  await mockFileServer(page, 200)
  await page.goto('/tasks/1')

  const downloadPromise = page.waitForEvent('download')
  await page
    .getByRole('group', { name: '첨부자료' })
    .getByText('운영계획.hwp', { exact: true })
    .click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('운영계획.hwp')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('S7: 다운로드 아이콘은 그대로 (회귀)', async ({ page }) => {
  await mockTaskApi(page)
  await mockFileServer(page, 200)
  await page.goto('/tasks/1')

  const downloadPromise = page.waitForEvent('download')
  await page
    .getByRole('group', { name: '첨부자료' })
    .getByRole('button', { name: '휴관안내.png 다운로드' })
    .click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('휴관안내.png')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('S8: 파일 서버 실패', async ({ page }) => {
  await mockTaskApi(page)
  await mockFileServer(page, 403)
  await page.goto('/tasks/1')

  await previewButton(page, '휴관안내.png').click()

  const dialog = page.getByRole('dialog', { name: '휴관안내.png' })
  await expect(dialog.getByText('미리보기를 불러오지 못했습니다.')).toBeVisible()
  await expect(page).toHaveURL(/\/tasks\/1$/)
})

function previewButton(page: Page, fileName: string) {
  return page
    .getByRole('group', { name: '첨부자료' })
    .getByRole('button', { name: `${fileName} 미리보기` })
}

// 파일 서버는 확장자로 본문을 고른다. mock 의 fileKey 는 화면마다 달라 origin 만 맞춘다.
async function mockFileServer(page: Page, status: number) {
  // 공지 mock 의 fileKey(`notice-1-1`)에는 확장자가 없어 파일명 순서로 고른다.
  const noticeFiles = createMockNotices()[0].files

  await page.route(
    (url) => url.origin === fileServerOrigin,
    async (route) => {
      const fileKey = decodeURIComponent(
        new URL(route.request().url()).pathname.slice(1),
      )
      const fileName =
        noticeFiles.find((file) => file.fileKey === fileKey)?.fileName ??
        fileKey
      await route.fulfill({
        status,
        headers: { 'access-control-allow-origin': '*' },
        contentType: 'application/octet-stream',
        body: status === 200 ? bodyFor(fileName) : 'Forbidden',
      })
    },
  )
}

function bodyFor(fileName: string) {
  if (fileName.endsWith('.pdf')) return pdfBody
  if (fileName.endsWith('.hwp')) return hwpBody
  return pngBody
}

// 쪽마다 번호만 적힌 최소 PDF. xref 오프셋을 계산해 pdf.js 가 경고 없이 읽게 한다.
function buildPdf(pageCount: number) {
  const objects: string[] = []
  const pageIds = Array.from({ length: pageCount }, (_, index) => 3 + index * 2)
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`
  pageIds.forEach((id, index) => {
    const stream = `BT /F1 48 Tf 100 700 Td (${index + 1}) Tj ET`
    objects[id] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${id + 1} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>`
    objects[id + 1] =
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  })

  let body = '%PDF-1.4\n'
  const offsets: number[] = []
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = body.length
    body += `${id} 0 obj\n${objects[id]}\nendobj\n`
  }
  const xrefOffset = body.length
  body += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let id = 1; id < objects.length; id += 1) {
    body += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  }
  body += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(body, 'latin1')
}
