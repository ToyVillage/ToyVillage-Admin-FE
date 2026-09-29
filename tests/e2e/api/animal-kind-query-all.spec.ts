import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  json,
  kindListPattern,
  mockAnimalManageApi,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'

// 승인된 시나리오(animal-kind-query-all.test-scenarios.md)를 변환한 것.
// 주변 API 는 `support/animal-manage-api` 가짜 서버가 받고, 종 목록 응답만 각 시나리오가 덮어쓴다.

const kinds = [
  {
    animalKindId: 1,
    animalTaxonomic: 'MAMMALS',
    kindName: '카피바라',
    scientificName: 'Hydrochoerus hydrochaeris',
    animalCount: 4,
    kindImage: { fileName: 'capybara.png', fileKey: 'animal/capybara.png' },
  },
  {
    animalKindId: 2,
    animalTaxonomic: 'BIRDS',
    kindName: '플라밍고',
    scientificName: 'Phoenicopterus roseus',
    animalCount: 2,
    kindImage: { fileName: 'flamingo.png', fileKey: 'animal/flamingo.png' },
  },
  {
    animalKindId: 3,
    animalTaxonomic: 'FISH',
    kindName: '피라냐',
    scientificName: 'Pygocentrus nattereri',
    animalCount: 0,
    kindImage: { fileName: 'piranha.png', fileKey: 'animal/piranha.png' },
  },
]
const successBody = { animalKinds: kinds, totalPageSize: 2 }

interface ListRequest {
  url: URL
  authorization: string | undefined
}

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-kind-query-all-test-token')
  })
  api = await mockAnimalManageApi(page)
})

test('S1: 진입 시 첫 페이지를 page=1&size=10 으로 조회한다', async ({
  page,
}) => {
  const requests = await mockList(page, () => [200, successBody])
  await page.goto('/species')

  await expect(rows(page)).toHaveCount(3)
  expect(requests).toHaveLength(1)
  const { url, authorization } = requests[0]
  expect(url.pathname).toBe('/animal-manage/kind')
  expect(Object.fromEntries(url.searchParams)).toEqual({
    page: '1',
    size: '10',
  })
  expect(authorization).toMatch(/^Bearer /)
  await expect(rows(page).nth(0)).toContainText('포유류')
  await expect(rows(page).nth(0)).toContainText('카피바라')
  await expect(rows(page).nth(0)).toContainText('Hydrochoerus hydrochaeris')
  await expect(rows(page).nth(0)).toContainText('4')
  await expect(rows(page).nth(1)).toContainText('조류')
  await expect(rows(page).nth(2)).toContainText('어류')
  await expect(rows(page).nth(2)).toContainText('0')
  await expect(pageButton(page, 1)).toBeVisible()
  await expect(pageButton(page, 2)).toBeVisible()
  await expect(page.getByRole('button', { name: '종 정렬' })).toHaveCount(0)
})

test('S2: 분류군 탭이 animalTaxonomic query 로 전달된다', async ({ page }) => {
  const requests = await mockList(page, () => [200, successBody])
  await page.goto('/species')
  await expect(rows(page)).toHaveCount(3)
  await pageButton(page, 2).click()
  await expect.poll(() => requests.length).toBe(2)

  const tabs = [
    ['포유류', 'MAMMALS'],
    ['파충류', 'REPTILES'],
    ['조류', 'BIRDS'],
    ['어류', 'FISH'],
  ]
  for (const [label, value] of tabs) {
    const before = requests.length
    await tab(page, label).click()
    await expect.poll(() => requests.length).toBe(before + 1)
    const { searchParams } = requests.at(-1)!.url
    expect(searchParams.get('animalTaxonomic')).toBe(value)
    expect(searchParams.get('page')).toBe('1')
  }

  const before = requests.length
  await tab(page, '전체').click()
  await expect(rows(page)).toHaveCount(3)
  await page.waitForTimeout(300)
  expect(requests).toHaveLength(before)
})

test('S3: 검색어가 디바운스 후 keyword query 로 한 번 전달된다', async ({
  page,
}) => {
  const requests = await mockList(page, (url) =>
    url.searchParams.get('keyword')
      ? [200, { animalKinds: [kinds[0]], totalPageSize: 1 }]
      : [200, successBody],
  )
  await page.goto('/species')
  await expect(rows(page)).toHaveCount(3)
  await pageButton(page, 2).click()
  await expect.poll(() => requests.length).toBe(2)

  await searchBox(page).pressSequentially('무궁')

  await expect(rows(page)).toHaveCount(1)
  const keywordRequests = requests.filter(({ url }) =>
    url.searchParams.has('keyword'),
  )
  expect(keywordRequests).toHaveLength(1)
  expect(keywordRequests[0].url.searchParams.get('keyword')).toBe('무궁')
  expect(keywordRequests[0].url.searchParams.get('page')).toBe('1')
  expect(api.count('animal.list')).toBe(0)

  // 검색어를 지우면 keyword 없는 첫 조회 캐시로 돌아간다.
  await searchBox(page).fill('')
  await expect(rows(page)).toHaveCount(3)
})

test('S4: 화면 2페이지가 서버 page=2 이다', async ({ page }) => {
  const requests = await mockList(page, (url) =>
    url.searchParams.get('page') === '2'
      ? [200, { animalKinds: [kinds[1]], totalPageSize: 2 }]
      : [200, successBody],
  )
  await page.goto('/species')
  await expect(rows(page)).toHaveCount(3)

  await pageButton(page, 2).click()

  await expect(rows(page)).toHaveCount(1)
  expect(requests[1].url.searchParams.get('page')).toBe('2')
  await expect(pageButton(page, 1)).toBeVisible()
  await expect(pageButton(page, 2)).toBeVisible()
})

