import { expect, test, type Page } from '@playwright/test'
import {
  mockEmployeeApi,
  type EmployeeApiOptions,
} from '../support/employee-api'

// 승인된 시나리오(app-admin-employee-password-reset.test-scenarios.md)를 변환한 것.
// 대상: PATCH /app/admin/employees/{appAdminId}/password. 실제 서버는 호출하지 않는다.

const kebab = (page: Page) =>
  page.getByRole('button', { name: '김수인 계정 메뉴' })
const confirmDialog = (page: Page) => page.getByRole('alertdialog')

async function openReset(page: Page, options?: EmployeeApiOptions) {
  const api = await mockEmployeeApi(page, options)
  await page.goto('/settings/accounts')
  await kebab(page).click()
  await page.getByRole('menuitem', { name: '비밀번호 초기화' }).click()
  await expect(confirmDialog(page)).toContainText(
    '비밀번호를 초기화하시겠습니까?',
  )
  return api
}

test('S1: 초기화 성공', async ({ page }) => {
  const api = await openReset(page)
  const row = page
    .getByTestId('staff-account-row')
    .filter({ hasText: '김수인' })
  await expect(row).toContainText('변경 완료')
  const lists = api.lists

  await confirmDialog(page).getByRole('button', { name: '초기화' }).click()

  await expect(confirmDialog(page)).toBeHidden()
  await expect(page.getByText('비밀번호 초기화에 성공했습니다')).toBeVisible()
  expect(api.resets).toHaveLength(1)
  expect(api.resets[0].id).toBe(1)
  expect(api.resets[0].authorization).toMatch(/^Bearer /)
  await expect.poll(() => api.lists).toBeGreaterThan(lists)
  await expect(row).toContainText('초기 비밀번호')
})

test('S2: 취소', async ({ page }) => {
  const api = await openReset(page)

  await confirmDialog(page).getByRole('button', { name: '취소' }).click()

  await expect(confirmDialog(page)).toBeHidden()
  expect(api.resets).toHaveLength(0)
})

for (const status of [404, 500]) {
  test(`S3: ${status} 이면 실패 토스트`, async ({ page }) => {
    await openReset(page, { resetStatus: status })

    await confirmDialog(page).getByRole('button', { name: '초기화' }).click()

    await expect(confirmDialog(page)).toBeHidden()
    await expect(page.getByText('비밀번호 초기화에 실패했습니다')).toBeVisible()
    await expect(kebab(page)).toBeFocused()
  })
}

test('S4: 중복 방지', async ({ page }) => {
  const api = await openReset(page, { resetDelay: 800 })
  const confirm = confirmDialog(page).getByRole('button', {
    name: /^초기화( 중)?$/,
  })

  await confirm.click()
  await expect(confirm).toHaveText('초기화 중')
  await expect(confirm).toBeDisabled()
  await confirm.click({ force: true })

  await expect(page.getByText('비밀번호 초기화에 성공했습니다')).toBeVisible()
  expect(api.resets).toHaveLength(1)
})
