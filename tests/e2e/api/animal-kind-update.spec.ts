import { expect, test, type Page } from '@playwright/test'
import {
  mockAnimalManageApi,
  mockKinds,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'
import {
  expectSubmitFailure,
  legalPill,
  legalStatusFixture,
  submitButton,
  textbox,
  uploadPhoto,
} from '../support/species-form-page'

// 승인된 시나리오(animal-kind-update.test-scenarios.md)를 변환한 것.
// 종 1 은 세부분류 `설치목 - 천축서과`, 법정지정분류 `천연기념물`(id 1), 사진 `animal/capybara.png` 이다.

const failureMessage = '저장하지 못했습니다. 다시 시도해 주세요.'

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-kind-update-test-token')
  })
  const kinds = mockKinds()
  Object.assign(kinds[0], {
    legalDesignations: ['천연기념물'],
    kindImage: { fileName: 'capybara.png', fileKey: 'animal/capybara.png' },
  })
  api = await mockAnimalManageApi(page, {
    kinds,
    legalStatuses: legalStatusFixture(),
  })
})

test('S1: 텍스트만 바꾸면 업로드 없이 전체를 PATCH 한다', async ({ page }) => {
  await openEdit(page)
  await textbox(page, '국명').fill('카피바라2')
  const detailCount = api.count('kind.detail')

  await submitButton(page, '저장하기').click()

  await expect(page).toHaveURL(/\/species\/1$/)
  expect(api.count('file.upload')).toBe(0)
  expect(api.count('kind.update')).toBe(1)
  const request = updateRequest()
  expect(request.url.pathname).toBe('/animal-manage/kind/1')
  expect(request.headers.authorization).toMatch(/^Bearer /)
  expect(request.body).toEqual({
    animalName: '카피바라2',
    animalEngName: 'Capybara',
    animalScientificName: 'Hydrochoerus hydrochaeris',
    animalTaxonomic: 'MAMMALS',
    animalDetailKind: '설치목 - 천축서과',
    animalLegalDesignation: [1],
    fileKey: 'animal/capybara.png',
  })
  await expect(page.getByRole('heading', { name: '카피바라2' })).toBeVisible()
  expect(api.count('kind.detail')).toBeGreaterThan(detailCount)
})

test('S2: 사진을 바꾸면 업로드한 키로 PATCH 한다', async ({ page }) => {
  await openEdit(page)
  await uploadPhoto(page, 'capybara-new.png')

  await submitButton(page, '저장하기').click()

  await expect(page).toHaveURL(/\/species\/1$/)
  expect(api.count('file.upload')).toBe(1)
  expect(updateRequest().body).toMatchObject({
    fileKey: '2026/09/17/upload-1_capybara-new.png',
  })
})

test('S3: 선택값을 모두 비우면 null 과 빈 배열을 보낸다', async ({ page }) => {
  await openEdit(page)
  await textbox(page, '세부 분류').fill('')
  await legalPill(page, '천연기념물').click()

  await submitButton(page, '저장하기').click()

  await expect(page).toHaveURL(/\/species\/1$/)
  expect(updateRequest().body).toMatchObject({
    animalDetailKind: null,
    animalLegalDesignation: [],
  })
})

for (const [id, status] of [
  ['S4', 400],
  ['S5', 404],
  ['S6', 500],
] as const) {
  test(`${id}: HTTP ${status} 이면 폼과 입력을 유지하고 실패를 알린다`, async ({
    page,
  }) => {
    await openEdit(page)
    await textbox(page, '국명').fill('카피바라2')
    api.failNext('kind.update', status)

    await submitButton(page, '저장하기').click()

    await expectSubmitFailure(page, failureMessage)
    await expect(page).toHaveURL(/\/species\/1\/edit$/)
    await expect(textbox(page, '국명')).toHaveValue('카피바라2')
  })
}

test('S6: HTTP 403 이면 공통 인증 처리로 로그인으로 간다', async ({ page }) => {
  await openEdit(page)
  api.failNext('kind.update', 403)

  await submitButton(page, '저장하기').click()

  await expect(page).toHaveURL(/\/login$/)
})

test('S7: 연속 클릭해도 PATCH 는 한 번이다', async ({ page }) => {
  await openEdit(page)
  await textbox(page, '국명').fill('카피바라2')
  api.delay('kind.update', 800)

  await submitButton(page, '저장하기').dblclick()

  await expect(page).toHaveURL(/\/species\/1$/)
  expect(api.count('kind.update')).toBe(1)
})

test('S8: 고른 뒤 목록에서 사라진 항목은 만든 뒤 새 id 로 PATCH 한다', async ({
  page,
}) => {
  await openEdit(page)
  await legalPill(page, '국제보호종').click()
  // 고르고 나서 다른 곳에서 삭제된 상황
  api.legalStatuses = api.legalStatuses.filter(
    ({ kind }) => kind !== '국제보호종',
  )

  await submitButton(page, '저장하기').click()

  await expect(page).toHaveURL(/\/species\/1$/)
  const operations = api.requests.map(({ operation }) => operation)
  const createIndex = operations.indexOf('legalStatus.create')
  const updateIndex = operations.indexOf('kind.update')
  expect(createIndex).toBeGreaterThan(-1)
  expect(
    operations.slice(createIndex, updateIndex).includes('legalStatus.list'),
  ).toBe(true)
  expect(api.requests[createIndex].body).toEqual({
    kind: '국제보호종',
  })
  const created = api.legalStatuses.find(({ kind }) => kind === '국제보호종')
  expect(updateRequest().body).toMatchObject({
    animalLegalDesignation: [1, created?.id],
  })
})

async function openEdit(page: Page) {
  await page.goto('/species/1/edit')
  await expect(textbox(page, '국명')).toHaveValue('카피바라')
  await expect(legalPill(page, '국제보호종')).toBeVisible()
}

function updateRequest() {
  const request = api.requests.find(
    ({ operation }) => operation === 'kind.update',
  )
  if (!request) throw new Error('종 수정 요청이 없습니다.')
  return request
}
