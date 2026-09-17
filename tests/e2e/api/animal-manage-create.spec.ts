import { expect, test, type Page } from '@playwright/test'
import {
  animalCreatePattern,
  json,
  mockAnimalManageApi,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'
import {
  birthYearInput,
  expectFailure,
  leaveDialog,
  nameInput,
  noteInput,
  sexRadio,
  uploadPhoto,
} from '../support/individual-form-page'

// 승인된 시나리오(animal-manage-create.test-scenarios.md)를 변환한 것.
// 종·파일·개체 API 는 `support/animal-manage-api` 가짜 서버가 받고, 실패·지연은 `failNext`·`delay` 로 주입한다.

const createUrl = '/species/1/individuals/create'
const failure = '생성하지 못했습니다. 다시 시도해 주세요.'

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-manage-create-test-token')
  })
  api = await mockAnimalManageApi(page)
  await page.goto(createUrl)
  await expect(nameInput(page)).toBeVisible()
})

test('S1: 업로드 후 6필드로 생성하고 종 상세로 이동한다', async ({ page }) => {
  await fillValid(page)

  await submit(page).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(page.getByText('데이터 생성에 성공했습니다')).toBeVisible()
  expect(api.count('file.upload')).toBe(1)
  expect(api.count('animal.create')).toBe(1)
  const request = createRequest()
  expect(request.url.pathname).toBe('/animal-manage')
  expect(request.headers.authorization).toMatch(/^Bearer /)
  expect(request.headers['content-type']).toContain('application/json')
  expect(request.body).toEqual({
    animalKindId: 1,
    animalName: '무궁이',
    animalGender: 'WOMAN',
    birthYear: 2021,
    otherInfo: '온순한 성격',
    fileKey: '2026/09/17/upload-1_mugung.png',
  })
})

test('S2: 기타정보가 비면 otherInfo 키를 보내지 않는다', async ({ page }) => {
  await fillValid(page)
  await noteInput(page).fill('')

  await submit(page).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  expect(createRequest().body).not.toHaveProperty('otherInfo')
})

test('S3: 필수값이 비면 요청 없이 인라인 오류다', async ({ page }) => {
  await submit(page).click()

  await expect(
    page.getByRole('alert').filter({ hasText: '개체명을 입력해주세요!' }),
  ).toBeVisible()
  expect(api.count('file.upload')).toBe(0)
  expect(api.count('animal.create')).toBe(0)
})

test('S4: 기타정보는 255자에서 잘린다', async ({ page }) => {
  await fillValid(page)
  await noteInput(page).fill('가'.repeat(300))

  await expect(noteInput(page)).toHaveValue('가'.repeat(255))
  await submit(page).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  expect(
    (createRequest().body as { otherInfo: string }).otherInfo,
  ).toHaveLength(255)
})

for (const [id, status] of [
  ['S5', 400],
  ['S6', 404],
  ['S9', 500],
] as const) {
  test(`${id}: HTTP ${status} 이면 입력을 유지하고 다시 제출할 수 있다`, async ({
    page,
  }) => {
    await fillValid(page)
    api.failNext('animal.create', status)

    await submit(page).click()

    await expectFormKept(page)
    await submit(page).click()
    await expect(page).toHaveURL(/\/species\/1$/)
    expect(api.count('file.upload')).toBe(2)
    expect(api.count('animal.create')).toBe(2)
  })
}

// 401(재발급 불가)·403 은 공통 인증 interceptor 가 세션을 끝내고 로그인으로 보낸다.
for (const [id, status] of [
  ['S7', 401],
  ['S8', 403],
] as const) {
  test(`${id}: HTTP ${status} 이면 로그인으로 간다`, async ({ page }) => {
    await fillValid(page)
    api.failNext('animal.create', status)

    await submit(page).click()

    await expect(page).toHaveURL(/\/login$/)
  })
}

test('S10: 업로드가 실패하면 생성 요청을 보내지 않는다', async ({ page }) => {
  await fillValid(page)
  api.failNext('file.upload', 500)

  await submit(page).click()

  await expectFormKept(page)
  expect(api.count('animal.create')).toBe(0)
})

test('S11: 연속 클릭해도 업로드·생성은 한 번이다', async ({ page }) => {
  await fillValid(page)
  api.delay('animal.create', 800)

  await submit(page).dblclick()

  await expect(page.getByRole('button', { name: '생성 중' })).toBeDisabled()
  await expect(page).toHaveURL(/\/species\/1$/)
  expect(api.count('file.upload')).toBe(1)
  expect(api.count('animal.create')).toBe(1)
})

test('S12: 201 이 아닌 성공 status 는 실패다', async ({ page }) => {
  await mockCreate(page, 200, { message: '개체 생성 성공' })
  await fillValid(page)

  await submit(page).click()

  await expectFormKept(page)
})

test('S13: Contract 밖 응답은 실패다', async ({ page }) => {
  await mockCreate(page, 201, { result: 'ok' })
  await fillValid(page)

  await submit(page).click()

  await expectFormKept(page)
})

test('S14: 생성 뒤 종 상세 개체 목록을 다시 조회한다', async ({ page }) => {
  await fillValid(page)
  const listCount = api.count('animal.list')

  await submit(page).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(
    page.getByTestId('individual-row').filter({ hasText: '무궁이' }),
  ).toBeVisible()
  expect(api.count('animal.list')).toBeGreaterThan(listCount)
})

test('S15: 작성 중 뒤로가기는 이탈 확인을 띄운다', async ({ page }) => {
  await nameInput(page).fill('무궁이')

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(leaveDialog(page)).toBeVisible()
  await leaveDialog(page).getByRole('button', { name: '취소' }).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/create$/)
  await expect(nameInput(page)).toHaveValue('무궁이')
  expect(api.count('file.upload')).toBe(0)
  expect(api.count('animal.create')).toBe(0)
})

async function fillValid(page: Page) {
  await nameInput(page).fill('무궁이')
  await sexRadio(page, '암컷').click()
  await birthYearInput(page).fill('2021')
  await noteInput(page).fill('온순한 성격')
  await uploadPhoto(page)
}

function submit(page: Page) {
  return page.getByRole('button', { name: '생성하기' })
}

async function mockCreate(page: Page, status: number, body: unknown) {
  await page.route(animalCreatePattern, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await json(route, status, body)
  })
}

async function expectFormKept(page: Page) {
  await expectFailure(page, failure)
  await expect(page).toHaveURL(/\/species\/1\/individuals\/create$/)
  await expect(nameInput(page)).toHaveValue('무궁이')
  await expect(birthYearInput(page)).toHaveValue('2021')
}

function createRequest() {
  const request = api.requests.find(
    ({ operation }) => operation === 'animal.create',
  )
  if (!request) throw new Error('개체 생성 요청이 없습니다.')
  return request
}
