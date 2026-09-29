import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  json,
  mockAnimalManageApi,
  observationListPattern,
  storedFilePattern,
} from '../support/animal-manage-api'
import {
  observationAnimals,
  observationIndividualUrl,
} from '../support/observation-fixture'

// 승인된 시나리오(animal-observation-query-all.test-scenarios.md)를 변환한 것.
// 종·개체 조회는 `support/animal-manage-api` 가짜 서버가 받고, 관찰 목록 응답만 각 시나리오가 덮어쓴다.

const items = [
  {
    animalObservationId: 31,
    title: '식욕 감소',
    createdAt: '2026-09-16',
    authorName: '김사육',
    files: [{ fileName: 'memo.pdf', fileKey: 'obs/memo.pdf' }],
  },
  {
    animalObservationId: 30,
    title: '체중 측정',
    createdAt: '2026-09-15',
    authorName: '이사육',
    files: [],
  },
]
const successBody = {
  content: items,
  pageable: {
    pageNumber: 1,
    pageSize: 10,
    offset: 0,
    paged: true,
    unpaged: false,
  },
  totalPages: 2,
  totalElements: 12,
  size: 10,
  number: 1,
  first: true,
  last: false,
  numberOfElements: 2,
  empty: false,
}
const loadFailure = '관찰 기록을 불러오지 못했습니다. 다시 시도해 주세요.'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-observation-query-all-token')
  })
  await mockAnimalManageApi(page, { animals: observationAnimals() })
})

test('S1: 개체 상세 진입 시 관찰 목록을 page=1&size=10 으로 조회한다', async ({
  page,
}) => {
  const requests = await mockList(page, () => [200, successBody])
  await page.goto(observationIndividualUrl)

  await expect(rows(page)).toHaveCount(2)
  expect(requests).toHaveLength(1)
  expect(requests[0].url.pathname).toBe('/animal-manage/7/observations')
  expect(Object.fromEntries(requests[0].url.searchParams)).toEqual({
    page: '1',
    size: '10',
  })
  expect(requests[0].authorization).toMatch(/^Bearer /)
  await expect(rows(page).nth(0)).toContainText('식욕 감소')
  await expect(rows(page).nth(0)).toContainText('2026.09.16')
  await expect(rows(page).nth(0)).toContainText('김사육')
  await expect(rows(page).nth(0)).toContainText('memo.pdf')
  await expect(page.getByText('12건', { exact: true })).toBeVisible()
  await expect(pageButton(page, 1)).toBeVisible()
  await expect(pageButton(page, 2)).toBeVisible()
})

test('S2: 2페이지는 서버 page=2 이고 이동 중 이전 표를 유지한다', async ({
  page,
}) => {
  let release: () => void = () => {}
  const released = new Promise<void>((resolve) => (release = resolve))
  const requests = await mockList(page, (url) =>
    url.searchParams.get('page') === '2'
      ? [200, { ...successBody, content: [items[1]] }]
      : [200, successBody],
  )
  await page.route(observationListPattern, async (route) => {
    if (new URL(route.request().url()).searchParams.get('page') !== '2') {
      return route.fallback()
    }
    await released
    await route.fallback()
  })
  await page.goto(observationIndividualUrl)
  await expect(rows(page)).toHaveCount(2)

  await pageButton(page, 2).click()
  await expect(rows(page)).toHaveCount(2)
  release()

  await expect(rows(page)).toHaveCount(1)
  expect(requests.at(-1)!.url.searchParams.get('page')).toBe('2')
})

test('S3: 빈 목록은 빈 상태다', async ({ page }) => {
  await mockList(page, () => [
    200,
    {
      ...successBody,
      content: [],
      totalPages: 0,
      totalElements: 0,
      empty: true,
    },
  ])
  await page.goto(observationIndividualUrl)

  await expect(page.getByText('등록된 관찰 기록이 없습니다')).toBeVisible()
  await expect(page.getByText('0건', { exact: true })).toBeVisible()
  await expect(page.getByText(loadFailure)).toHaveCount(0)
})

