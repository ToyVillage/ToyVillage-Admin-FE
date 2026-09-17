import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  json,
  kindItemPattern,
  mockAnimalManageApi,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'

// 승인된 시나리오(animal-kind-query.test-scenarios.md)를 변환한 것.
// 주변 API 는 `support/animal-manage-api` 가짜 서버가 받고, 종 상세 응답만 각 시나리오가 덮어쓴다.

const successBody = {
  animalKindId: 1,
  kindName: '카피바라',
  engName: 'Capybara',
  scientificName: 'Hydrochoerus hydrochaeris',
  animalTaxonomic: 'MAMMALS',
  detailKind: '설치목 - 천축서과',
  legalStatuses: [{ animalLegalStatusId: 1, kind: '지정관리 야생동물' }],
  animalCount: 3,
  kindImage: { fileName: 'capybara.png', fileKey: 'animal/capybara.png' },
}

interface DetailRequest {
  url: URL
  authorization: string | undefined
}

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-kind-query-test-token')
  })
  api = await mockAnimalManageApi(page)
})

test('S1: 종 상세 진입 시 한 번 조회해 프로필 카드에 표시한다', async ({
  page,
}) => {
  const requests = await mockDetail(page, () => [200, successBody])
  await page.goto('/species/1')

  await expect(page.getByRole('heading', { name: '카피바라' })).toBeVisible()
  expect(requests).toHaveLength(1)
  expect(requests[0].url.pathname).toBe('/animal-manage/kind/1')
  expect(requests[0].url.search).toBe('')
  expect(requests[0].authorization).toMatch(/^Bearer /)
  await expect(page.getByText('Capybara', { exact: true })).toBeVisible()
  await expect(detailValue(page, '학명')).toHaveText(
    'Hydrochoerus hydrochaeris',
  )
  await expect(detailValue(page, '분류군')).toHaveText(
    '포유류 · 설치목 · 천축서과',
  )
  await expect(detailValue(page, '세부분류')).toHaveText('천축서과')
  await expect(detailValue(page, '법정지정분류')).toHaveText(
    '지정관리 야생동물',
  )
  await expect(
    page.getByRole('img', { name: '카피바라 사진' }),
  ).toHaveAttribute('src', 'https://cdn.e2e.invalid/animal%2Fcapybara.png')
})

