import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  json,
  mockAnimalManageApi,
  observationItemPattern,
  storedFilePattern,
} from '../support/animal-manage-api'
import {
  observationAnimals,
  observationFixture,
  observationIndividualUrl,
} from '../support/observation-fixture'

// 승인된 시나리오(animal-observation-query.test-scenarios.md)를 변환한 것.
// 종·개체 조회는 `support/animal-manage-api` 가짜 서버가 받고, 관찰 상세 응답만 각 시나리오가 덮어쓴다.

const detailUrl = `${observationIndividualUrl}/observations/31`
const successBody = {
  animalObservationId: 31,
  title: '식욕 감소',
  content: '아침 급여량의\n절반만 먹음',
  createdAt: '2026-09-16',
  authorName: '김사육',
  files: [{ fileName: 'memo.pdf', fileKey: 'obs/memo.pdf' }],
}
const loadFailure = '관찰 기록을 불러오지 못했습니다. 다시 시도해 주세요.'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-observation-query-token')
  })
  await mockAnimalManageApi(page, {
    animals: observationAnimals(),
    observations: observationFixture(),
  })
})

test('S1: 관찰 상세를 한 번 조회해 표시한다', async ({ page }) => {
  const requests = await mockDetail(page, () => [200, successBody])
  await page.goto(detailUrl)

  await expect(page.getByRole('heading', { name: '식욕 감소' })).toBeVisible()
  expect(requests).toHaveLength(1)
  expect(requests[0].url.pathname).toBe('/animal-manage/7/observations/31')
  expect(requests[0].authorization).toMatch(/^Bearer /)
  await expect(page.getByText('2026.09.16')).toBeVisible()
  await expect(page.getByText('김사육')).toBeVisible()
  const content = page.getByText(/아침 급여량의\s+절반만 먹음/)
  await expect(content).toBeVisible()
  // 줄바꿈을 화면에서도 유지한다.
  await expect(content).toHaveCSS('white-space', /pre-wrap|pre-line/)
  await expect(
    page.getByRole('button', { name: 'memo.pdf 다운로드' }),
  ).toBeVisible()
})

test('S2: 첨부가 없으면 — 로 표시한다', async ({ page }) => {
  await mockDetail(page, () => [200, { ...successBody, files: [] }])
  await page.goto(detailUrl)

  await expect(
    page.locator('section').filter({ hasText: '첨부' }).last(),
  ).toContainText('—')
})

test('S3: HTTP 404 이면 찾을 수 없음 상태다', async ({ page }) => {
  await mockDetail(page, () => [
    404,
    errorBody(404, '존재하지 않는 관찰 기록입니다.'),
  ])
  await page.goto(detailUrl)

  await expect(page.getByText('관찰 기록을 찾을 수 없습니다.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: '개체 상세로 돌아가기' }),
  ).toBeVisible()
})

test('S4: HTTP 500 이면 조회 오류 상태다', async ({ page }) => {
  await mockDetail(page, () => [
    500,
    errorBody(500, '내부 서버 오류가 발생했습니다.'),
  ])
  await page.goto(detailUrl)

  await expectLoadError(page)
})

test('S4: HTTP 403 이면 공통 인증 처리로 로그인으로 간다', async ({ page }) => {
  await mockDetail(page, () => [
    403,
    errorBody(403, '접근할 수 있는 권한이 없습니다.'),
  ])
  await page.goto(detailUrl)

  await expect(page).toHaveURL(/\/login$/)
})

test('S5: 응답 형식이 다르면 조회 오류 상태다', async ({ page }) => {
  await mockDetail(page, () => [200, { id: 31 }])
  await page.goto(detailUrl)

  await expectLoadError(page)
})

test('S6: 첨부 다운로드 성공은 내려받고 실패는 알린다', async ({ page }) => {
  await mockDetail(page, () => [200, successBody])
  let fileStatus = 200
  await page.route(storedFilePattern, (route) =>
    route.fulfill({
      status: fileStatus,
      contentType: 'application/pdf',
      body: 'pdf',
    }),
  )
  await page.goto(detailUrl)
  const chip = page.getByRole('button', { name: 'memo.pdf 다운로드' })

  const download = page.waitForEvent('download')
  await chip.click()
  expect((await download).suggestedFilename()).toBe('memo.pdf')
  await expect(page.getByText('파일 다운로드에 실패했습니다')).toHaveCount(0)

  fileStatus = 404
  await chip.click()
  await expect(page.getByText('파일 다운로드에 실패했습니다')).toBeVisible()
})

test('S7: 수정 화면 초기값이 응답과 같다', async ({ page }) => {
  await mockDetail(page, () => [200, successBody])
  await page.goto(`${detailUrl}/edit`)

  await expect(page.getByRole('textbox', { name: '제목' })).toHaveValue(
    '식욕 감소',
  )
  await expect(page.getByRole('textbox', { name: '관찰사항' })).toHaveValue(
    '아침 급여량의\n절반만 먹음',
  )
  const date = page.getByRole('textbox', { name: '날짜' })
  await expect(date).toHaveValue('2026.09.16')
  await expect(date).toHaveAttribute('readonly', '')
  const observer = page.getByRole('textbox', { name: '관찰자' })
  await expect(observer).toHaveValue('김사육')
  await expect(observer).toHaveAttribute('readonly', '')
  await expect(page.getByText('memo.pdf', { exact: true })).toBeVisible()
})

async function mockDetail(page: Page, respond: () => [number, unknown]) {
  const requests: { url: URL; authorization: string | undefined }[] = []
  await page.route(observationItemPattern, async (route) => {
    const request = route.request()
    if (request.method() !== 'GET') return route.fallback()

    requests.push({
      url: new URL(request.url()),
      authorization: request.headers().authorization,
    })
    const [status, body] = respond()
    await json(route, status, body)
  })
  return requests
}

async function expectLoadError(page: Page) {
  await expect(page.getByRole('alert')).toContainText(loadFailure)
  await expect(page.getByText('관찰 기록을 찾을 수 없습니다.')).toHaveCount(0)
}
