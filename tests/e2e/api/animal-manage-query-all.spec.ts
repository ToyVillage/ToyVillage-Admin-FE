import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  json,
  kindAnimalsPattern,
  mockAnimalManageApi,
} from '../support/animal-manage-api'

// 승인된 시나리오(animal-manage-query-all.test-scenarios.md)를 변환한 것.
// 종 조회는 `support/animal-manage-api` 가짜 서버가 받고, 개체 목록 응답만 각 시나리오가 덮어쓴다.

type Item = {
  animalManageId: number
  animalName: string
  animalGender: string
  birthYear: number
}

const defaultItems: Item[] = [
  {
    animalManageId: 3,
    animalName: '두리',
    animalGender: 'MAN',
    birthYear: 2021,
  },
  {
    animalManageId: 2,
    animalName: '미미',
    animalGender: 'WOMAN',
    birthYear: 2020,
  },
  {
    animalManageId: 1,
    animalName: '동식이',
    animalGender: 'MAN',
    birthYear: 2019,
  },
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-manage-query-all-token')
  })
  await mockAnimalManageApi(page)
})

test('S1: 종 상세 진입 시 개체 목록을 page=1&size=10 으로 조회한다', async ({
  page,
}) => {
  const requests = await mockList(page, () => [200, pageBody(defaultItems)])
  await page.goto('/species/1')

  await expect(nameCells(page)).toHaveText(['두리', '미미', '동식이'])
  expect(requests).toHaveLength(1)
  expect(requests[0].url.pathname).toBe('/animal-manage/kind/1/animal')
  expect(Object.fromEntries(requests[0].url.searchParams)).toEqual({
    page: '1',
    size: '10',
  })
  expect(requests[0].authorization).toMatch(/^Bearer /)
  await expect(rows(page).nth(0)).toContainText('수컷')
  await expect(rows(page).nth(1)).toContainText('암컷')
  await expect(rows(page).nth(0)).toContainText('2021년')
  await expect(rows(page).nth(1)).toContainText('2020년')
  await expect(rows(page).nth(2)).toContainText('2019년')
})

test('S2: 성별 3종을 뱃지로 표시한다', async ({ page }) => {
  await mockList(page, () => [
    200,
    pageBody([
      defaultItems[0],
      defaultItems[1],
      {
        animalManageId: 7,
        animalName: '체리',
        animalGender: 'UNKNOWN',
        birthYear: 2018,
      },
    ]),
  ])
  await page.goto('/species/1')

  await expect(rows(page).nth(0)).toContainText('수컷')
  await expect(rows(page).nth(1)).toContainText('암컷')
  await expect(rows(page).nth(2)).toContainText('미상')
})

