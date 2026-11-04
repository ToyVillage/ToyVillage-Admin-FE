import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  mockEmployeeApi,
  permissionEmployees,
  type EmployeeApiOptions,
  type MockEmployeeRole,
} from '../support/employee-api'

// 승인된 시나리오(app-admin-employee-role-change.test-scenarios.md)를 변환한 것.
// 대상: PATCH /app/admin/employees/{appAdminId}/role. 실제 서버는 호출하지 않는다.

const rows = (page: Page) => page.getByTestId('middle-manager-row')
const row = (page: Page, name: string) => rows(page).filter({ hasText: name })
const total = (page: Page, count: number) =>
  page.getByText(`총 ${count}명`, { exact: true })
const assignTrigger = (page: Page) =>
  page.getByRole('button', { name: '중간 관리자 지정' })
const releaseTrigger = (page: Page, name: string) =>
  page.getByRole('button', { name: `${name} 중간 관리자 해제` })
const dialog = (page: Page) =>
  page.getByRole('dialog', { name: '중간 관리자 지정' })
const candidate = (page: Page, name: string) =>
  dialog(page).getByRole('radio', { name })
const candidateRow = (page: Page, name: string) =>
  dialog(page).getByText(name, { exact: true })
const submitButton = (page: Page) =>
  dialog(page).getByRole('button', { name: '지정하기', exact: true })
const confirmDialog = (page: Page) => page.getByRole('alertdialog')
const confirmButton = (page: Page, name: string) =>
  confirmDialog(page).getByRole('button', { name, exact: true })

const withRole = (role: MockEmployeeRole) =>
  permissionEmployees.map((item) => ({ ...item, role }))

async function openList(page: Page, options?: EmployeeApiOptions) {
  const api = await mockEmployeeApi(page, {
    employees: permissionEmployees.map((item) => ({ ...item })),
    ...options,
  })
  await page.goto('/settings/permissions')
  return api
}

async function openAssign(page: Page, options?: EmployeeApiOptions) {
  const api = await openList(page, options)
  await expect(row(page, '김수인')).toBeVisible()
  await assignTrigger(page).click()
  await expect(dialog(page)).toBeVisible()
  return api
}

async function openRelease(page: Page, options?: EmployeeApiOptions) {
  const api = await openList(page, options)
  await releaseTrigger(page, '김수인').click()
  await expect(confirmDialog(page)).toBeVisible()
  return api
}

test('S1: 목록과 후보를 role 로 나눈다', async ({ page }) => {
  const api = await openAssign(page)

  expect(api.lists).toBe(1)
  await expect(rows(page)).toHaveCount(3)
  await expect(rows(page).nth(0)).toContainText('김수인')
  await expect(rows(page).nth(1)).toContainText('이승현')
  await expect(rows(page).nth(2)).toContainText('이지아')
  await expect(total(page, 3)).toBeVisible()
  await expect(page.getByText('지정일', { exact: true })).toHaveCount(0)

  await expect(dialog(page).getByRole('radio')).toHaveCount(5)
  for (const name of ['박도현', '최민지', '정하윤', '오세훈', '한지민']) {
    await expect(candidate(page, name)).toBeVisible()
  }
})

test('S2: 지정 성공', async ({ page }) => {
  const api = await openAssign(page)
  const lists = api.lists

  await candidateRow(page, '최민지').click()
  await candidateRow(page, '박도현').click()
  await submitButton(page).click()

  await expect(dialog(page)).toBeHidden()
  await expect(page.getByText('권한 부여에 성공했습니다')).toBeVisible()
  expect(api.roleChanges).toHaveLength(1)
  expect(api.roleChanges[0].id).toBe(4)
  expect(api.roleChanges[0].body).toEqual({ role: 'MIDDLE_ADMIN' })
  expect(api.roleChanges[0].authorization).toMatch(/^Bearer /)
  await expect.poll(() => api.lists).toBeGreaterThan(lists)
  await expect(row(page, '박도현')).toBeVisible()
  await expect(total(page, 4)).toBeVisible()
})

for (const status of [404, 500]) {
  test(`S3: 지정 ${status} 이면 모달과 선택을 유지한다`, async ({ page }) => {
    await openAssign(page, { roleStatus: status })

    await candidateRow(page, '박도현').click()
    await submitButton(page).click()

    await expect(page.getByText('권한 부여에 실패했습니다')).toBeVisible()
    await expect(dialog(page)).toBeVisible()
    await expect(candidate(page, '박도현')).toBeChecked()
    await expect(submitButton(page)).toBeEnabled()
    await expect(total(page, 3)).toBeVisible()
  })
}

