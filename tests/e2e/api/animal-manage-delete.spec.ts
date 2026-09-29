import { expect, test, type Page } from '@playwright/test'
import {
  animalItemPattern,
  json,
  mockAnimalManageApi,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'
import { animalFixture } from '../support/individual-form-page'

// 승인된 시나리오(animal-manage-delete.test-scenarios.md)를 변환한 것.
// 개체 12 는 종 1 의 `무궁이`다. 실패·지연은 `failNext`·`delay` 로 주입한다.

const detailUrl = '/species/1/individuals/12'

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-manage-delete-test-token')
  })
  api = await mockAnimalManageApi(page, { animals: animalFixture() })
})

test('S1: 개체 상세에서 삭제하면 한 번 요청하고 종 상세로 이동한다', async ({
  page,
}) => {
  await page.goto(detailUrl)
  await openDetailDelete(page)

  await confirm(page)

  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  expect(api.count('animal.delete')).toBe(1)
  const request = deleteRequest()
  expect(request.url.pathname).toBe('/animal-manage/12')
  expect(request.body).toBeNull()
  expect(request.headers.authorization).toMatch(/^Bearer /)
})

test('S2: 종 상세 표에서 삭제하면 머무르며 목록을 다시 조회한다', async ({
  page,
}) => {
  await page.goto('/species/1')
  await expect(row(page, '무궁이')).toBeVisible()
  const listCount = api.count('animal.list')

  await page.getByRole('button', { name: '무궁이 개체 메뉴 열기' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await confirm(page)

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(row(page, '무궁이')).toHaveCount(0)
  expect(api.count('animal.delete')).toBe(1)
  expect(api.count('animal.list')).toBeGreaterThan(listCount)
})

test('S3: 마지막 페이지의 유일한 행을 지우면 앞 페이지를 보여준다', async ({
  page,
}) => {
  // 종 2 는 개체 12 가 종 1 로 옮겨져 11마리다 — 2페이지에 `핑키` 한 행.
  await page.goto('/species/2')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(page.getByTestId('individual-row')).toHaveCount(1)

  await page.getByRole('button', { name: '핑키 개체 메뉴 열기' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await confirm(page)

  await expect(page.getByTestId('individual-row')).toHaveCount(10)
  await expect(page.getByRole('button', { name: /페이지$/ })).toHaveCount(0)
})

for (const [id, status] of [
  ['S4', 404],
  ['S5', 500],
] as const) {
  test(`${id}: HTTP ${status} 이면 실패를 알리고 화면과 초점을 유지한다`, async ({
    page,
  }) => {
    await page.goto(detailUrl)
    await openDetailDelete(page)
    api.failNext('animal.delete', status)

    await confirm(page)

    await expect(page.getByRole('alert')).toContainText(
      '데이터 삭제에 실패했습니다',
    )
    await expect(page).toHaveURL(/\/species\/1\/individuals\/12$/)
    await expect(detailTrigger(page)).toBeFocused()
  })
}

// 401(재발급 불가)·403 은 공통 인증 interceptor 가 세션을 끝내고 로그인으로 보낸다.
for (const status of [401, 403]) {
  test(`S6: HTTP ${status} 이면 로그인으로 간다`, async ({ page }) => {
    await page.goto(detailUrl)
    await openDetailDelete(page)
    api.failNext('animal.delete', status)

    await confirm(page)

    await expect(page).toHaveURL(/\/login$/)
  })
}

test('S7: 확인을 연속으로 눌러도 한 번만 삭제한다', async ({ page }) => {
  await page.goto(detailUrl)
  await openDetailDelete(page)
  api.delay('animal.delete', 800)

  await dialog(page).getByRole('button', { name: '확인' }).dblclick()

  await expect(
    dialog(page).getByRole('button', { name: '삭제 중' }),
  ).toBeDisabled()
  await expect(page).toHaveURL(/\/species\/1$/)
  expect(api.count('animal.delete')).toBe(1)
})

test('S8: 삭제 뒤 종 상세 목록을 다시 받고, 지운 개체는 다시 조회한다', async ({
  page,
}) => {
  await page.goto('/species/1')
  await expect(row(page, '무궁이')).toBeVisible()
  await page.goto(detailUrl)
  await openDetailDelete(page)
  const listCount = api.count('animal.list')
  const detailCount = api.count('animal.detail')

  await confirm(page)
  await expect(page).toHaveURL(/\/species\/1$/)
  await expect.poll(() => api.count('animal.list')).toBeGreaterThan(listCount)

  await page.goto(detailUrl)
  await expect(page.getByText('개체를 찾을 수 없습니다.')).toBeVisible()
  expect(api.count('animal.detail')).toBeGreaterThan(detailCount)
})

test('S9: 취소하면 요청하지 않고 초점을 되돌린다', async ({ page }) => {
  await page.goto(detailUrl)
  await openDetailDelete(page)

  await dialog(page).getByRole('button', { name: '취소' }).click()

  await expect(dialog(page)).toHaveCount(0)
  await expect(detailTrigger(page)).toBeFocused()
  expect(api.count('animal.delete')).toBe(0)
})

test('S10: Contract 밖 응답은 삭제 실패다', async ({ page }) => {
  await page.route(animalItemPattern, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()
    await json(route, 200, {})
  })
  await page.goto(detailUrl)
  await openDetailDelete(page)

  await confirm(page)

  await expect(page.getByRole('alert')).toContainText(
    '데이터 삭제에 실패했습니다',
  )
  await expect(page).toHaveURL(/\/species\/1\/individuals\/12$/)
})

async function openDetailDelete(page: Page) {
  await detailTrigger(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(dialog(page)).toBeVisible()
}

function detailTrigger(page: Page) {
  return page.getByRole('button', { name: '무궁이 개체 메뉴 열기' })
}

async function confirm(page: Page) {
  await dialog(page).getByRole('button', { name: '확인' }).click()
}

function dialog(page: Page) {
  return page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
}

function row(page: Page, name: string) {
  return page.getByTestId('individual-row').filter({ hasText: name })
}

function deleteRequest() {
  const request = api.requests.find(
    ({ operation }) => operation === 'animal.delete',
  )
  if (!request) throw new Error('개체 삭제 요청이 없습니다.')
  return request
}