test('S5: 총 페이지 수는 totalPageSize 를 쓴다', async ({ page }) => {
  await mockList(page, () => [200, { animalKinds: kinds, totalPageSize: 3 }])
  await page.goto('/species')

  await expect(rows(page)).toHaveCount(3)
  await expect(pageButton(page, 3)).toBeVisible()
})

test('S6: 빈 목록은 빈 상태 안내다', async ({ page }) => {
  await mockList(page, () => [200, { animalKinds: [], totalPageSize: 0 }])
  await page.goto('/species')

  await expect(page.getByText('등록된 개체 카드가 없습니다')).toBeVisible()
  await expect(
    page.getByText('오른쪽 위 [종 등록하기]로 첫 개체 카드를 추가해주세요'),
  ).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /페이지$/ })).toHaveCount(0)
})

test('S7: 검색 결과 없음은 빈 상태와 구분된다', async ({ page }) => {
  const requests = await mockList(page, (url) =>
    url.searchParams.get('keyword')
      ? [200, { animalKinds: [], totalPageSize: 0 }]
      : [200, successBody],
  )
  await page.goto('/species')
  await expect(rows(page)).toHaveCount(3)

  await searchBox(page).fill('없는이름')

  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
  await expect(page.getByText('등록된 개체 카드가 없습니다')).toHaveCount(0)
  expect(requests.at(-1)!.url.searchParams.get('keyword')).toBe('없는이름')
})

test('S8: 응답 전에는 빈 상태·오류 문구가 없다', async ({ page }) => {
  let release: () => void = () => {}
  const released = new Promise<void>((resolve) => (release = resolve))
  await page.route(kindListPattern, async (route) => {
    await released
    await json(route, 200, successBody)
  })
  await page.goto('/species')

  await expect(page.getByRole('heading', { name: '개체 카드' })).toBeVisible()
  await expect(page.getByText('등록된 개체 카드가 없습니다')).toHaveCount(0)
  await expect(page.getByText('검색결과가 없습니다')).toHaveCount(0)
  await expect(page.getByRole('alert')).toHaveCount(0)

  release()
  await expect(rows(page)).toHaveCount(3)
})

for (const [id, status, message] of [
  ['S9', 400, '요청이 유효하지 않습니다.'],
  ['S12', 500, '내부 서버 오류가 발생했습니다.'],
] as const) {
  test(`${id}: HTTP ${status} 이면 오류 화면이다`, async ({ page }) => {
    await mockList(page, () => [status, errorBody(status, message)])
    await page.goto('/species')

    await expectListError(page)
  })
}

// 401(재발급 불가)·403 은 공통 인증 interceptor 가 세션을 끝내고 로그인으로 보낸다.
for (const [id, status, message] of [
  ['S10', 401, '만료된 토큰입니다.'],
  ['S11', 403, '접근할 수 있는 권한이 없습니다.'],
] as const) {
  test(`${id}: HTTP ${status} 이면 목록 대신 로그인으로 간다`, async ({
    page,
  }) => {
    await mockList(page, () => [status, errorBody(status, message)])
    await page.goto('/species')

    await expect(page).toHaveURL(/\/login$/)
    await expect(rows(page)).toHaveCount(0)
  })
}

test('S13: Contract 밖 응답은 오류 화면이다', async ({ page }) => {
  await mockList(page, () => [200, { species: [], total: 1 }])
  await page.goto('/species')

  await expectListError(page)
})

test('S14: 허용값 밖의 animalTaxonomic 은 오류 화면이다', async ({ page }) => {
  await mockList(page, () => [
    200,
    {
      animalKinds: [{ ...kinds[0], animalTaxonomic: 'MAMMAL' }],
      totalPageSize: 1,
    },
  ])
  await page.goto('/species')

  await expectListError(page)
})

test('S15: 개체 삭제 뒤 목록에 돌아오면 다시 조회한다', async ({ page }) => {
  await page.goto('/species')
  await expect(rows(page)).toHaveCount(10)
  await pageButton(page, 2).click()
  await expect(rows(page)).toHaveCount(3)
  const before = api.count('kind.list')

  await rows(page).filter({ hasText: '카피바라' }).click()
  await expect(page).toHaveURL(/\/species\/1$/)
  const trigger = page.getByRole('button', { name: '동식이 개체 메뉴 열기' })
  await trigger.click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/species$/)
  await expect.poll(() => api.count('kind.list')).toBeGreaterThan(before)
  await pageButton(page, 2).click()
  await expect(
    rows(page).filter({ hasText: '카피바라' }).locator(':scope > div').nth(3),
  ).toHaveText('2')
})

async function mockList(
  page: Page,
  respond: (url: URL) => [number, unknown],
): Promise<ListRequest[]> {
  const requests: ListRequest[] = []
  await page.route(kindListPattern, async (route) => {
    const request = route.request()
    if (request.method() !== 'GET') return route.fallback()

    const url = new URL(request.url())
    requests.push({ url, authorization: request.headers().authorization })
    const [status, body] = respond(url)
    await json(route, status, body)
  })
  return requests
}

async function expectListError(page: Page) {
  await expect(page.getByRole('alert')).toContainText(
    '종 목록을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByText('등록된 개체 카드가 없습니다')).toHaveCount(0)
}

function rows(page: Page) {
  return page.getByTestId('species-row')
}

function tab(page: Page, label: string) {
  return page.getByRole('button', { name: label, exact: true })
}

function searchBox(page: Page) {
  return page.getByRole('searchbox', { name: '종 검색' })
}

function pageButton(page: Page, pageNumber: number) {
  return page.getByRole('button', { name: `${pageNumber} 페이지` })
}
