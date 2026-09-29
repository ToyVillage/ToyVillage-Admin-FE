import { expect, test, type Page } from '@playwright/test'
import {
  animalItemPattern,
  errorBody,
  json,
  mockAnimalManageApi,
} from '../support/animal-manage-api'

// 승인된 시나리오(animal-manage-query.test-scenarios.md)를 변환한 것.
// 종·관찰 조회는 `support/animal-manage-api` 가짜 서버가 받고, 개체 상세 응답만 각 시나리오가 덮어쓴다.

const detailUrl = '/species/1/individuals/12'
const successBody = {
  animalManageId: 12,
  animalName: '무궁이',
  animalGender: 'WOMAN',
  birthYear: 2021,
  otherInfo: '온순한 성격',
  animalImage: { fileName: 'mugung.png', fileKey: 'animal/mugung.png' },
  animalKindId: 1,
  kindName: '사막여우',
  scientificName: 'Vulpes zerda',
  animalTaxonomic: 'MAMMALS',
  detailKind: '식육목 - 개과',
  legalStatuses: ['멸종위기 야생생물 II급'],
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-manage-query-test-token')
  })
  await mockAnimalManageApi(page)
})

test('S1: 개체 상세 진입 시 한 번 조회해 프로필 카드에 표시한다', async ({
  page,
}) => {
  const requests = await mockDetail(page, () => [200, successBody])
  await page.goto(detailUrl)

  await expect(page.getByRole('img', { name: '무궁이 사진' })).toHaveAttribute(
    'src',
    'https://cdn.e2e.invalid/animal%2Fmugung.png',
  )
  expect(requests).toHaveLength(1)
  expect(requests[0].url.pathname).toBe('/animal-manage/12')
  expect(requests[0].authorization).toMatch(/^Bearer /)
  const card = page.locator('section').filter({ hasText: '기타정보' })
  await expect(card).toContainText('무궁이')
  await expect(card).toContainText('암컷')
  await expect(card).toContainText('2021년')
  await expect(card).toContainText('온순한 성격')
})

test('S2: 기타정보가 비면 — 로 표시한다', async ({ page }) => {
  await mockDetail(page, () => [200, { ...successBody, otherInfo: '' }])
  await page.goto(detailUrl)

  await expect(
    page.locator('section').filter({ hasText: '기타정보' }),
  ).toContainText('—')
})

test('S3: 응답 전에는 불러오는 중 문구다', async ({ page }) => {
  let release: () => void = () => {}
  const released = new Promise<void>((resolve) => (release = resolve))
  await page.route(animalItemPattern, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await released
    await json(route, 200, successBody)
  })
  await page.goto(detailUrl)

  await expect(page.getByText('개체를 불러오는 중입니다.')).toBeVisible()
  release()
  await expect(page.getByRole('img', { name: '무궁이 사진' })).toBeVisible()
})

test('S4: HTTP 404 이면 찾을 수 없음 상태다', async ({ page }) => {
  await mockDetail(page, () => [
    404,
    errorBody(404, '존재하지 않는 개체입니다.'),
  ])
  await page.goto(detailUrl)

  await expect(page.getByText('개체를 찾을 수 없습니다.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: '종 상세로 돌아가기' }),
  ).toBeVisible()
})

test('S5: 다른 종 소속 개체는 찾을 수 없음 상태다', async ({ page }) => {
  await mockDetail(page, () => [200, { ...successBody, animalKindId: 2 }])
  await page.goto(detailUrl)

  await expect(page.getByText('개체를 찾을 수 없습니다.')).toBeVisible()
})

test('S6: HTTP 500 이면 조회 오류 상태다', async ({ page }) => {
  await mockDetail(page, () => [
    500,
    errorBody(500, '내부 서버 오류가 발생했습니다.'),
  ])
  await page.goto(detailUrl)

  await expectDetailError(page)
})

test('S7: HTTP 401 이면 공통 인증 처리로 로그인으로 간다', async ({ page }) => {
  await mockDetail(page, () => [401, errorBody(401, '만료된 토큰입니다.')])
  await page.goto(detailUrl)

  await expect(page).toHaveURL(/\/login$/)
})

test('S8: 수정 화면 초기값이 응답과 같다', async ({ page }) => {
  await mockDetail(page, () => [200, successBody])
  await page.goto(`${detailUrl}/edit`)

  await expect(
    page.getByRole('textbox', { name: '개체명', exact: true }),
  ).toHaveValue('무궁이')
  await expect(
    page.getByRole('radio', { name: '암컷', exact: true }),
  ).toBeChecked()
  await expect(
    page.getByRole('textbox', { name: '출생연도', exact: true }),
  ).toHaveValue('2021')
  await expect(
    page.getByRole('textbox', { name: '기타정보', exact: true }),
  ).toHaveValue('온순한 성격')
  await expect(page.getByText('mugung.png', { exact: true })).toBeVisible()
})

test('S9: 케밥 수정으로 가도 상세를 다시 조회하지 않는다', async ({ page }) => {
  const requests = await mockDetail(page, () => [200, successBody])
  await page.goto(detailUrl)
  await expect(page.getByRole('img', { name: '무궁이 사진' })).toBeVisible()

  await page.getByRole('button', { name: '무궁이 개체 메뉴 열기' }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/12\/edit$/)
  await expect(
    page.getByRole('textbox', { name: '개체명', exact: true }),
  ).toHaveValue('무궁이')
  expect(requests).toHaveLength(1)
})

test('S10: Contract 밖 응답은 조회 오류 상태다', async ({ page }) => {
  await mockDetail(page, () => [200, { animalManageId: 12 }])
  await page.goto(detailUrl)

  await expectDetailError(page)
})

async function mockDetail(page: Page, respond: () => [number, unknown]) {
  const requests: { url: URL; authorization: string | undefined }[] = []
  await page.route(animalItemPattern, async (route) => {
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

async function expectDetailError(page: Page) {
  await expect(page.getByRole('alert')).toContainText(
    '개체를 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByText('개체를 찾을 수 없습니다.')).toHaveCount(0)
}
