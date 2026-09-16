import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { mockTaskApi } from './support/task-api'
import { mockWorkReportApi } from './support/task-report-api'

// #71 회귀: 조회 화면의 첨부 다운로드는 파일 서버(VITE_FILE_BASE_URL)에서 fileKey 로
// 원본을 받아 원래 파일명으로 저장한다. 요청이 API 서버나 앱 오리진으로 새면 안 되므로
// 오리진까지 확인한다. 기본값은 playwright.config.ts 의 webServer env 와 같고,
// 로컬 dev 서버를 재사용할 때는 그 서버의 VITE_FILE_BASE_URL 을 같은 이름으로 넘긴다.
const fileServerOrigin = new URL(
  process.env.VITE_FILE_BASE_URL ?? 'https://cdn.e2e.invalid',
).origin

const taskFileKey = '2026/07/01/guide_a1b2c3.pdf'
const reportFileKey = 'work-report/2026/07/notice.png'
const fileBody = Buffer.from('%PDF-1.4 original file body')

interface FileServerRequest {
  origin: string
  path: string
  authorization?: string
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'attachment-download-test-token')
  })
})

test('업무 상세: 파일 서버의 원본을 원래 파일명으로 내려받는다', async ({
  page,
}) => {
  await mockTaskApi(page)
  const requests = await mockFileServer(page, 200)
  await page.goto('/tasks/1')

  const downloadPromise = page.waitForEvent('download')
  await downloadButton(page, '당일 지침.pdf').click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('당일 지침.pdf')
  expect(await readFile(await download.path())).toEqual(fileBody)
  // 토큰은 파일 서버로 보내지 않는다.
  expect(requests).toEqual([
    {
      origin: fileServerOrigin,
      path: `/${encodeURIComponent(taskFileKey)}`,
      authorization: undefined,
    },
  ])
})

test('업무 상세: 파일 서버가 403 이면 로그아웃하지 않고 토스트로 알린다', async ({
  page,
}) => {
  await mockTaskApi(page)
  await mockFileServer(page, 403)
  await page.goto('/tasks/1')

  const downloads = countDownloads(page)
  await downloadButton(page, '당일 지침.pdf').click()

  await expect(downloadErrorToast(page)).toBeVisible()
  expect(downloads.count).toBe(0)
  // 파일 서버 403 은 세션 만료가 아니다. 상세 화면에 머문다.
  await expect(page).toHaveURL(/\/tasks\/1$/)
})

test('업무 수정: 기존 첨부도 파일 서버의 원본을 내려받는다', async ({ page }) => {
  await mockTaskApi(page)
  const requests = await mockFileServer(page, 200)
  await page.goto('/tasks/1/edit')

  const downloadPromise = page.waitForEvent('download')
  await page
    .getByRole('group', { name: '첨부파일' })
    .getByRole('button', { name: '당일 지침.pdf 다운로드' })
    .click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('당일 지침.pdf')
  expect(await readFile(await download.path())).toEqual(fileBody)
  expect(requests).toEqual([
    {
      origin: fileServerOrigin,
      path: `/${encodeURIComponent(taskFileKey)}`,
      authorization: undefined,
    },
  ])
})

test('업무보고 상세: 파일 서버의 원본을 원래 파일명으로 내려받는다', async ({
  page,
}) => {
  await mockWorkReportApi(page)
  const requests = await mockFileServer(page, 200)
  await page.goto('/task-reports/1')

  const downloadPromise = page.waitForEvent('download')
  await downloadButton(page, '휴관안내.png').click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('휴관안내.png')
  expect(await readFile(await download.path())).toEqual(fileBody)
  expect(requests).toEqual([
    {
      origin: fileServerOrigin,
      path: `/${encodeURIComponent(reportFileKey)}`,
      authorization: undefined,
    },
  ])
})

test('업무보고 상세: 파일 서버가 403 이면 로그아웃하지 않고 토스트로 알린다', async ({
  page,
}) => {
  await mockWorkReportApi(page)
  await mockFileServer(page, 403)
  await page.goto('/task-reports/1')

  const downloads = countDownloads(page)
  await downloadButton(page, '휴관안내.png').click()

  await expect(downloadErrorToast(page)).toBeVisible()
  expect(downloads.count).toBe(0)
  await expect(page).toHaveURL(/\/task-reports\/1$/)
})

async function mockFileServer(page: Page, status: number) {
  const requests: FileServerRequest[] = []
  const filePaths = [taskFileKey, reportFileKey].map(
    (fileKey) => `/${encodeURIComponent(fileKey)}`,
  )

  await page.route(
    (url) => url.origin === fileServerOrigin && filePaths.includes(url.pathname),
    async (route) => {
      const requestUrl = new URL(route.request().url())
      requests.push({
        origin: requestUrl.origin,
        path: requestUrl.pathname,
        authorization: route.request().headers().authorization,
      })
      await route.fulfill({
        status,
        headers: { 'access-control-allow-origin': '*' },
        contentType: 'application/octet-stream',
        body: status === 200 ? fileBody : 'Forbidden',
      })
    },
  )

  return requests
}

function countDownloads(page: Page) {
  const downloads = { count: 0 }
  page.on('download', () => {
    downloads.count += 1
  })
  return downloads
}

function downloadButton(page: Page, fileName: string) {
  return page
    .getByRole('group', { name: '첨부자료' })
    .getByRole('button', { name: `${fileName} 다운로드` })
}

function downloadErrorToast(page: Page) {
  return page
    .getByRole('alert')
    .filter({ hasText: '파일 다운로드에 실패했습니다' })
}
