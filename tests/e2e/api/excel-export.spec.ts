import { readFile } from 'node:fs/promises'
import { expect, test, type Page, type Route } from '@playwright/test'

// 승인된 시나리오(excel-export.test-scenarios.md: S1~S10)를 mock 으로 변환한 것.
// 대상: GET /excel. 항목·기간·형식을 서버 값으로 보내고 받은 파일을 내려받는지 검증한다.
// 화면 주소 `/settings/excel-download`가 걸리지 않도록 경로 끝까지 맞춘다. 실제 서버는 호출하지 않는다.

const NOW = new Date('2026-10-20T12:00:00')
const url = '/settings/excel-download'
const excelApi = /\/excel(\?|$)/
const fileBody = Buffer.from('excel-export-test-file')
const defaultErrorMessage = '엑셀 파일 생성에 실패했습니다'
const successMessage = '엑셀 파일을 내려받았습니다'

const main = (page: Page) => page.getByRole('main')
const targetCard = (page: Page, name: string) =>
  main(page).getByText(name, { exact: true })
const target = (page: Page, name: string) =>
  page.getByRole('checkbox', { name, exact: true })
const downloadButton = (page: Page) =>
  page.getByRole('button', { name: '엑셀 다운로드' })

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-01-01T12:00:00',
  description: message,
})

function fulfillFile(route: Route) {
  return route.fulfill({
    status: 200,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    body: fileBody,
  })
}

function fulfillError(route: Route, status: number, message: string) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(errorBody(status, message)),
  })
}

// 요청 URL 을 모으고 파일로 응답한다.
async function routeFile(page: Page): Promise<URL[]> {
  const requests: URL[] = []
  await page.route(excelApi, async (route) => {
    requests.push(new URL(route.request().url()))
    await fulfillFile(route)
  })
  return requests
}

function countDownloads(page: Page) {
  const downloads = { count: 0 }
  page.on('download', () => {
    downloads.count += 1
  })
  return downloads
}

// 버튼을 눌러 받은 파일의 이름과 내용을 돌려준다.
async function clickAndDownload(page: Page) {
  const downloadPromise = page.waitForEvent('download')
  await downloadButton(page).click()
  const download = await downloadPromise
  return {
    fileName: download.suggestedFilename(),
    body: await readFile(await download.path()),
  }
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
})

test('S1: 항목 하나와 기간을 보내고 파일을 받는다', async ({ page }) => {
  const requests = await routeFile(page)
  await page.goto(url)
  await targetCard(page, '업무관리').click()

  const { fileName, body } = await clickAndDownload(page)

  expect(requests).toHaveLength(1)
  const { searchParams } = requests[0]
  expect(searchParams.getAll('types')).toEqual(['TASK'])
  expect(searchParams.get('mode')).toBe('SHEET')
  expect(searchParams.get('startDate')).toBe('2026-09-20')
  expect(searchParams.get('endDate')).toBe('2026-10-20')
  expect(fileName).toBe('업무관리_2026-09-20_2026-10-20.xlsx')
  expect(body).toEqual(fileBody)
  await expect(page.getByText(successMessage, { exact: true })).toBeVisible()
})

test('S2: 여러 항목은 화면 순서대로 보내고 통합 이름으로 받는다', async ({ page }) => {
  const requests = await routeFile(page)
  await page.goto(url)
  await targetCard(page, '5층 먹이 급여').click()
  await targetCard(page, '동물 리스트').click()

  const { fileName } = await clickAndDownload(page)

  expect(requests[0].searchParams.getAll('types')).toEqual([
    'ANIMAL',
    'FIFTH_FLOOR_FEED_LOG',
  ])
  expect(fileName).toBe('통합_2026-09-20_2026-10-20.xlsx')
})

test('S3: 전체 선택과 전체 기간 → 날짜 없이 보낸다', async ({ page }) => {
  const requests = await routeFile(page)
  await page.goto(url)
  await page.getByRole('checkbox', { name: '전체 선택' }).click()
  await page.getByRole('radio', { name: '전체 기간', exact: true }).click()

  const { fileName } = await clickAndDownload(page)

  const { searchParams } = requests[0]
  expect(searchParams.getAll('types')).toEqual([
    'ANIMAL',
    'ANIMAL_OBSERVATION',
    'FEED_LOG',
    'FIFTH_FLOOR_FEED_LOG',
    'TASK',
    'WORK_REPORT',
    'WORK_LOG',
    'RESERVATION',
    'NOTICE',
    'TEAM_MEMBER',
  ])
  expect(searchParams.has('startDate')).toBe(false)
  expect(searchParams.has('endDate')).toBe(false)
  expect(fileName).toBe('통합.xlsx')
})

