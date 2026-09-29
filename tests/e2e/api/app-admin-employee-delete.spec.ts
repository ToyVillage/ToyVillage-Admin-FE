import { expect, test, type Page } from '@playwright/test'
import {
  mockEmployeeApi,
  type EmployeeApiOptions,
} from '../support/employee-api'

// 승인된 시나리오(app-admin-employee-delete.test-scenarios.md)를 변환한 것.
// 대상: DELETE /app/admin/employees/{appAdminId}. 실제 서버는 호출하지 않는다.

const rows = (page: Page) => page.getByTestId('staff-account-row')
const kebab = (page: Page, name: string) =>
  page.getByRole('button', { name: `${name} 계정 메뉴` })
const confirmDialog = (page: Page) => page.getByRole('alertdialog')
const total = (page: Page, count: number) =>
  page.getByText(`총 ${count}명`, { exact: true })

async function openList(
  page: Page,
  options?: EmployeeApiOptions,
  path = '/settings/accounts',
) {
  const api = await mockEmployeeApi(page, options)
  await page.goto(path)
  await expect(rows(page).first()).toBeVisible()
  return api
}

async function requestDelete(page: Page, name: string) {
  await kebab(page, name).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(confirmDialog(page)).toBeVisible()
}

test('S1: 삭제 성공', async ({ page }) => {
  const api = await openList(page)

  await requestDelete(page, '이승현')
  await confirmDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(confirmDialog(page)).toBeHidden()
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  expect(api.deletes).toHaveLength(1)
  expect(api.deletes[0].id).toBe(2)
  expect(api.deletes[0].authorization).toMatch(/^Bearer /)
  await expect(rows(page).filter({ hasText: '이승현' })).toHaveCount(0)
  await expect(total(page, 11)).toBeVisible()
})

test('S2: 취소', async ({ page }) => {
  const api = await openList(page)

  await requestDelete(page, '이승현')
  await confirmDialog(page).getByRole('button', { name: '취소' }).click()

  await expect(confirmDialog(page)).toBeHidden()
  expect(api.deletes).toHaveLength(0)
  await expect(rows(page).filter({ hasText: '이승현' })).toHaveCount(1)
})

for (const status of [404, 500]) {
  test(`S3: ${status} 이면 실패 토스트를 띄우고 행을 남긴다`, async ({
    page,
  }) => {
    await openList(page, { deleteStatus: status })

    await requestDelete(page, '이승현')
    await confirmDialog(page).getByRole('button', { name: '확인' }).click()

    await expect(confirmDialog(page)).toBeHidden()
    await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
    await expect(rows(page).filter({ hasText: '이승현' })).toHaveCount(1)
    await expect(kebab(page, '이승현')).toBeFocused()
  })
}

test('S4: 중복 방지', async ({ page }) => {
  const api = await openList(page, { deleteDelay: 800 })

  await requestDelete(page, '이승현')
  const confirm = confirmDialog(page).getByRole('button', {
    name: /확인|삭제 중/,
  })
  await confirm.click()
  await expect(confirm).toBeDisabled()
  await confirm.click({ force: true })

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  expect(api.deletes).toHaveLength(1)
})

test('S5: 마지막 페이지를 비우면 앞 페이지로', async ({ page }) => {
  const api = await openList(page, undefined, '/settings/accounts?page=3')
  await expect(rows(page)).toHaveCount(2)

  for (const name of ['서지훈', '임다은']) {
    await requestDelete(page, name)
    await confirmDialog(page).getByRole('button', { name: '확인' }).click()
    await expect(confirmDialog(page)).toBeHidden()
  }

  expect(api.deletes).toHaveLength(2)
  await expect(page).toHaveURL(/[?&]page=2(&|$)/)
  await expect(rows(page)).toHaveCount(5)
  await expect(total(page, 10)).toBeVisible()
})
