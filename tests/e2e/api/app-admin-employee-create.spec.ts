import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  mockEmployeeApi,
  type EmployeeApiOptions,
} from '../support/employee-api'

// 승인된 시나리오(app-admin-employee-create.test-scenarios.md, 2026-09-29 개정)를 변환한 것.
// 대상: POST /app/admin/employees — 직원 계정 관리 화면의 `계정 생성` 모달. 성공은 201 만 인정한다.

const dialog = (page: Page) => page.getByRole('dialog', { name: '계정 생성' })
const nameInput = (page: Page) => dialog(page).getByLabel('이름')
const usernameInput = (page: Page) => dialog(page).getByLabel('아이디')
const submit = (page: Page) =>
  dialog(page).getByRole('button', { name: '계정 생성' })
const failure = '데이터 생성에 실패했습니다'

async function openCreate(page: Page, options?: EmployeeApiOptions) {
  const api = await mockEmployeeApi(page, options)
  await page.goto('/settings/accounts')
  await expect(page.getByText('총 12명', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '계정 생성하기' }).click()
  await expect(dialog(page)).toBeVisible()
  return api
}

async function fillAndSubmit(page: Page) {
  await nameInput(page).fill('  김직원 ')
  await usernameInput(page).fill(' employee01 ')
  await submit(page).click()
}

test('S1: 생성 성공', async ({ page }) => {
  const api = await openCreate(page)
  const lists = api.lists

  await fillAndSubmit(page)

  await expect(dialog(page)).toBeHidden()
  await expect(page.getByText('계정 생성에 성공했습니다')).toBeVisible()
  expect(api.requests).toHaveLength(1)
  expect(api.requests[0].body).toEqual({
    username: 'employee01',
    name: '김직원',
  })
  expect(api.requests[0].authorization).toMatch(/^Bearer /)
  await expect.poll(() => api.lists).toBeGreaterThan(lists)
  await expect(page.getByText('총 13명', { exact: true })).toBeVisible()
  await page
    .getByRole('searchbox', { name: '이름 또는 아이디 검색' })
    .fill('employee01')
  await expect(page.getByTestId('staff-account-row')).toContainText(['김직원'])
})

test('S2: 아이디 중복(409)', async ({ page }) => {
  const api = await openCreate(page, {
    status: 409,
    body: errorBody(409, '이미 사용 중인 앱 관리자 아이디입니다.'),
  })

  await fillAndSubmit(page)

  await expect(dialog(page).getByRole('alert')).toHaveText([
    '이미 사용 중인 아이디예요',
  ])
  await expect(usernameInput(page)).toBeFocused()
  await expect(page.getByText('총 12명', { exact: true })).toBeAttached()
  expect(api.requests).toHaveLength(1)
})

for (const status of [400, 500]) {
  test(`S3: ${status} 이면 입력을 유지하고 실패 토스트`, async ({ page }) => {
    await openCreate(page, {
      status,
      body: errorBody(status, '요청을 처리하지 못했습니다.'),
    })

    await fillAndSubmit(page)

    await expect(page.getByText(failure)).toBeVisible()
    await expect(dialog(page)).toBeVisible()
    await expect(nameInput(page)).toHaveValue('  김직원 ')
    await expect(usernameInput(page)).toHaveValue(' employee01 ')
  })
}

test('S4: 201 이 아닌 성공 status(200)', async ({ page }) => {
  await openCreate(page, {
    status: 200,
    body: { message: '직원이 생성되었습니다.' },
  })

  await fillAndSubmit(page)

  await expect(page.getByText(failure)).toBeVisible()
  await expect(dialog(page)).toBeVisible()
})

test('S5: 형식이 다른 성공 응답', async ({ page }) => {
  await openCreate(page, { status: 201, body: {} })

  await fillAndSubmit(page)

  await expect(page.getByText(failure)).toBeVisible()
  await expect(dialog(page)).toBeVisible()
})

test('S6: 검증 실패와 중복 제출', async ({ page }) => {
  const api = await openCreate(page, { delay: 800 })

  await submit(page).click()
  await expect(dialog(page).getByRole('alert')).toHaveCount(2)
  expect(api.requests).toHaveLength(0)

  await nameInput(page).fill('김직원')
  await usernameInput(page).fill('employee01')
  await submit(page).click()
  await expect(submit(page)).toBeDisabled()
  await usernameInput(page).press('Enter')
  await submit(page).click({ force: true })

  await expect(dialog(page)).toBeHidden()
  expect(api.requests).toHaveLength(1)
})