test('S2: 법정지정분류가 없으면 빈 값 표기다', async ({ page }) => {
  await mockDetail(page, () => [200, { ...successBody, legalStatuses: [] }])
  await page.goto('/species/1')

  await expect(detailValue(page, '법정지정분류')).toHaveText('—')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('S3: 응답 전에는 불러오는 중 문구다', async ({ page }) => {
  let release: () => void = () => {}
  const released = new Promise<void>((resolve) => (release = resolve))
  await page.route(kindItemPattern, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await released
    await json(route, 200, successBody)
  })
  await page.goto('/species/1')

  await expect(page.getByText('종 정보를 불러오는 중입니다.')).toBeVisible()
  release()
  await expect(page.getByRole('heading', { name: '카피바라' })).toBeVisible()
})

test('S4: HTTP 404 이면 찾을 수 없음 상태다', async ({ page }) => {
  await mockDetail(page, () => [404, errorBody(404, '존재하지 않는 종입니다.')])
  await page.goto('/species/999')

  await expect(page.getByText('종을 찾을 수 없습니다.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: '목록으로 돌아가기' }),
  ).toBeVisible()
  await expect(
    page.getByText('종 정보를 불러오지 못했습니다. 다시 시도해 주세요.'),
  ).toHaveCount(0)
})

// 401(재발급 불가)·403 은 공통 인증 interceptor 가 세션을 끝내고 로그인으로 보낸다.
for (const [id, status, message] of [
  ['S5', 401, '만료된 토큰입니다.'],
  ['S6', 403, '접근할 수 있는 권한이 없습니다.'],
] as const) {
  test(`${id}: HTTP ${status} 이면 상세 대신 로그인으로 간다`, async ({
    page,
  }) => {
    await mockDetail(page, () => [status, errorBody(status, message)])
    await page.goto('/species/1')

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByText('종을 찾을 수 없습니다.')).toHaveCount(0)
  })
}

test('S7: HTTP 500 이면 조회 오류 상태다', async ({ page }) => {
  await mockDetail(page, () => [
    500,
    errorBody(500, '내부 서버 오류가 발생했습니다.'),
  ])
  await page.goto('/species/1')

  await expectDetailError(page)
})

test('S8: Contract 밖 응답은 조회 오류 상태다', async ({ page }) => {
  await mockDetail(page, () => [200, { id: 1, name: '카피바라' }])
  await page.goto('/species/1')

  await expectDetailError(page)
})

test('S9: 허용값 밖의 animalTaxonomic 은 조회 오류 상태다', async ({
  page,
}) => {
  await mockDetail(page, () => [
    200,
    { ...successBody, animalTaxonomic: 'MAMMAL' },
  ])
  await page.goto('/species/1')

  await expectDetailError(page)
})

test('S10: 종 수정 화면 초기값이 응답과 같다', async ({ page }) => {
  await mockDetail(page, () => [200, successBody])
  await page.goto('/species/1/edit')

  await expect(page.getByRole('textbox', { name: '국명' })).toHaveValue(
    '카피바라',
  )
  await expect(page.getByRole('textbox', { name: '영문명' })).toHaveValue(
    'Capybara',
  )
  await expect(page.getByRole('textbox', { name: '학명' })).toHaveValue(
    'Hydrochoerus hydrochaeris',
  )
  await expect(page.getByRole('radio', { name: '포유류' })).toBeChecked()
  await expect(page.getByRole('textbox', { name: '세부 분류' })).toHaveValue(
    '설치목 - 천축서과',
  )
  await expect(
    page.getByRole('button', { name: '지정관리 야생동물', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('S10: 종 수정 화면도 HTTP 404 는 찾을 수 없음 상태다', async ({
  page,
}) => {
  await mockDetail(page, () => [404, errorBody(404, '존재하지 않는 종입니다.')])
  await page.goto('/species/999/edit')

  await expect(page.getByText('종을 찾을 수 없습니다.')).toBeVisible()
})

test('S11: 개체 등록 화면 부제에 종 이름을 쓴다', async ({ page }) => {
  await mockDetail(page, () => [200, successBody])
  await page.goto('/species/1/individuals/create')

  await expect(
    page.getByText('카피바라에 개체를 한 마리씩 등록합니다'),
  ).toBeVisible()
})

test('S12: 상세에서 수정으로 가면 상세 캐시를 다시 쓴다', async ({ page }) => {
  const requests = await mockDetail(page, () => [200, successBody])
  await page.goto('/species/1')
  await expect(page.getByRole('heading', { name: '카피바라' })).toBeVisible()

  await page.getByRole('button', { name: '카피바라 종 메뉴 열기' }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(/\/species\/1\/edit$/)
  await expect(page.getByRole('textbox', { name: '국명' })).toHaveValue(
    '카피바라',
  )
  expect(requests).toHaveLength(1)
})

test('S13: 개체 삭제 뒤 종 상세를 다시 조회한다', async ({ page }) => {
  await page.goto('/species/1')
  await expect(page.getByRole('heading', { name: '카피바라' })).toBeVisible()
  const before = api.count('kind.detail')

  await page.getByRole('button', { name: '동식이 개체 메뉴 열기' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect.poll(() => api.count('kind.detail')).toBe(before + 1)
  await expect(page.getByText('2마리', { exact: true })).toBeVisible()
})

async function mockDetail(
  page: Page,
  respond: (url: URL) => [number, unknown],
): Promise<DetailRequest[]> {
  const requests: DetailRequest[] = []
  await page.route(kindItemPattern, async (route) => {
    const request = route.request()
    if (request.method() !== 'GET') return route.fallback()

    const url = new URL(request.url())
    requests.push({ url, authorization: request.headers().authorization })
    const [status, body] = respond(url)
    await json(route, status, body)
  })
  return requests
}

async function expectDetailError(page: Page) {
  await expect(page.getByRole('alert')).toContainText(
    '종 정보를 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByText('종을 찾을 수 없습니다.')).toHaveCount(0)
}

function detailValue(page: Page, label: string) {
  return page
    .locator('dl > div')
    .filter({
      has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }),
    })
    .locator('dd')
}