test('S4: HTTP 404 이면 찾을 수 없는 개체다', async ({ page }) => {
  await mockList(page, () => [404, errorBody(404, '존재하지 않는 개체입니다.')])
  await page.goto(observationIndividualUrl)

  await expect(page.getByText('개체를 찾을 수 없습니다.')).toBeVisible()
})

test('S5: HTTP 500 이면 카드는 두고 관찰 섹션에 오류를 표시한다', async ({
  page,
}) => {
  await mockList(page, () => [
    500,
    errorBody(500, '내부 서버 오류가 발생했습니다.'),
  ])
  await page.goto(observationIndividualUrl)

  await expectSectionError(page)
})

test('S5: HTTP 403 이면 공통 인증 처리로 로그인으로 간다', async ({ page }) => {
  await mockList(page, () => [
    403,
    errorBody(403, '접근할 수 있는 권한이 없습니다.'),
  ])
  await page.goto(observationIndividualUrl)

  await expect(page).toHaveURL(/\/login$/)
})

test('S6: 응답 형식이 다르면 관찰 섹션 오류다', async ({ page }) => {
  await mockList(page, () => [200, { observations: [] }])
  await page.goto(observationIndividualUrl)

  await expectSectionError(page)
})

test('S7: 첨부를 누르면 파일 서버에서 받아 내려받는다', async ({ page }) => {
  await mockList(page, () => [200, successBody])
  const fileRequests: string[] = []
  await page.route(storedFilePattern, async (route) => {
    fileRequests.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      body: 'pdf',
    })
  })
  await page.goto(observationIndividualUrl)

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'memo.pdf 다운로드' }).click()

  expect((await download).suggestedFilename()).toBe('memo.pdf')
  // 프로필 사진 요청은 빼고 첨부 요청만 센다.
  expect(fileRequests.filter((url) => url.includes('obs%2F'))).toEqual([
    'https://cdn.e2e.invalid/obs%2Fmemo.pdf',
  ])
  await expect(page.getByText('파일 다운로드에 실패했습니다')).toHaveCount(0)
})

test('S8: 첨부 받기에 실패하면 알린다', async ({ page }) => {
  await mockList(page, () => [200, successBody])
  await page.route(storedFilePattern, (route) =>
    route.fulfill({ status: 404, body: '' }),
  )
  await page.goto(observationIndividualUrl)

  await page.getByRole('button', { name: 'memo.pdf 다운로드' }).click()

  await expect(page.getByText('파일 다운로드에 실패했습니다')).toBeVisible()
})

test('S9: 행을 누르면 관찰 상세로 간다', async ({ page }) => {
  await mockList(page, () => [200, successBody])
  await page.goto(observationIndividualUrl)

  await rows(page).nth(0).getByText('식욕 감소').click()

  await expect(page).toHaveURL(
    /\/species\/1\/individuals\/7\/observations\/31$/,
  )
})

async function mockList(page: Page, respond: (url: URL) => [number, unknown]) {
  const requests: { url: URL; authorization: string | undefined }[] = []
  await page.route(observationListPattern, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    requests.push({ url, authorization: request.headers().authorization })
    const [status, body] = respond(url)
    await json(route, status, body)
  })
  return requests
}

async function expectSectionError(page: Page) {
  await expect(page.getByRole('img', { name: '체리 사진' })).toBeVisible()
  await expect(page.getByText(loadFailure)).toBeVisible()
  await expect(page.getByText('등록된 관찰 기록이 없습니다')).toHaveCount(0)
}

function rows(page: Page) {
  return page.getByTestId('observation-row')
}

function pageButton(page: Page, pageNumber: number) {
  return page.getByRole('button', { name: `${pageNumber} 페이지` })
}