test('S4: 압축 파일을 고르면 ZIP 으로 받는다', async ({ page }) => {
  const requests = await routeFile(page)
  await page.goto(url)
  await targetCard(page, '공지사항').click()
  await page.getByRole('radio', { name: '압축 파일 (.zip)' }).click()

  const { fileName } = await clickAndDownload(page)

  const { searchParams } = requests[0]
  expect(searchParams.getAll('types')).toEqual(['NOTICE'])
  expect(searchParams.get('mode')).toBe('ZIP')
  expect(searchParams.get('startDate')).toBe('2026-09-20')
  expect(searchParams.get('endDate')).toBe('2026-10-20')
  expect(fileName).toBe('공지사항_2026-09-20_2026-10-20.zip')
})

test('S5: 기간 미적용 항목만 고르면 파일 이름에 날짜가 없다', async ({ page }) => {
  const requests = await routeFile(page)
  await page.goto(url)
  await targetCard(page, '직원 계정 관리').click()

  const { fileName } = await clickAndDownload(page)

  const { searchParams } = requests[0]
  expect(searchParams.getAll('types')).toEqual(['TEAM_MEMBER'])
  expect(searchParams.get('mode')).toBe('SHEET')
  expect(searchParams.get('startDate')).toBe('2026-09-20')
  expect(searchParams.get('endDate')).toBe('2026-10-20')
  expect(fileName).toBe('직원 계정 관리.xlsx')

  await targetCard(page, '동물 리스트').click()
  const second = await clickAndDownload(page)

  expect(requests[1].searchParams.getAll('types')).toEqual([
    'ANIMAL',
    'TEAM_MEMBER',
  ])
  expect(second.fileName).toBe('통합.xlsx')
})

test('S6: 요청 중에는 버튼이 비활성이고 요청은 한 번만 간다', async ({ page }) => {
  let requestCount = 0
  let release = () => {}
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(excelApi, async (route) => {
    requestCount += 1
    await released
    await fulfillFile(route)
  })
  await page.goto(url)
  await targetCard(page, '업무관리').click()

  const downloadPromise = page.waitForEvent('download')
  await downloadButton(page).click({ clickCount: 2 })

  await expect(downloadButton(page)).toBeDisabled()
  await expect(downloadButton(page)).toHaveText('엑셀 다운로드')
  await expect.poll(() => requestCount).toBe(1)

  release()
  await downloadPromise

  await expect(downloadButton(page)).toBeEnabled()
  expect(requestCount).toBe(1)
})

for (const { id, purpose, message } of [
  {
    id: 'S7',
    purpose: '최대 건수 초과',
    message: '엑셀 내보내기 최대 건수를 초과했습니다.',
  },
  {
    id: 'S8',
    purpose: '첨부파일 용량 초과',
    message: '엑셀 내보내기 첨부파일 총용량을 초과했습니다.',
  },
]) {
  test(`${id}: ${purpose}(413) → 서버 문구 토스트, 선택 유지`, async ({ page }) => {
    await page.route(excelApi, (route) => fulfillError(route, 413, message))
    const downloads = countDownloads(page)
    await page.goto(url)
    await targetCard(page, '업무관리').click()

    await downloadButton(page).click()

    await expect(page.getByText(message, { exact: true })).toBeVisible()
    expect(downloads.count).toBe(0)
    await expect(target(page, '업무관리')).toBeChecked()
    await expect(
      page.getByRole('radio', { name: '최근 1개월', exact: true }),
    ).toBeChecked()
    await expect(downloadButton(page)).toBeEnabled()
  })
}

test('S9: 서버 오류(500) → 공통 문구 토스트, 다시 누르면 파일을 받는다', async ({
  page,
}) => {
  let requestCount = 0
  await page.route(excelApi, async (route) => {
    requestCount += 1
    if (requestCount === 1) {
      await fulfillError(route, 500, '내부 서버 오류가 발생했습니다.')
      return
    }
    await fulfillFile(route)
  })
  await page.goto(url)
  await targetCard(page, '업무관리').click()

  await downloadButton(page).click()

  await expect(
    page.getByText(defaultErrorMessage, { exact: true }),
  ).toBeVisible()
  await expect(downloadButton(page)).toBeEnabled()

  const { fileName } = await clickAndDownload(page)

  expect(fileName).toBe('업무관리_2026-09-20_2026-10-20.xlsx')
  expect(requestCount).toBe(2)
})

test('S10: 네트워크 실패 → 공통 문구 토스트, 버튼 다시 활성', async ({ page }) => {
  await page.route(excelApi, (route) => route.abort())
  const downloads = countDownloads(page)
  await page.goto(url)
  await targetCard(page, '업무관리').click()

  await downloadButton(page).click()

  await expect(
    page.getByText(defaultErrorMessage, { exact: true }),
  ).toBeVisible()
  expect(downloads.count).toBe(0)
  await expect(downloadButton(page)).toBeEnabled()
})
