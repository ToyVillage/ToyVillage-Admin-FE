import { expect, test, type Page } from '@playwright/test'
import {
  animalItemPattern,
  json,
  mockAnimalManageApi,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'
import {
  animalFixture,
  birthYearInput,
  expectFailure,
  leaveDialog,
  nameInput,
  noteInput,
  uploadPhoto,
} from '../support/individual-form-page'

// 승인된 시나리오(animal-manage-update.test-scenarios.md)를 변환한 것.
// 개체 12 는 종 1 의 `무궁이`(암컷·2021·온순한 성격·`animal/mugung.png`)다.

const editUrl = '/species/1/individuals/12/edit'
const failure = '저장하지 못했습니다. 다시 시도해 주세요.'

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-manage-update-test-token')
  })
  api = await mockAnimalManageApi(page, { animals: animalFixture() })
  await page.goto(editUrl)
  await expect(nameInput(page)).toHaveValue('무궁이')
})

test('S1: 사진을 유지하면 업로드 없이 6필드 전부를 PATCH 한다', async ({
  page,
}) => {
  await nameInput(page).fill('무궁이2')

  await submit(page).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/12$/)
  expect(api.count('file.upload')).toBe(0)
  expect(api.count('animal.update')).toBe(1)
  const request = updateRequest()
  expect(request.url.pathname).toBe('/animal-manage/12')
  expect(request.headers.authorization).toMatch(/^Bearer /)
  expect(request.headers['content-type']).toContain('application/json')
  expect(request.body).toEqual({
    animalKindId: 1,
    animalName: '무궁이2',
    animalGender: 'WOMAN',
    birthYear: 2021,
    otherInfo: '온순한 성격',
    fileKey: 'animal/mugung.png',
  })
  await expect(page.getByText('데이터 수정에 성공했습니다')).toHaveCount(0)
})

test('S2: 사진을 바꾸면 업로드한 키로 PATCH 한다', async ({ page }) => {
  await uploadPhoto(page, 'new_abc123.png')

  await submit(page).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/12$/)
  expect(api.count('file.upload')).toBe(1)
  expect(updateRequest().body).toMatchObject({
    fileKey: '2026/09/17/upload-1_new_abc123.png',
  })
})

test('S3: 기타정보를 비우면 otherInfo 키를 보내지 않는다', async ({ page }) => {
  await noteInput(page).fill('')

  await submit(page).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/12$/)
  expect(updateRequest().body).not.toHaveProperty('otherInfo')
})

test('S4: 필수값이 비면 요청 없이 인라인 오류다', async ({ page }) => {
  await nameInput(page).fill('')

  await submit(page).click()

  await expect(
    page.getByRole('alert').filter({ hasText: '개체명을 입력해주세요!' }),
  ).toBeVisible()
  expect(api.count('animal.update')).toBe(0)
  await expect(page).toHaveURL(/\/edit$/)
})

test('S5: 기타정보는 255자에서 잘린다', async ({ page }) => {
  await noteInput(page).fill('나'.repeat(300))

  await expect(noteInput(page)).toHaveValue('나'.repeat(255))
})

for (const [id, status] of [
  ['S6', 400],
  ['S7', 404],
  ['S9', 500],
] as const) {
  test(`${id}: HTTP ${status} 이면 입력을 유지하고 다시 저장할 수 있다`, async ({
    page,
  }) => {
    await nameInput(page).fill('무궁이2')
    api.failNext('animal.update', status)

    await submit(page).click()

    await expectFormKept(page)
    await submit(page).click()
    await expect(page).toHaveURL(/\/species\/1\/individuals\/12$/)
    expect(api.count('animal.update')).toBe(2)
  })
}

// 401(재발급 불가)·403 은 공통 인증 interceptor 가 세션을 끝내고 로그인으로 보낸다.
for (const status of [401, 403]) {
  test(`S8: HTTP ${status} 이면 로그인으로 간다`, async ({ page }) => {
    api.failNext('animal.update', status)

    await submit(page).click()

    await expect(page).toHaveURL(/\/login$/)
  })
}

test('S10: 사진 업로드가 실패하면 PATCH 하지 않는다', async ({ page }) => {
  await nameInput(page).fill('무궁이2')
  await uploadPhoto(page, 'new.png')
  api.failNext('file.upload', 500)

  await submit(page).click()

  await expectFormKept(page)
  expect(api.count('animal.update')).toBe(0)
})

test('S11: 연속 클릭해도 PATCH 는 한 번이다', async ({ page }) => {
  await nameInput(page).fill('무궁이2')
  api.delay('animal.update', 800)

  await submit(page).dblclick()

  await expect(page.getByRole('button', { name: '저장 중' })).toBeDisabled()
  await expect(page).toHaveURL(/\/species\/1\/individuals\/12$/)
  expect(api.count('animal.update')).toBe(1)
})

test('S12: 200 이 아닌 성공 status 는 실패다', async ({ page }) => {
  await mockUpdate(page, 201, { message: '개체 수정 성공' })
  await nameInput(page).fill('무궁이2')

  await submit(page).click()

  await expectFormKept(page)
})

test('S13: Contract 밖 응답은 실패다', async ({ page }) => {
  await mockUpdate(page, 200, { result: 'ok' })
  await nameInput(page).fill('무궁이2')

  await submit(page).click()

  await expectFormKept(page)
})

test('S14: 저장 뒤 개체 상세를 다시 조회한다', async ({ page }) => {
  const detailCount = api.count('animal.detail')
  await nameInput(page).fill('무궁이2')

  await submit(page).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/12$/)
  await expect(page.getByRole('img', { name: '무궁이2 사진' })).toBeVisible()
  expect(api.count('animal.detail')).toBeGreaterThan(detailCount)
})

test('S15: 수정 중 뒤로가기는 이탈 확인을 띄운다', async ({ page }) => {
  await nameInput(page).fill('무궁이2')

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(leaveDialog(page)).toBeVisible()
  await leaveDialog(page).getByRole('button', { name: '취소' }).click()

  await expect(page).toHaveURL(/\/edit$/)
  await expect(nameInput(page)).toHaveValue('무궁이2')
  expect(api.count('animal.update')).toBe(0)
})

function submit(page: Page) {
  return page.getByRole('button', { name: '저장하기' })
}

async function mockUpdate(page: Page, status: number, body: unknown) {
  await page.route(animalItemPattern, async (route) => {
    if (route.request().method() !== 'PATCH') return route.fallback()
    await json(route, status, body)
  })
}

async function expectFormKept(page: Page) {
  await expectFailure(page, failure)
  await expect(page).toHaveURL(/\/edit$/)
  await expect(nameInput(page)).toHaveValue('무궁이2')
  await expect(birthYearInput(page)).toHaveValue('2021')
}

function updateRequest() {
  const request = api.requests.find(
    ({ operation }) => operation === 'animal.update',
  )
  if (!request) throw new Error('개체 수정 요청이 없습니다.')
  return request
}