test('S4: 해제 성공', async ({ page }) => {
  const api = await openRelease(page)
  const lists = api.lists

  await confirmButton(page, '해제').click()

  await expect(confirmDialog(page)).toBeHidden()
  await expect(page.getByText('권한 해제에 성공했습니다')).toBeVisible()
  expect(api.roleChanges).toHaveLength(1)
  expect(api.roleChanges[0].id).toBe(1)
  expect(api.roleChanges[0].body).toEqual({ role: 'EMPLOYEE' })
  expect(api.roleChanges[0].authorization).toMatch(/^Bearer /)
  await expect.poll(() => api.lists).toBeGreaterThan(lists)
  await expect(row(page, '김수인')).toHaveCount(0)
  await expect(total(page, 2)).toBeVisible()

  await assignTrigger(page).click()
  await expect(candidate(page, '김수인')).toBeVisible()
})

test('S5: 해제 취소', async ({ page }) => {
  const api = await openRelease(page)

  await confirmButton(page, '취소').click()

  await expect(confirmDialog(page)).toBeHidden()
  expect(api.roleChanges).toHaveLength(0)
})

for (const status of [404, 500]) {
  test(`S6: 해제 ${status} 이면 실패 토스트`, async ({ page }) => {
    await openRelease(page, { roleStatus: status })

    await confirmButton(page, '해제').click()

    await expect(confirmDialog(page)).toBeHidden()
    await expect(page.getByText('권한 해제에 실패했습니다')).toBeVisible()
    await expect(row(page, '김수인')).toBeVisible()
    await expect(releaseTrigger(page, '김수인')).toBeFocused()
  })
}

test('S7: 지정 중복 제출 방지', async ({ page }) => {
  const api = await openAssign(page, { roleDelay: 800 })

  await candidateRow(page, '박도현').click()
  await submitButton(page).click()

  await expect(submitButton(page)).toBeDisabled()
  await expect(
    dialog(page).getByRole('button', { name: '취소', exact: true }),
  ).toBeDisabled()
  await expect(dialog(page)).toHaveAttribute('aria-busy', 'true')

  await expect(dialog(page)).toBeHidden()
  expect(api.roleChanges).toHaveLength(1)
})

test('S7-1: 해제 중복 제출 방지', async ({ page }) => {
  const api = await openRelease(page, { roleDelay: 800 })

  await confirmButton(page, '해제').click()

  const pending = confirmButton(page, '해제 중')
  await expect(pending).toBeDisabled()

  await expect(confirmDialog(page)).toBeHidden()
  expect(api.roleChanges).toHaveLength(1)
})

test('S8: 지정 응답 형식 오류', async ({ page }) => {
  await openAssign(page, { roleBody: {} })

  await candidateRow(page, '박도현').click()
  await submitButton(page).click()

  await expect(page.getByText('권한 부여에 실패했습니다')).toBeVisible()
  await expect(dialog(page)).toBeVisible()
  await expect(candidate(page, '박도현')).toBeChecked()
})

test('S8-1: 해제 응답 형식 오류', async ({ page }) => {
  await openRelease(page, { roleBody: {} })

  await confirmButton(page, '해제').click()

  await expect(confirmDialog(page)).toBeHidden()
  await expect(page.getByText('권한 해제에 실패했습니다')).toBeVisible()
  await expect(row(page, '김수인')).toBeVisible()
})

const loadError = '중간 관리자 목록을 불러오지 못했습니다. 다시 시도해 주세요.'

test('S9: 목록 조회 실패(500)', async ({ page }) => {
  await openList(page, {
    listStatus: 500,
    listBody: errorBody(500, '내부 서버 오류가 발생했습니다.'),
  })

  await expect(page.getByText(loadError)).toBeVisible()
  await expect(rows(page)).toHaveCount(0)
})

for (const [label, role] of [
  ['role 없음', undefined],
  ['허용값이 아닌 role', 'BOSS'],
] as const) {
  test(`S9-1: 형식 오류(${label})`, async ({ page }) => {
    await openList(page, {
      listBody: [
        {
          id: 1,
          username: 'suin.kim',
          name: '김수인',
          role,
          createAt: '2026-01-02',
          passwordChanged: true,
        },
      ],
    })

    await expect(page.getByText(loadError)).toBeVisible()
  })
}

test('S10: 중간 관리자가 없으면 빈 상태', async ({ page }) => {
  await openList(page, { employees: withRole('EMPLOYEE') })

  await expect(page.getByText('지정된 중간 관리자가 없어요')).toBeVisible()
  await expect(page.getByText(/^총 \d+명$/)).toHaveCount(0)
})

test('S10-1: 지정 후보가 없으면 안내 문구', async ({ page }) => {
  await openList(page, { employees: withRole('MIDDLE_ADMIN') })
  await expect(rows(page)).toHaveCount(8)

  await assignTrigger(page).click()

  await expect(
    dialog(page).getByText('지정할 수 있는 직원이 없습니다'),
  ).toBeVisible()
  await expect(submitButton(page)).toBeDisabled()
})