test('S3: 개체가 없는 종은 빈 상태다', async ({ page }) => {
  await mockList(page, () => [200, pageBody([])])
  await page.goto('/species/13')

  await expect(page.getByText('0마리', { exact: true })).toBeVisible()
  await expect(page.getByText('등록된 개체가 없습니다')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(paginationButtons(page)).toHaveCount(0)
})

test('S4: 검색어는 서버 keyword 로 보내고 응답을 그대로 보여준다', async ({
  page,
}) => {
  const requests = await mockList(page, (url) =>
    url.searchParams.get('keyword')
      ? [
          200,
          pageBody([
            {
              animalManageId: 12,
              animalName: '무궁이',
              animalGender: 'WOMAN',
              birthYear: 2021,
            },
          ]),
        ]
      : [200, pageBody(defaultItems)],
  )
  await page.goto('/species/1')
  await expect(rows(page)).toHaveCount(3)

  await searchBox(page).fill('무궁')

  await expect(nameCells(page)).toHaveText(['무궁이'])
  expect(Object.fromEntries(requests.at(-1)!.url.searchParams)).toEqual({
    keyword: '무궁',
    page: '1',
    size: '10',
  })
  await expect(page.getByText('3마리', { exact: true })).toBeVisible()
})

test('S5: 공백만 입력하면 keyword 를 보내지 않는다', async ({ page }) => {
  const requests = await mockList(page, () => [200, pageBody(defaultItems)])
  await page.goto('/species/1')
  await expect(rows(page)).toHaveCount(3)

  await searchBox(page).fill('   ')
  await page.waitForTimeout(400)

  expect(requests.every(({ url }) => !url.searchParams.has('keyword'))).toBe(
    true,
  )
})

test('S6: 검색 결과가 없으면 빈 상태와 구분한다', async ({ page }) => {
  await mockList(page, (url) =>
    url.searchParams.get('keyword')
      ? [200, pageBody([])]
      : [200, pageBody(defaultItems)],
  )
  await page.goto('/species/1')
  await expect(rows(page)).toHaveCount(3)

  await searchBox(page).fill('없는이름')

  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
  await expect(page.getByText('등록된 개체가 없습니다')).toHaveCount(0)
  await expect(paginationButtons(page)).toHaveCount(0)
})

test('S7·S8: 페이지 이동은 서버 page 로, 검색하면 1페이지로 돌아간다', async ({
  page,
}) => {
  const firstPage = Array.from({ length: 10 }, (_, index) => ({
    animalManageId: 15 - index,
    animalName: `개체${15 - index}`,
    animalGender: 'MAN',
    birthYear: 2020,
  }))
  const secondPage = firstPage.slice(0, 2).map((item, index) => ({
    ...item,
    animalManageId: 5 - index,
    animalName: `개체${5 - index}`,
  }))
  const requests = await mockList(page, (url) =>
    url.searchParams.get('page') === '2'
      ? [200, pageBody(secondPage, 12, 2)]
      : [200, pageBody(firstPage, 12, 2)],
  )
  await page.goto('/species/2')
  await expect(rows(page)).toHaveCount(10)

  await pageButton(page, 2).click()

  await expect(nameCells(page)).toHaveText(['개체5', '개체4'])
  expect(requests.at(-1)!.url.searchParams.get('page')).toBe('2')
  expect(requests.at(-1)!.url.searchParams.get('size')).toBe('10')
  await expect(pageButton(page, 2)).toHaveAttribute('aria-current', 'page')

  await searchBox(page).fill('개체')

  await expect
    .poll(() => requests.at(-1)!.url.searchParams.get('keyword'))
    .toBe('개체')
  expect(requests.at(-1)!.url.searchParams.get('page')).toBe('1')
  await expect(pageButton(page, 1)).toHaveAttribute('aria-current', 'page')
})

test('S9: 목록이 HTTP 404 이면 찾을 수 없는 종이다', async ({ page }) => {
  await mockList(page, () => [404, errorBody(404, '존재하지 않는 종입니다.')])
  await page.goto('/species/1')

  await expect(page.getByText('종을 찾을 수 없습니다.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: '목록으로 돌아가기' }),
  ).toHaveAttribute('href', '/species')
})

test('S10: HTTP 500 이면 개체 목록 오류 상태다', async ({ page }) => {
  await mockList(page, () => [
    500,
    errorBody(500, '내부 서버 오류가 발생했습니다.'),
  ])
  await page.goto('/species/1')

  await expectListError(page)
})

// 401(재발급 불가)·403 은 공통 인증 interceptor 가 세션을 끝내고 로그인으로 보낸다.
for (const status of [401, 403]) {
  test(`S11: HTTP ${status} 이면 목록 대신 로그인으로 간다`, async ({
    page,
  }) => {
    await mockList(page, () => [status, errorBody(status, '인증 오류')])
    await page.goto('/species/1')

    await expect(page).toHaveURL(/\/login$/)
    await expect(rows(page)).toHaveCount(0)
  })
}

test('S12: 응답 전에는 불러오는 중 문구다', async ({ page }) => {
  let release: () => void = () => {}
  const released = new Promise<void>((resolve) => (release = resolve))
  await page.route(kindAnimalsPattern, async (route) => {
    await released
    await json(route, 200, pageBody(defaultItems))
  })
  await page.goto('/species/1')

  await expect(page.getByText('종 정보를 불러오는 중입니다.')).toBeVisible()
  release()
  await expect(rows(page)).toHaveCount(3)
})

test('S13: 행을 누르면 animalManageId 로 개체 상세에 간다', async ({
  page,
}) => {
  await mockList(page, () => [200, pageBody(defaultItems)])
  await page.goto('/species/1')

  await rows(page).filter({ hasText: '두리' }).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/3$/)
})

test('S14: 정렬 버튼이 없고 어떤 요청에도 sort 가 없다', async ({ page }) => {
  const requests = await mockList(page, (url) =>
    url.searchParams.get('page') === '2'
      ? [200, pageBody(defaultItems.slice(0, 1), 11, 2)]
      : [200, pageBody(defaultItems, 11, 2)],
  )
  await page.goto('/species/1')
  await expect(rows(page)).toHaveCount(3)
  await pageButton(page, 2).click()
  await expect(rows(page)).toHaveCount(1)
  await searchBox(page).fill('미')
  await expect.poll(() => requests.length).toBeGreaterThan(2)

  await expect(page.getByRole('button', { name: '개체 정렬' })).toHaveCount(0)
  expect(requests.every(({ url }) => !url.searchParams.has('sort'))).toBe(true)
})

test('S15: Contract 밖 응답은 오류 상태다', async ({ page }) => {
  await mockList(page, () => [200, { items: [] }])
  await page.goto('/species/1')

  await expectListError(page)
})

test('S16: 허용값 밖의 성별은 오류 상태다', async ({ page }) => {
  await mockList(page, () => [
    200,
    pageBody([
      { ...defaultItems[0], animalGender: 'MALE' },
      ...defaultItems.slice(1),
    ]),
  ])
  await page.goto('/species/1')

  await expectListError(page)
})

function pageBody(
  content: Item[],
  total = content.length,
  totalPages?: number,
) {
  return {
    content,
    pageable: {
      pageNumber: 1,
      pageSize: 10,
      offset: 0,
      paged: true,
      unpaged: false,
    },
    totalPages: totalPages ?? Math.ceil(total / 10),
    totalElements: total,
    size: 10,
    number: 1,
    first: true,
    last: true,
    numberOfElements: content.length,
    empty: content.length === 0,
  }
}

async function mockList(page: Page, respond: (url: URL) => [number, unknown]) {
  const requests: { url: URL; authorization: string | undefined }[] = []
  await page.route(kindAnimalsPattern, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    requests.push({ url, authorization: request.headers().authorization })
    const [status, body] = respond(url)
    await json(route, status, body)
  })
  return requests
}

async function expectListError(page: Page) {
  await expect(page.getByRole('alert')).toContainText(
    '개체 목록을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByText('등록된 개체가 없습니다')).toHaveCount(0)
  await expect(page.getByText('검색결과가 없습니다')).toHaveCount(0)
}

function rows(page: Page) {
  return page.getByTestId('individual-row')
}

function nameCells(page: Page) {
  return rows(page).locator(':scope > div:nth-child(1)')
}

function searchBox(page: Page) {
  return page.getByRole('searchbox', { name: '개체 검색' })
}

function paginationButtons(page: Page) {
  return page.getByRole('button', { name: /페이지$/ })
}

function pageButton(page: Page, pageNumber: number) {
  return page.getByRole('button', { name: `${pageNumber} 페이지` })
}
