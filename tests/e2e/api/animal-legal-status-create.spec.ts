import { expect, test, type Page } from '@playwright/test'
import {
  json,
  legalStatusListPattern,
  mockAnimalManageApi,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'
import {
  addLegalButton,
  addLegalDialog,
  expectSubmitFailure,
  fillRequired,
  legalPill,
  legalRemoveButton,
  legalStatusFixture,
  submitButton,
  textbox,
} from '../support/species-form-page'

// 승인된 시나리오(animal-legal-status-create.test-scenarios.md)를 변환한 것.
// 공용 목록 기본값은 `천연기념물`(1)·`국제보호종`(5)이다.

const addFailure = '추가하지 못했습니다. 다시 시도해 주세요.'

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-legal-status-create-token')
  })
  api = await mockAnimalManageApi(page, {
    legalStatuses: legalStatusFixture(),
  })
})

test('S1: 공백을 뺀 이름으로 한 번 만들고 목록을 다시 받아 선택한다', async ({
  page,
}) => {
  await openCreate(page)
  const listCount = api.count('legalStatus.list')
  await addLegalButton(page).click()
  await nameInput(page).fill('  해양보호생물 ')

  await addLegalDialog(page).getByRole('button', { name: '추가하기' }).click()

  await expect(addLegalDialog(page)).toHaveCount(0)
  await expect(legalPill(page, '해양보호생물')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(legalRemoveButton(page, '해양보호생물')).toBeVisible()
  await expect(addLegalButton(page)).toBeFocused()
  expect(api.count('legalStatus.create')).toBe(1)
  const request = api.requests.find(
    ({ operation }) => operation === 'legalStatus.create',
  )
  expect(request?.body).toEqual({ kind: '해양보호생물' })
  expect(request?.headers.authorization).toMatch(/^Bearer /)
  expect(api.count('legalStatus.list')).toBeGreaterThan(listCount)
})

for (const name of ['천연기념물', '국제보호종']) {
  test(`S2: 이미 있는 이름(${name})은 요청하지 않는다`, async ({ page }) => {
    await openCreate(page)
    await addLegalButton(page).click()
    await nameInput(page).fill(name)

    await addLegalDialog(page).getByRole('button', { name: '추가하기' }).click()

    await expect(addLegalDialog(page)).toContainText('이미 있는 분류입니다!')
    expect(api.count('legalStatus.create')).toBe(0)
  })
}

for (const [id, status] of [
  ['S3', 400],
  ['S4', 500],
] as const) {
  test(`${id}: HTTP ${status} 이면 모달과 입력을 유지하고 실패를 알린다`, async ({
    page,
  }) => {
    await openCreate(page)
    await addLegalButton(page).click()
    await nameInput(page).fill('해양보호생물')
    api.failNext('legalStatus.create', status)

    await addLegalDialog(page).getByRole('button', { name: '추가하기' }).click()

    await expect(addLegalDialog(page)).toContainText(addFailure)
    await expect(nameInput(page)).toHaveValue('해양보호생물')
    await expect(legalPill(page, '해양보호생물')).toHaveCount(0)
  })
}

test('S4: HTTP 403 이면 공통 인증 처리로 로그인으로 간다', async ({ page }) => {
  await openCreate(page)
  await addLegalButton(page).click()
  await nameInput(page).fill('해양보호생물')
  api.failNext('legalStatus.create', 403)

  await addLegalDialog(page).getByRole('button', { name: '추가하기' }).click()

  await expect(page).toHaveURL(/\/login$/)
})

test('S5: 연속 클릭·Enter 연타에도 한 번만 만든다', async ({ page }) => {
  await openCreate(page)
  await addLegalButton(page).click()
  await nameInput(page).fill('해양보호생물')
  api.delay('legalStatus.create', 800)

  await addLegalDialog(page)
    .getByRole('button', { name: '추가하기' })
    .dblclick()
  await nameInput(page)
    .press('Enter')
    .catch(() => {})

  await expect(legalPill(page, '해양보호생물')).toBeVisible()
  expect(api.count('legalStatus.create')).toBe(1)
})

test('S6: 201 이 아닌 성공 status 는 실패로 본다', async ({ page }) => {
  await page.route(legalStatusListPattern, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await json(route, 200, { message: '법정지정분류 생성 성공' })
  })
  await openCreate(page)
  await addLegalButton(page).click()
  await nameInput(page).fill('해양보호생물')

  await addLegalDialog(page).getByRole('button', { name: '추가하기' }).click()

  await expect(addLegalDialog(page)).toContainText(addFailure)
})

test('S7: 고른 뒤 목록에서 사라진 항목은 저장할 때 만든 뒤 새 id 로 생성한다', async ({
  page,
}) => {
  await openCreate(page)
  await fillRequired(page)
  await legalPill(page, '천연기념물').click()
  // 고르고 나서 다른 곳에서 삭제된 상황
  api.legalStatuses = api.legalStatuses.filter(
    ({ kind }) => kind !== '천연기념물',
  )

  await submitButton(page).click()

  await expect(page).toHaveURL(/\/species$/)
  const operations = api.requests.map(({ operation }) => operation)
  const createIndex = operations.indexOf('legalStatus.create')
  const kindIndex = operations.indexOf('kind.create')
  expect(api.requests[createIndex].body).toEqual({ kind: '천연기념물' })
  expect(
    operations.slice(createIndex, kindIndex).includes('legalStatus.list'),
  ).toBe(true)
  const created = api.legalStatuses.find(({ kind }) => kind === '천연기념물')
  expect(api.requests[kindIndex].body).toMatchObject({
    animalLegalDesignation: [created?.id],
  })
})

test('S8: 사라진 항목 생성이 실패하면 종을 만들지 않는다', async ({ page }) => {
  await openCreate(page)
  await fillRequired(page)
  await legalPill(page, '천연기념물').click()
  api.legalStatuses = api.legalStatuses.filter(
    ({ kind }) => kind !== '천연기념물',
  )
  api.failNext('legalStatus.create', 500)

  await submitButton(page).click()

  await expectSubmitFailure(page, '생성하지 못했습니다. 다시 시도해 주세요.')
  expect(api.count('kind.create')).toBe(0)
  await expect(textbox(page, '국명')).toHaveValue('카피바라')
})

async function openCreate(page: Page) {
  await page.goto('/species/create')
  await expect(addLegalButton(page)).toBeEnabled()
}

function nameInput(page: Page) {
  return addLegalDialog(page).getByRole('textbox', { name: '분류 이름' })
}
