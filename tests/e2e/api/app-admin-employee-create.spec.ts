import { expect, test, type Page } from '@playwright/test'
import { errorBody, mockEmployeeApi } from '../support/employee-api'

// 승인된 시나리오(app-admin-employee-create.test-scenarios.md)를 변환한 것.

const createUrl = '/settings/accounts/create'
const failure = '계정 생성에 실패했습니다'

const nameInput = (page: Page) => page.getByLabel('이름')
const usernameInput = (page: Page) => page.getByLabel('아이디')
const submitButton = (page: Page) =>
  page.getByRole('button', { name: '계정 생성' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'app-admin-employee-create-token')
  })
})

async function fillAndSubmit(page: Page) {
  await page.goto(createUrl)
  await nameInput(page).fill('  김직원 ')
  await usernameInput(page).fill(' employee01 ')
  await submitButton(page).click()
}

async function expectInputsKept(page: Page) {
  await expect(nameInput(page)).toHaveValue('  김직원 ')
  await expect(usernameInput(page)).toHaveValue(' employee01 ')
}

test('S1: 공백을 뺀 값으로 한 번 생성하고 입력을 비운다', async ({ page }) => {
  const api = await mockEmployeeApi(page)

  await fillAndSubmit(page)

  await expect(page.getByText('계정이 생성되었습니다')).toBeVisible()
  await expect(nameInput(page)).toHaveValue('')
  await expect(usernameInput(page)).toHaveValue('')
  await expect(nameInput(page)).toBeFocused()
  expect(api.requests).toHaveLength(1)
  expect(api.requests[0].body).toEqual({
    username: 'employee01',
    name: '김직원',
  })
  expect(api.requests[0].authorization).toBe(
    'Bearer app-admin-employee-create-token',
  )
})

test('S2: 409 이면 아이디 중복을 알리고 입력을 유지한다', async ({ page }) => {
  await mockEmployeeApi(page, {
    status: 409,
    body: errorBody(409, '이미 사용 중인 앱 관리자 아이디입니다.'),
  })

  await fillAndSubmit(page)

  await expect(page.getByText('이미 사용 중인 아이디입니다')).toBeVisible()
  await expect(page.getByText(failure)).toHaveCount(0)
  await expectInputsKept(page)
})

for (const [status, message] of [
  [400, '잘못된 요청입니다.'],
  [500, '내부 서버 오류가 발생했습니다.'],
] as const) {
  test(`S3: HTTP ${status} 이면 실패를 알리고 입력을 유지한다`, async ({
    page,
  }) => {
    await mockEmployeeApi(page, { status, body: errorBody(status, message) })

    await fillAndSubmit(page)

    await expect(page.getByText(failure)).toBeVisible()
    await expectInputsKept(page)
  })
}

test('S4: 201 이 아닌 성공 status 는 실패로 본다', async ({ page }) => {
  await mockEmployeeApi(page, { status: 200 })

  await fillAndSubmit(page)

  await expect(page.getByText(failure)).toBeVisible()
  await expectInputsKept(page)
})

test('S5: 형식이 다른 성공 응답은 실패로 본다', async ({ page }) => {
  await mockEmployeeApi(page, { body: {} })

  await fillAndSubmit(page)

  await expect(page.getByText(failure)).toBeVisible()
  await expectInputsKept(page)
})

test('S6: 요청 중에는 다시 요청하지 않는다', async ({ page }) => {
  const api = await mockEmployeeApi(page, { delay: 500 })
  await page.goto(createUrl)

  await nameInput(page).fill('김직원')
  await usernameInput(page).fill('employee01')
  await usernameInput(page).press('Enter')
  await usernameInput(page).press('Enter')
  await submitButton(page).click({ force: true })

  await expect(page.getByText('계정이 생성되었습니다')).toBeVisible()
  expect(api.requests).toHaveLength(1)
})

test('S7: 필수값이 비면 요청하지 않는다', async ({ page }) => {
  const api = await mockEmployeeApi(page)
  await page.goto(createUrl)

  await submitButton(page).click()

  await expect(page.getByText('이름을 입력해주세요!')).toBeVisible()
  expect(api.requests).toHaveLength(0)
})
