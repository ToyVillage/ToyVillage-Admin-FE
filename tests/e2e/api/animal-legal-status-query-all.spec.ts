import { expect, test, type Page } from '@playwright/test'
import {
  json,
  legalStatusListPattern,
  mockAnimalManageApi,
  mockKinds,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'
import {
  addLegalButton,
  addLegalDialog,
  deleteDialog,
  fillRequired,
  legalGroup,
  legalPill,
  legalRemoveButton,
  legalStatusFixture,
  submitButton,
} from '../support/species-form-page'

// 승인된 시나리오(animal-legal-status-query-all.test-scenarios.md)를 변환한 것.
// 공용 목록 기본값은 `천연기념물`(1)·`국제보호종`(5)이다.

const loadFailure = '법정지정분류를 불러오지 못했습니다. 다시 시도해 주세요.'

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-legal-status-query-all-token')
  })
  const kinds = mockKinds()
  kinds[0].legalDesignations = ['천연기념물', '국제보호종', '삭제된분류']
  api = await mockAnimalManageApi(page, {
    kinds,
    legalStatuses: legalStatusFixture(),
  })
})

test('S1: 서버 목록을 받은 순서대로 보이고 모두 ✕ 로 지울 수 있다', async ({
  page,
}) => {
  await page.goto('/species/create')

  await expect(legalPill(page, '국제보호종')).toBeVisible()
  expect(api.count('legalStatus.list')).toBe(1)
  expect(
    api.requests.find(({ operation }) => operation === 'legalStatus.list')
      ?.headers.authorization,
  ).toMatch(/^Bearer /)
  await expect(legalGroup(page).getByRole('button')).toHaveText([
    '천연기념물',
    '',
    '국제보호종',
    '',
    '법정분류 추가',
  ])
  await expect(legalRemoveButton(page, '국제보호종')).toBeVisible()
  await expect(legalRemoveButton(page, '천연기념물')).toBeVisible()
})

test('S2: 빈 목록이면 추가 버튼만 보인다', async ({ page }) => {
  api.legalStatuses = []
  await page.goto('/species/create')

  await expect(addLegalButton(page)).toBeEnabled()
  await expect(legalGroup(page).getByRole('button')).toHaveText([
    '법정분류 추가',
  ])
  await expect(page.getByText(loadFailure)).toHaveCount(0)
})

test('S3: 수정 화면은 목록에 없는 저장값도 선택된 채 복원하고 저장 때 다시 만든다', async ({
  page,
}) => {
  await page.goto('/species/1/edit')

  for (const name of ['천연기념물', '국제보호종', '삭제된분류']) {
    await expect(legalPill(page, name)).toHaveAttribute('aria-pressed', 'true')
  }
  // 공용 목록·저장값에 없는 이름은 pill 자체가 없다.
  await expect(legalPill(page, '지정관리 야생동물')).toHaveCount(0)

  await submitButton(page, '저장하기').click()

  await expect(page).toHaveURL(/\/species\/1$/)
  const operations = api.requests.map(({ operation }) => operation)
  const createIndex = operations.indexOf('legalStatus.create')
  expect(api.requests[createIndex].body).toEqual({ kind: '삭제된분류' })
  expect(
    operations.slice(createIndex).indexOf('legalStatus.list'),
  ).toBeGreaterThan(0)
  const created = api.legalStatuses.find(({ kind }) => kind === '삭제된분류')
  const update = api.requests.find(
    ({ operation }) => operation === 'kind.update',
  )
  expect(update?.body).toMatchObject({
    animalLegalDesignation: [1, 5, created?.id],
  })
})

test('S4: 생성 요청은 선택 이름을 화면 순서의 id 로 보낸다', async ({
  page,
}) => {
  await page.goto('/species/create')
  await expect(legalPill(page, '국제보호종')).toBeVisible()
  await fillRequired(page)
  await legalPill(page, '국제보호종').click()
  await legalPill(page, '천연기념물').click()

  await submitButton(page).click()

  await expect(page).toHaveURL(/\/species$/)
  const create = api.requests.find(
    ({ operation }) => operation === 'kind.create',
  )
  expect(create?.body).toMatchObject({ animalLegalDesignation: [1, 5] })
})

test('S5: HTTP 500 이면 필드에 실패를 알리고 저장을 막는다', async ({
  page,
}) => {
  await mockList(page, 500, { message: '내부 서버 오류가 발생했습니다.' })
  await page.goto('/species/create')

  await expectLoadFailure(page)
})

test('S6: HTTP 403 이면 공통 인증 처리로 로그인으로 간다', async ({ page }) => {
  await mockList(page, 403, { message: '접근할 수 있는 권한이 없습니다.' })
  await page.goto('/species/create')

  await expect(page).toHaveURL(/\/login$/)
})

test('S7: 응답 형식이 다르면 조회 실패와 같다', async ({ page }) => {
  await mockList(page, 200, { items: [] })
  await page.goto('/species/create')

  await expectLoadFailure(page)
})

test('S8: 추가·삭제에 성공하면 목록을 다시 조회한다', async ({ page }) => {
  await page.goto('/species/create')
  await expect(legalPill(page, '국제보호종')).toBeVisible()

  let before = api.count('legalStatus.list')
  await addLegalButton(page).click()
  await addLegalDialog(page)
    .getByRole('textbox', { name: '분류 이름' })
    .fill('해양보호생물')
  await addLegalDialog(page).getByRole('button', { name: '추가하기' }).click()
  await expect(legalPill(page, '해양보호생물')).toBeVisible()
  await expect.poll(() => api.count('legalStatus.list')).toBeGreaterThan(before)

  before = api.count('legalStatus.list')
  await legalRemoveButton(page, '국제보호종').click()
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()
  await expect(legalPill(page, '국제보호종')).toHaveCount(0)
  await expect.poll(() => api.count('legalStatus.list')).toBeGreaterThan(before)
})

async function mockList(page: Page, status: number, body: unknown) {
  await page.route(legalStatusListPattern, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await json(route, status, body)
  })
}

async function expectLoadFailure(page: Page) {
  await expect(
    page.getByRole('alert').filter({ hasText: loadFailure }),
  ).toBeVisible()
  await expect(submitButton(page)).toBeDisabled()
  await fillRequired(page)
  await submitButton(page).click({ force: true })
  expect(api.count('kind.create')).toBe(0)
}
