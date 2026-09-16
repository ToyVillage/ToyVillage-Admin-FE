import { expect, test, type Page } from '@playwright/test'
import {
  mockAnimalManageApi,
  mockKinds,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'

// 승인된 시나리오(animal-kind-delete.test-scenarios.md)를 변환한 것.
// 종 목록·상세·삭제는 `support/animal-manage-api` 가짜 서버가 받고, 실패·지연은 `failNext`·`delay` 로 주입한다.
// 목록 한 페이지에 종 1 이 보이도록 종 1~3 만 둔다.

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-kind-delete-test-token')
  })
  api = await mockAnimalManageApi(page, { kinds: mockKinds().slice(0, 3) })
})

test('S1: 종 목록에서 삭제하면 한 번 요청하고 목록을 다시 조회한다', async ({
  page,
}) => {
  await page.goto('/species')
  await openListDelete(page)
  const listCount = api.count('kind.list')

  await dialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/species$/)
  expect(api.count('kind.delete')).toBe(1)
  const request = deleteRequest()
  expect(request.url.pathname).toBe('/animal-manage/kind/1')
  expect(request.headers.authorization).toMatch(/^Bearer /)
  await expect.poll(() => api.count('kind.list')).toBeGreaterThan(listCount)
  await expect(rows(page).filter({ hasText: '카피바라' })).toHaveCount(0)
})

test('S2: 종 상세에서 삭제하면 목록으로 이동해 성공을 알린다', async ({
  page,
}) => {
  await page.goto('/species/1')
  await page.getByRole('button', { name: '카피바라 종 메뉴 열기' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  const notFound = page.getByText('종을 찾을 수 없습니다.')

  await dialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/species$/)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(notFound).toHaveCount(0)
  expect(api.count('kind.delete')).toBe(1)
})

for (const [id, status] of [
  ['S3', 404],
  ['S4', 500],
] as const) {
  test(`${id}: HTTP ${status} 이면 실패를 알리고 행과 초점을 유지한다`, async ({
    page,
  }) => {
    await page.goto('/species')
    await openListDelete(page)
    api.failNext('kind.delete', status)

    await dialog(page).getByRole('button', { name: '확인' }).click()

    await expect(page.getByRole('alert')).toContainText(
      '데이터 삭제에 실패했습니다',
    )
    await expect(rows(page).filter({ hasText: '카피바라' })).toBeVisible()
    await expect(trigger(page)).toBeFocused()
    await expect(page).toHaveURL(/\/species$/)
  })
}

test('S5: HTTP 403 이면 공통 인증 처리로 로그인으로 간다', async ({ page }) => {
  await page.goto('/species')
  await openListDelete(page)
  api.failNext('kind.delete', 403)

  await dialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/login$/)
})

test('S6: 확인을 연속으로 눌러도 한 번만 삭제한다', async ({ page }) => {
  await page.goto('/species')
  await openListDelete(page)
  api.delay('kind.delete', 800)

  await dialog(page).getByRole('button', { name: '확인' }).click()
  await expect(
    dialog(page).getByRole('button', { name: '삭제 중' }),
  ).toBeDisabled()
  await dialog(page)
    .getByRole('button', { name: '삭제 중' })
    .click({ force: true })

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  expect(api.count('kind.delete')).toBe(1)
})

test('S7: 취소하면 요청하지 않고 초점을 되돌린다', async ({ page }) => {
  await page.goto('/species')
  await openListDelete(page)

  await dialog(page).getByRole('button', { name: '취소' }).click()

  await expect(dialog(page)).toHaveCount(0)
  await expect(trigger(page)).toBeFocused()
  expect(api.count('kind.delete')).toBe(0)
})

test('S8: 종 삭제 뒤 개체 화면에 다시 들어가면 다시 조회한다', async ({
  page,
}) => {
  await page.goto('/species/1/individuals/1')
  await expect(page.getByRole('heading', { name: '동식이' })).toBeVisible()
  const animalCount = api.count('animal.detail')
  const observationCount = api.count('observation.list')

  await page.goto('/species/1')
  await page.getByRole('button', { name: '카피바라 종 메뉴 열기' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await dialog(page).getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/species$/)

  await page.goto('/species/1/individuals/1')

  await expect(page.getByText('개체를 찾을 수 없습니다.')).toBeVisible()
  expect(api.count('animal.detail')).toBeGreaterThan(animalCount)
  expect(api.count('observation.list')).toBeGreaterThanOrEqual(observationCount)
})

async function openListDelete(page: Page) {
  await trigger(page).click()
  await page
    .getByRole('menu', { name: '카피바라 관리 메뉴' })
    .getByRole('menuitem', { name: '삭제' })
    .click()
  await expect(dialog(page)).toBeVisible()
}

function trigger(page: Page) {
  return page.getByRole('button', { name: '카피바라 관리 메뉴' })
}

function rows(page: Page) {
  return page.getByTestId('species-row')
}

function dialog(page: Page) {
  return page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
}

function deleteRequest() {
  const request = api.requests.find(
    ({ operation }) => operation === 'kind.delete',
  )
  if (!request) throw new Error('종 삭제 요청이 없습니다.')
  return request
}
