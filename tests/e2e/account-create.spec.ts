import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(account-create.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 mock 제출 경계만 관찰한다.

const submitEvent = 'toyvillage:create-account-submit'

const nameInput = (page: Page) => page.getByLabel('이름')
const usernameInput = (page: Page) => page.getByLabel('아이디')
const submitButton = (page: Page) =>
  page.getByRole('button', { name: '계정 생성' })

// mock 제출 함수가 보내는 이벤트로 호출 내용을 기록한다.
// failSubmissions 가 true 면 이벤트를 취소해 mock 이 실패하게 한다.
async function trackSubmissions(page: Page, failSubmissions = false) {
  await page.addInitScript(
    ({ eventName, fail }) => {
      const calls: unknown[] = []
      Object.assign(window, { __createAccountCalls: calls })
      window.addEventListener(eventName, (event) => {
        calls.push((event as CustomEvent).detail)
        if (fail) event.preventDefault()
      })
    },
    { eventName: submitEvent, fail: failSubmissions },
  )
}

async function submissions(page: Page) {
  return page.evaluate(
    () =>
      (window as unknown as { __createAccountCalls: unknown[] })
        .__createAccountCalls,
  )
}

async function expectSubmissionCount(page: Page, count: number) {
  await expect.poll(async () => (await submissions(page)).length).toBe(count)
}

test.beforeEach(async ({ page }) => {
  // 보호 화면의 API 요청이 실제 서버로 나가지 않게 막는다.
  await page.route(/^https:\/\//, (route) => route.abort())
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
  await expectSubmissionCount(page, 0)
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
  await expectSubmissionCount(page, 0)
})

test('S4: 유효한 값은 공백을 제거해 한 번 제출한다', async ({ page }) => {
  await trackSubmissions(page)
  await page.goto('/settings/accounts/create')

  await nameInput(page).fill('  홍길동 ')
  await usernameInput(page).fill(' hong01  ')
  await submitButton(page).click()

  await expectSubmissionCount(page, 1)
  expect(await submissions(page)).toEqual([
    { name: '홍길동', username: 'hong01' },
  ])
})

test('S5: 아이디 입력에서 Enter 로 제출한다', async ({ page }) => {
  await trackSubmissions(page)
  await page.goto('/settings/accounts/create')

  await nameInput(page).fill('홍길동')
  await usernameInput(page).fill('hong01')
  await usernameInput(page).press('Enter')

  await expectSubmissionCount(page, 1)
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
  await expectSubmissionCount(page, 0)
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
  await expectSubmissionCount(page, 1)
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

  await expectSubmissionCount(page, 1)
})
