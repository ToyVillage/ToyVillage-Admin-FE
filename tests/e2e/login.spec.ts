import { expect, test, type Page } from '@playwright/test'

const loginMockResultKey = 'toyvillage.login.mockResult'

test.beforeEach(async ({ page }) => {
  await trackLoginSubmissions(page)
  await page.goto('/login')
})

test('S1: 로그인 화면을 표시하고 전역 사이드바는 제외한다', async ({
  page,
}) => {
  await expect(page.getByRole('img', { name: '토이빌리지' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()
  await expect(
    page.getByText('토이빌리지 관리자에 로그인하고'),
  ).toBeVisible()
  await expect(page.getByLabel('아이디')).toBeVisible()
  await expect(passwordInput(page)).toBeVisible()
  await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
  await expect(page.getByRole('button', { name: '사이드바 열기' })).toHaveCount(
    0,
  )
})

test('S2: 비밀번호 값과 포커스를 유지하며 표시 상태를 전환한다', async ({
  page,
}) => {
  const password = passwordInput(page)
  await password.fill('secret value')
  await expect(password).toHaveAttribute('type', 'password')

  await page.getByRole('button', { name: '비밀번호 표시' }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await expect(password).toHaveValue('secret value')
  await expect(password).toBeFocused()

  await page.getByRole('button', { name: '비밀번호 숨기기' }).click()
  await expect(password).toHaveAttribute('type', 'password')
  await expect(password).toHaveValue('secret value')
  await expect(password).toBeFocused()
})

test('S3: 아이디가 비어 있으면 아이디 오류와 포커스를 연결한다', async ({
  page,
}) => {
  await page.getByRole('button', { name: '로그인' }).click()

  const username = page.getByLabel('아이디')
  await expect(username).toBeFocused()
  await expect(username).toHaveAttribute('aria-invalid', 'true')
  await expect(username).toHaveCSS('border-color', 'rgb(255, 49, 49)')
  await expect(page.getByText('아이디를 입력해주세요')).toBeVisible()
  await expectLoginSubmissionCount(page, 0)
})

test('S4: 비밀번호가 비어 있으면 비밀번호 오류와 포커스를 연결한다', async ({
  page,
}) => {
  await page.getByLabel('아이디').fill('admin')
  await page.getByRole('button', { name: '로그인' }).click()

  const password = passwordInput(page)
  await expect(password).toBeFocused()
  await expect(password).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('비밀번호를 입력해주세요')).toBeVisible()
  await expectLoginSubmissionCount(page, 0)
})

test('S5: 정규화한 아이디와 원본 비밀번호를 한 번 제출한다', async ({
  page,
}) => {
  await page.getByLabel('아이디').fill('  admin  ')
  await passwordInput(page).fill('  password  ')
  await expect(page.getByLabel('아이디')).toHaveValue('  admin  ')
  await expect(passwordInput(page)).toHaveValue('  password  ')
  await page.getByRole('button', { name: '로그인' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expectLoginSubmissionCount(page, 1)
})

test('S6: 비밀번호 입력의 Enter로 한 번 제출한다', async ({ page }) => {
  await page.getByLabel('아이디').fill('admin')
  await passwordInput(page).fill('password')
  await passwordInput(page).press('Enter')

  await expect(page).toHaveURL(/\/$/)
  await expectLoginSubmissionCount(page, 1)
})

test('S7: 로그인 제출 성공 후 홈으로 이동한다', async ({ page }) => {
  await fillValidCredentials(page)
  await page.getByRole('button', { name: '로그인' }).click()

  await expect(page).toHaveURL(/\/$/)
})

test('S8: 제출 중 연속 submit에도 한 번만 제출한다', async ({ page }) => {
  await fillValidCredentials(page)
  const submit = page.getByRole('button', { name: '로그인' })

  await submit.evaluate((button) => {
    const form = button.closest('form')
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })

  await expect(page.getByRole('button', { name: '로그인 중' })).toBeDisabled()
  await expectLoginSubmissionCount(page, 1)
})

test('S9: 제출 실패 후 아이디를 유지하고 비밀번호를 비운다', async ({
  page,
}) => {
  await page.evaluate((key) => sessionStorage.setItem(key, 'failure'), loginMockResultKey)
  await fillValidCredentials(page)
  await page.getByRole('button', { name: '로그인' }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByLabel('아이디')).toHaveValue('admin')
  await expect(passwordInput(page)).toHaveValue('')
  await expect(passwordInput(page)).toBeFocused()
})

test('S10: 공백 아이디를 빈 값으로 검증한다', async ({ page }) => {
  await page.getByLabel('아이디').fill('   ')
  await passwordInput(page).fill('password')
  await page.getByRole('button', { name: '로그인' }).click()

  await expect(page.getByLabel('아이디')).toBeFocused()
  await expectLoginSubmissionCount(page, 0)
})

test('S11: 키보드만으로 입력, 표시 전환과 제출을 조작한다', async ({
  page,
}) => {
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('아이디')).toBeFocused()
  await page.keyboard.type('admin')

  await page.keyboard.press('Tab')
  await expect(passwordInput(page)).toBeFocused()
  await page.keyboard.type('password')

  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: '비밀번호 표시' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')

  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '로그인' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/$/)
})

async function fillValidCredentials(page: Page) {
  await page.getByLabel('아이디').fill('admin')
  await passwordInput(page).fill('password')
}

function passwordInput(page: Page) {
  return page.getByRole('textbox', { name: '비밀번호', exact: true })
}

async function trackLoginSubmissions(page: Page) {
  await page.addInitScript(() => {
    const testWindow = window as typeof window & {
      __loginSubmissionCount?: number
    }
    testWindow.__loginSubmissionCount = 0
    window.addEventListener('toyvillage:login-submit', () => {
      testWindow.__loginSubmissionCount =
        (testWindow.__loginSubmissionCount ?? 0) + 1
    })
  })
}

async function expectLoginSubmissionCount(page: Page, expected: number) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (
            window as typeof window & {
              __loginSubmissionCount?: number
            }
          ).__loginSubmissionCount ?? 0,
      ),
    )
    .toBe(expected)
}
