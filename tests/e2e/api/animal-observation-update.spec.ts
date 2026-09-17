import { expect, test, type Page } from '@playwright/test'
import {
  mockAnimalManageApi,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'
import {
  observationAnimals,
  observationFixture,
  observationIndividualUrl,
} from '../support/observation-fixture'

// 승인된 시나리오(animal-observation-update.test-scenarios.md)를 변환한 것.
// 관찰 31 은 `식욕 감소`, 관찰사항 두 줄, 첨부 `obs/memo.pdf` 다. 실패·지연은 `failNext`·`delay` 로 주입한다.

const detailUrl = `${observationIndividualUrl}/observations/31`
const failure = '저장하지 못했습니다. 다시 시도해 주세요.'

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-observation-update-token')
  })
  api = await mockAnimalManageApi(page, {
    animals: observationAnimals(),
    observations: observationFixture(),
  })
  await page.goto(`${detailUrl}/edit`)
  await expect(titleInput(page)).toHaveValue('식욕 감소')
})

test('S1: 제목만 바꾸면 업로드 없이 PATCH 하고 상세로 간다', async ({
  page,
}) => {
  const detailCount = api.count('observation.detail')
  await titleInput(page).fill('식욕 회복')

  await submit(page).click()

  await expect(page).toHaveURL(/\/observations\/31$/)
  await expect(page.getByRole('heading', { name: '식욕 회복' })).toBeVisible()
  expect(api.count('file.upload')).toBe(0)
  expect(api.count('observation.update')).toBe(1)
  const request = updateRequest()
  expect(request.url.pathname).toBe('/animal-manage/7/observations/31')
  expect(request.headers.authorization).toMatch(/^Bearer /)
  expect(request.body).toEqual({
    title: '식욕 회복',
    content: '아침 급여량의\n절반만 먹음',
    fileKeys: ['obs/memo.pdf'],
  })
  expect(api.count('observation.detail')).toBeGreaterThan(detailCount)
})

test('S2: 새 첨부는 업로드한 키를 뒤에 붙인다', async ({ page }) => {
  await addAttachment(page, 'new.jpg')

  await submit(page).click()

  await expect(page).toHaveURL(/\/observations\/31$/)
  expect(api.count('file.upload')).toBe(1)
  expect(updateRequest().body).toMatchObject({
    fileKeys: ['obs/memo.pdf', '2026/09/17/upload-1_new.jpg'],
  })
})

test('S3: 첨부를 모두 지우면 빈 배열을 보낸다', async ({ page }) => {
  await page.getByRole('button', { name: 'memo.pdf 삭제' }).click()

  await submit(page).click()

  await expect(page).toHaveURL(/\/observations\/31$/)
  expect(updateRequest().body).toMatchObject({ fileKeys: [] })
})

test('S4: 제목이 비면 요청 없이 인라인 오류다', async ({ page }) => {
  await titleInput(page).fill('')

  await submit(page).click()

  await expect(page.getByRole('alert').first()).toBeVisible()
  expect(api.count('observation.update')).toBe(0)
  await expect(page).toHaveURL(/\/edit$/)
})

test('S5: 제목 100자·관찰사항 2000자에서 입력이 멈춘다', async ({ page }) => {
  await titleInput(page).fill('가'.repeat(101))
  await contentInput(page).fill('나'.repeat(2001))

  await expect(titleInput(page)).toHaveValue('가'.repeat(100))
  await expect(contentInput(page)).toHaveValue('나'.repeat(2000))
})

for (const status of [400, 404, 500]) {
  test(`S6: HTTP ${status} 이면 폼과 입력을 유지하고 실패를 알린다`, async ({
    page,
  }) => {
    await titleInput(page).fill('식욕 회복')
    api.failNext('observation.update', status)

    await submit(page).click()

    await expectFormKept(page)
  })
}

test('S7: 업로드가 실패하면 PATCH 하지 않는다', async ({ page }) => {
  await titleInput(page).fill('식욕 회복')
  await addAttachment(page, 'new.jpg')
  api.failNext('file.upload', 500)

  await submit(page).click()

  await expectFormKept(page)
  expect(api.count('observation.update')).toBe(0)
})

test('S8: 연속 클릭해도 PATCH 는 한 번이다', async ({ page }) => {
  await titleInput(page).fill('식욕 회복')
  api.delay('observation.update', 800)

  await submit(page).dblclick()

  await expect(page.getByRole('button', { name: '저장 중' })).toBeDisabled()
  await expect(page).toHaveURL(/\/observations\/31$/)
  expect(api.count('observation.update')).toBe(1)
})

function titleInput(page: Page) {
  return page.getByRole('textbox', { name: '제목', exact: true })
}

function contentInput(page: Page) {
  return page.getByRole('textbox', { name: '관찰사항', exact: true })
}

function submit(page: Page) {
  return page.getByRole('button', { name: '저장하기' })
}

async function addAttachment(page: Page, name: string) {
  await page.locator('input[type="file"]').setInputFiles({
    name,
    mimeType: 'image/jpeg',
    buffer: Buffer.from(`${name} content`),
  })
  await expect(page.getByText(name, { exact: true })).toBeVisible()
}

async function expectFormKept(page: Page) {
  await expect(
    page.getByRole('status').filter({ hasText: failure }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/edit$/)
  await expect(titleInput(page)).toHaveValue('식욕 회복')
}

function updateRequest() {
  const request = api.requests.find(
    ({ operation }) => operation === 'observation.update',
  )
  if (!request) throw new Error('관찰 수정 요청이 없습니다.')
  return request
}
