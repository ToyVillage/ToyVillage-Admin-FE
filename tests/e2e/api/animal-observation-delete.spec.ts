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

// 승인된 시나리오(animal-observation-delete.test-scenarios.md)를 변환한 것.
// 개체 7 의 관찰은 12건(최신 31 `식욕 감소`)이다. 실패·지연은 `failNext`·`delay` 로 주입한다.

const detailUrl = `${observationIndividualUrl}/observations/31`

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-observation-delete-token')
  })
  api = await mockAnimalManageApi(page, {
    animals: observationAnimals(),
    observations: observationFixture(),
  })
})

test('S1: 관찰 상세에서 삭제하면 개체 상세로 가고 목록을 다시 받는다', async ({
  page,
}) => {
  await page.goto(detailUrl)
  await openDetailDelete(page)
  const listCount = api.count('observation.list')

  await confirm(page)

  await expect(page).toHaveURL(/\/species\/1\/individuals\/7$/)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  expect(api.count('observation.delete')).toBe(1)
  const request = deleteRequest()
  expect(request.url.pathname).toBe('/animal-manage/7/observations/31')
  expect(request.headers.authorization).toMatch(/^Bearer /)
  await expect
    .poll(() => api.count('observation.list'))
    .toBeGreaterThan(listCount)
  await expect(row(page, '식욕 감소')).toHaveCount(0)
})

test('S2: 개체 상세 표에서 삭제하면 머무르며 목록을 다시 받는다', async ({
  page,
}) => {
  await page.goto(observationIndividualUrl)
  await expect(row(page, '식욕 감소')).toBeVisible()
  const listCount = api.count('observation.list')

  await openRowDelete(page, '식욕 감소')
  await confirm(page)

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/species\/1\/individuals\/7$/)
  await expect(row(page, '식욕 감소')).toHaveCount(0)
  expect(api.count('observation.delete')).toBe(1)
  expect(api.count('observation.list')).toBeGreaterThan(listCount)
})

test('S3: 마지막 페이지의 마지막 행을 지우면 앞 페이지로 당긴다', async ({
  page,
}) => {
  api.observations = api.observations.filter(({ id }) => id !== 21)
  await page.goto(observationIndividualUrl)
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page)).toHaveCount(1)

  await openRowDelete(page, '관찰 20')
  await confirm(page)

  await expect(rows(page)).toHaveCount(10)
  await expect(page.getByRole('button', { name: /페이지$/ })).toHaveCount(0)
})

for (const status of [404, 500]) {
  test(`S4: 관찰 상세 삭제가 HTTP ${status} 이면 머무르고 초점을 되돌린다`, async ({
    page,
  }) => {
    await page.goto(detailUrl)
    await openDetailDelete(page)
    api.failNext('observation.delete', status)

    await confirm(page)

    await expect(dialog(page)).toHaveCount(0)
    await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
    await expect(page).toHaveURL(/\/observations\/31$/)
    await expect(detailTrigger(page)).toBeFocused()
  })
}

for (const status of [404, 500]) {
  test(`S5: 표 삭제가 HTTP ${status} 이면 행과 초점을 유지한다`, async ({
    page,
  }) => {
    await page.goto(observationIndividualUrl)
    await openRowDelete(page, '식욕 감소')
    api.failNext('observation.delete', status)

    await confirm(page)

    await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
    await expect(row(page, '식욕 감소')).toBeVisible()
    await expect(rowTrigger(page, '식욕 감소')).toBeFocused()
  })
}

test('S5: 표 삭제가 HTTP 403 이면 공통 인증 처리로 로그인으로 간다', async ({
  page,
}) => {
  await page.goto(observationIndividualUrl)
  await openRowDelete(page, '식욕 감소')
  api.failNext('observation.delete', 403)

  await confirm(page)

  await expect(page).toHaveURL(/\/login$/)
})

test('S6: 확인을 연속으로 눌러도 한 번만 삭제한다', async ({ page }) => {
  await page.goto(detailUrl)
  await openDetailDelete(page)
  api.delay('observation.delete', 800)

  await dialog(page).getByRole('button', { name: '확인' }).dblclick()

  await expect(
    dialog(page).getByRole('button', { name: '삭제 중' }),
  ).toBeDisabled()
  await expect(page).toHaveURL(/\/species\/1\/individuals\/7$/)
  expect(api.count('observation.delete')).toBe(1)
})

test('S7: 취소하면 요청하지 않는다', async ({ page }) => {
  await page.goto(detailUrl)
  await openDetailDelete(page)

  await dialog(page).getByRole('button', { name: '취소' }).click()

  await expect(dialog(page)).toHaveCount(0)
  expect(api.count('observation.delete')).toBe(0)
})

async function openDetailDelete(page: Page) {
  await detailTrigger(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(dialog(page)).toBeVisible()
}

async function openRowDelete(page: Page, title: string) {
  await rowTrigger(page, title).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(dialog(page)).toBeVisible()
}

function detailTrigger(page: Page) {
  return page.getByRole('button', { name: '식욕 감소 관찰 기록 메뉴 열기' })
}

function rowTrigger(page: Page, title: string) {
  return page.getByRole('button', { name: `${title} 관찰 메뉴 열기` })
}

async function confirm(page: Page) {
  await dialog(page).getByRole('button', { name: '확인' }).click()
}

function dialog(page: Page) {
  return page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
}

function rows(page: Page) {
  return page.getByTestId('observation-row')
}

function row(page: Page, title: string) {
  return rows(page).filter({ hasText: title })
}

function deleteRequest() {
  const request = api.requests.find(
    ({ operation }) => operation === 'observation.delete',
  )
  if (!request) throw new Error('관찰 삭제 요청이 없습니다.')
  return request
}
