import { expect, test, type Page } from '@playwright/test'
import {
  mockAnimalManageApi,
  type AnimalManageApiHandle,
} from '../support/animal-manage-api'
import {
  addLegalButton,
  deleteDialog,
  fillRequired,
  legalPill,
  legalRemoveButton,
  legalStatusFixture,
  submitButton,
} from '../support/species-form-page'

// 승인된 시나리오(animal-legal-status-delete.test-scenarios.md)를 변환한 것.
// 공용 목록 기본값은 `천연기념물`(1)·`국제보호종`(5)이다.

const deleteFailure = '삭제하지 못했습니다. 다시 시도해 주세요.'

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'animal-legal-status-delete-token')
  })
  api = await mockAnimalManageApi(page, {
    legalStatuses: legalStatusFixture(),
  })
  await page.goto('/species/create')
  await expect(legalPill(page, '국제보호종')).toBeVisible()
})

test('S1: 확인하면 한 번 삭제하고 목록을 다시 받아 선택에서도 뺀다', async ({
  page,
}) => {
  await legalPill(page, '국제보호종').click()
  const listCount = api.count('legalStatus.list')

  await deleteSelected(page)

  await expect(legalPill(page, '국제보호종')).toHaveCount(0)
  await expect(addLegalButton(page)).toBeFocused()
  expect(api.count('legalStatus.delete')).toBe(1)
  const request = api.requests.find(
    ({ operation }) => operation === 'legalStatus.delete',
  )
  expect(request?.url.pathname).toBe('/animal-manage/legal-status/5')
  expect(request?.headers.authorization).toMatch(/^Bearer /)
  expect(api.count('legalStatus.list')).toBeGreaterThan(listCount)
})

test('S2: 취소하면 요청하지 않고 초점을 ✕ 로 되돌린다', async ({ page }) => {
  await legalRemoveButton(page, '국제보호종').click()

  await deleteDialog(page).getByRole('button', { name: '취소' }).click()

  await expect(deleteDialog(page)).toHaveCount(0)
  await expect(legalPill(page, '국제보호종')).toBeVisible()
  await expect(legalRemoveButton(page, '국제보호종')).toBeFocused()
  expect(api.count('legalStatus.delete')).toBe(0)
})

for (const [id, status] of [
  ['S3', 404],
  ['S4', 500],
] as const) {
  test(`${id}: HTTP ${status} 이면 모달을 닫고 선택을 유지한 채 실패를 알린다`, async ({
    page,
  }) => {
    await legalPill(page, '국제보호종').click()
    api.failNext('legalStatus.delete', status)

    await deleteSelected(page)

    await expect(deleteDialog(page)).toHaveCount(0)
    await expect(page.getByRole('alert')).toContainText(deleteFailure)
    await expect(legalPill(page, '국제보호종')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
}

test('S4: HTTP 403 이면 공통 인증 처리로 로그인으로 간다', async ({ page }) => {
  api.failNext('legalStatus.delete', 403)

  await deleteSelected(page)

  await expect(page).toHaveURL(/\/login$/)
})

test('S5: 확인을 연속으로 눌러도 한 번만 삭제한다', async ({ page }) => {
  api.delay('legalStatus.delete', 800)
  await legalRemoveButton(page, '국제보호종').click()

  await deleteDialog(page).getByRole('button', { name: '확인' }).dblclick()

  await expect(
    deleteDialog(page).getByRole('button', { name: '삭제 중' }),
  ).toBeDisabled()
  await expect(legalPill(page, '국제보호종')).toHaveCount(0)
  expect(api.count('legalStatus.delete')).toBe(1)
})

test('S6: 공용 목록 항목은 모두 ✕ 로 지울 수 있다', async ({ page }) => {
  for (const name of ['천연기념물', '국제보호종']) {
    await expect(legalPill(page, name)).toBeVisible()
    await expect(legalRemoveButton(page, name)).toHaveCount(1)
  }
})

test('S7: 삭제한 분류는 종 생성 요청에 들어가지 않는다', async ({ page }) => {
  await legalPill(page, '국제보호종').click()
  await deleteSelected(page)
  await expect(legalPill(page, '국제보호종')).toHaveCount(0)
  await fillRequired(page)

  await submitButton(page).click()

  await expect(page).toHaveURL(/\/species$/)
  const create = api.requests.find(
    ({ operation }) => operation === 'kind.create',
  )
  expect(create?.body).not.toHaveProperty('animalLegalDesignation')
})

async function deleteSelected(page: Page) {
  await legalRemoveButton(page, '국제보호종').click()
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()
}
