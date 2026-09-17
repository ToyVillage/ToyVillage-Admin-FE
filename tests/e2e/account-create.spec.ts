import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  mockEmployeeApi,
  type EmployeeApiHandle,
} from './support/employee-api'

// 승인된 시나리오(account-create.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 실제 서버 대신 `page.route` 가짜 서버(`support/employee-api`)로 제출 요청을 관찰한다.

const nameInput = (page: Page) => page.getByLabel('이름')
const usernameInput = (page: Page) => page.getByLabel('아이디')
const submitButton = (page: Page) =>
  page.getByRole('button', { name: '계정 생성' })

let api: EmployeeApiHandle

// 가짜 서버를 띄우고 요청을 기록한다.
// failSubmissions 가 true 면 서버 오류(500)로 응답한다.
async function trackSubmissions(page: Page, failSubmissions = false) {
  api = await mockEmployeeApi(
    page,
    failSubmissions
      ? { status: 500, body: errorBody(500, '내부 서버 오류가 발생했습니다.') }
      : { delay: 400 },
  )
}

async function submissions() {
  // 폼 입력 형태({ name, username })로 비교한다.
  return api.requests.map(({ body }) => {
    const { name, username } = body as { name: string; username: string }
    return { name, username }
  })
}

async function expectSubmissionCount(count: number) {
  await expect.poll(async () => (await submissions()).length).toBe(count)
}

test.beforeEach(async ({ page }) => {
  // 기본은 성공 응답. 시나리오가 trackSubmissions 로 다시 등록하면 그 route 가 먼저 매칭된다.
  api = await mockEmployeeApi(page)
})

test('S1: 계정 생성 화면을 표시한다', async ({ page }) => {
  await page.goto('/settings/accounts/create')

  await expect(page.getByRole('img', { name: '토이빌리지' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '계정 생성' })).toBeVisible()
  await expect(
    page.getByText('토이빌리지 직원 계정을 생성하세요'),
  ).toBeVisible()
  await expect(nameInput(page)).toBeVisible()
  await expect(usernameInput(page)).toBeVisible()
  await expect(
    page.getByText('*초기 비밀번호는 입력한 아이디와 동일하게 설정됩니다.'),
  ).toBeVisible()
  await expect(submitButton(page)).toBeVisible()
  await expect(page.getByText('이름을 입력해주세요!')).toHaveCount(0)
  await expect(page.getByText('아이디를 입력해주세요!')).toHaveCount(0)
})

test('S2: 빈 값으로 제출하면 두 필드 오류를 함께 표시한다', async ({
  page,
}) => {
  await trackSubmissions(page)
  await page.goto('/settings/accounts/create')

  await submitButton(page).click()

  await expect(page.getByText('이름을 입력해주세요!')).toBeVisible()
  await expect(page.getByText('아이디를 입력해주세요!')).toBeVisible()
  await expect(nameInput(page)).toHaveAttribute('aria-invalid', 'true')
  await expect(usernameInput(page)).toHaveAttribute('aria-invalid', 'true')
  await expect(nameInput(page)).toBeFocused()
  await expectSubmissionCount(0)
})

test('S3: 아이디만 비었으면 아이디 오류와 포커스를 연결한다', async ({
  page,
}) => {
  await trackSubmissions(page)
  await page.goto('/settings/accounts/create')

  await nameInput(page).fill('홍길동')
  await submitButton(page).click()

  await expect(page.getByText('이름을 입력해주세요!')).toHaveCount(0)
  await expect(page.getByText('아이디를 입력해주세요!')).toBeVisible()
  await expect(usernameInput(page)).toBeFocused()
  await expectSubmissionCount(0)
})

test('S4: 유효한 값은 공백을 제거해 한 번 제출한다', async ({ page }) => {
  await trackSubmissions(page)
  await page.goto('/settings/accounts/create')

  await nameInput(page).fill('  홍길동 ')
  await usernameInput(page).fill(' hong01  ')
  await submitButton(page).click()

  await expectSubmissionCount(1)
  expect(await submissions()).toEqual([
    { name: '홍길동', username: 'hong01' },
  ])
})

