import { expect, test, type Page } from '@playwright/test'
import {
  json,
  kindListPattern,
  mockAnimalManageApi,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'
import {
  expectSubmitFailure,
  fillRequired,
  legalPill,
  legalStatusFixture,
  submitButton,
  textbox,
} from '../support/species-form-page'

// 승인된 시나리오(animal-kind-create.test-scenarios.md)를 변환한 것.
// 법정지정분류·파일·종 API 는 `support/animal-manage-api` 가짜 서버가 받고,
// 실패·지연은 `failNext`·`delay` 로 주입한다.

const failureMessage = '생성하지 못했습니다. 다시 시도해 주세요.'

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-kind-create-test-token')
  })
  api = await mockAnimalManageApi(page, { legalStatuses: legalStatusFixture() })
  await page.goto('/species/create')
  await expect(legalPill(page, '국제보호종')).toBeVisible()
})

test('S1: 선택값을 포함해 업로드 후 종을 생성하고 목록으로 이동한다', async ({
  page,
}) => {
  await fillRequired(page)
  await page.getByRole('radio', { name: '포유류' }).click()
  await textbox(page, '세부 분류').fill('설치목 - 천축서과')
  await legalPill(page, '천연기념물').click()
  const listCount = api.count('kind.list')

  await submitButton(page).click()

  await expect(page).toHaveURL(/\/species$/)
  await expect(page.getByText('데이터 생성에 성공했습니다')).toBeVisible()
  expect(api.count('file.upload')).toBe(1)
  expect(api.count('kind.create')).toBe(1)
  expect(createRequest().headers.authorization).toMatch(/^Bearer /)
  expect(createRequest().body).toEqual({
    animalName: '카피바라',
    animalEngName: 'Capybara',
    animalScientificName: 'Hydrochoerus hydrochaeris',
    animalTaxonomic: 'MAMMALS',
    animalDetailKind: '설치목 - 천축서과',
    animalLegalDesignation: [1],
    fileKey: '2026/09/17/upload-1_new.png',
  })
  await expect.poll(() => api.count('kind.list')).toBeGreaterThan(listCount)
})

test('S2: 선택값을 비우면 선택 필드 키를 보내지 않는다', async ({ page }) => {
  await fillRequired(page)

  await submitButton(page).click()

  await expect(page).toHaveURL(/\/species$/)
  const body = createRequest().body as Record<string, unknown>
  expect(body).not.toHaveProperty('animalDetailKind')
  expect(body).not.toHaveProperty('animalLegalDesignation')
})

test('S3: 필수값이 비면 요청하지 않는다', async ({ page }) => {
  await fillRequired(page)
  await textbox(page, '국명').fill('')

  await submitButton(page).click()

  await expect(
    page.getByRole('alert').filter({ hasText: '국명' }).first(),
  ).toBeVisible()
  expect(api.count('file.upload')).toBe(0)
  expect(api.count('kind.create')).toBe(0)
  await expect(page).toHaveURL(/\/species\/create$/)
})

for (const [id, status] of [
  ['S4', 400],
  ['S5', 404],
  ['S6', 500],
] as const) {
  test(`${id}: HTTP ${status} 이면 폼과 입력을 유지하고 실패를 알린다`, async ({
    page,
  }) => {
    await fillRequired(page)
    api.failNext('kind.create', status)

    await submitButton(page).click()

    await expectFormKept(page)
  })
}

test('S6: HTTP 403 이면 공통 인증 처리로 로그인으로 간다', async ({ page }) => {
  await fillRequired(page)
  api.failNext('kind.create', 403)

  await submitButton(page).click()

  await expect(page).toHaveURL(/\/login$/)
})

test('S7: 사진 업로드가 실패하면 종 생성 요청을 보내지 않는다', async ({
  page,
}) => {
  await fillRequired(page)
  api.failNext('file.upload', 500)

  await submitButton(page).click()

  await expectFormKept(page)
  expect(api.count('kind.create')).toBe(0)
})

test('S8: 연속 클릭해도 업로드·생성은 한 번이다', async ({ page }) => {
  await fillRequired(page)
  api.delay('kind.create', 800)

  await submitButton(page).dblclick()

  await expect(page).toHaveURL(/\/species$/)
  expect(api.count('file.upload')).toBe(1)
  expect(api.count('kind.create')).toBe(1)
})

test('S9: 201 이 아닌 성공 status 는 실패로 본다', async ({ page }) => {
  await page.route(kindListPattern, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await json(route, 200, { message: '종 생성 성공' })
  })
  await fillRequired(page)

  await submitButton(page).click()

  await expectFormKept(page)
})

function createRequest() {
  const request = api.requests.find(
    ({ operation }) => operation === 'kind.create',
  )
  if (!request) throw new Error('종 생성 요청이 없습니다.')
  return request
}

async function expectFormKept(page: Page) {
  await expectSubmitFailure(page, failureMessage)
  await expect(page).toHaveURL(/\/species\/create$/)
  await expect(textbox(page, '국명')).toHaveValue('카피바라')
  await expect(textbox(page, '학명')).toHaveValue('Hydrochoerus hydrochaeris')
}