test('S5: 아이디 입력에서 Enter 로 제출한다', async ({ page }) => {
  await trackSubmissions(page)
  await page.goto('/settings/accounts/create')

  await nameInput(page).fill('홍길동')
  await usernameInput(page).fill('hong01')
  await usernameInput(page).press('Enter')

  await expectSubmissionCount(1)
})

test('S6: 제출에 성공하면 입력을 비우고 성공 토스트를 띄운다', async ({
  page,
}) => {
  await trackSubmissions(page)
  await page.goto('/settings/accounts/create')

  await nameInput(page).fill('홍길동')
  await usernameInput(page).fill('hong01')
  await submitButton(page).click()

  await expect(page.getByText('계정이 생성되었습니다')).toBeVisible()
  await expect(nameInput(page)).toHaveValue('')
  await expect(usernameInput(page)).toHaveValue('')
  await expect(nameInput(page)).toBeFocused()
})

test('S7: 입력한 필드의 오류만 사라진다', async ({ page }) => {
  await page.goto('/settings/accounts/create')

  await submitButton(page).click()
  await expect(page.getByText('이름을 입력해주세요!')).toBeVisible()

  await nameInput(page).fill('홍')

  await expect(page.getByText('이름을 입력해주세요!')).toHaveCount(0)
  await expect(page.getByText('아이디를 입력해주세요!')).toBeVisible()
})

test('S8: 공백만 입력하면 미입력으로 검증한다', async ({ page }) => {
  await trackSubmissions(page)
  await page.goto('/settings/accounts/create')

  await nameInput(page).fill('   ')
  await usernameInput(page).fill('  ')
  await submitButton(page).click()

  await expect(page.getByText('이름을 입력해주세요!')).toBeVisible()
  await expect(page.getByText('아이디를 입력해주세요!')).toBeVisible()
  await expectSubmissionCount(0)
})

test('S9: 제출 중에는 다시 제출하지 않는다', async ({ page }) => {
  await trackSubmissions(page)
  await page.goto('/settings/accounts/create')

  await nameInput(page).fill('홍길동')
  await usernameInput(page).fill('hong01')
  await usernameInput(page).press('Enter')
  await usernameInput(page).press('Enter')
  await submitButton(page).click({ force: true })

  await expect(page.getByText('계정이 생성되었습니다')).toBeVisible()
  await expectSubmissionCount(1)
})

test('S10: 제출에 실패하면 입력을 유지하고 실패 토스트를 띄운다', async ({
  page,
}) => {
  await trackSubmissions(page, true)
  await page.goto('/settings/accounts/create')

  await nameInput(page).fill('홍길동')
  await usernameInput(page).fill('hong01')
  await submitButton(page).click()

  await expect(page.getByText('계정 생성에 실패했습니다')).toBeVisible()
  await expect(nameInput(page)).toHaveValue('홍길동')
  await expect(usernameInput(page)).toHaveValue('hong01')
})

test('S11: 오류가 나타나도 버튼 위치가 변하지 않는다', async ({ page }) => {
  await page.goto('/settings/accounts/create')

  // click 이 버튼을 화면 안으로 스크롤하므로 뷰포트가 아닌 문서 기준 위치를 비교한다.
  const documentTop = () =>
    submitButton(page).evaluate(
      (element) => element.getBoundingClientRect().top + window.scrollY,
    )

  const before = await documentTop()
  await submitButton(page).click()
  await expect(page.getByText('아이디를 입력해주세요!')).toBeVisible()

  expect(await documentTop()).toBe(before)
})

test('S12: 키보드만으로 입력하고 제출한다', async ({ page }) => {
  await trackSubmissions(page)
  await page.goto('/settings/accounts/create')

  await nameInput(page).focus()
  await page.keyboard.type('홍길동')
  await page.keyboard.press('Tab')
  await expect(usernameInput(page)).toBeFocused()
  await page.keyboard.type('hong01')
  await page.keyboard.press('Tab')
  await expect(submitButton(page)).toBeFocused()
  await page.keyboard.press('Enter')

  await expectSubmissionCount(1)
})
