import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(logout.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.

const sessionKeys = ['accessToken', 'refreshToken', 'toyvillage.session.user']

const sidebar = (page: Page) => page.getByRole('dialog', { name: '사이드바' })
const logoutButton = (page: Page) =>
  sidebar(page).getByRole('button', { name: '로그아웃', exact: true })

// 기본 storageState 는 accessToken 만 심는다. 로그아웃이 지우는 나머지 세션 값을 채운다.
// addInitScript 는 이동마다 다시 실행돼 로그아웃 뒤에도 세션을 되살리므로 쓰지 않는다.
async function seedSession(page: Page, path: string) {
  await page.goto(path)
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'logout-test-access-token')
    localStorage.setItem('refreshToken', 'logout-test-refresh-token')
    localStorage.setItem(
      'toyvillage.session.user',
      JSON.stringify({ name: '관리자 1', role: 'APP_ADMIN' }),
    )
  })
}

async function openSidebar(page: Page) {
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await expect(sidebar(page)).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  // 보호 화면의 API 요청이 실제 서버로 나가지 않게 막는다.
  await page.route(/^https:\/\//, (route) => route.abort())
})

test('S1: 사이드바 하단에 로그아웃 항목이 보인다', async ({ page }) => {
  await seedSession(page, '/')
  await openSidebar(page)

  await expect(logoutButton(page)).toBeVisible()
  await expect(logoutButton(page)).not.toHaveAttribute('aria-current', /.*/)
})

test('S2: 로그아웃하면 세션이 지워지고 로그인 화면으로 이동한다', async ({
  page,
}) => {
  await seedSession(page, '/')
  await openSidebar(page)

  await logoutButton(page).click()

  await expect(page).toHaveURL(/\/login$/)
  const stored = await page.evaluate(
    (keys) => keys.map((key) => localStorage.getItem(key)),
    sessionKeys,
  )
  expect(stored).toEqual([null, null, null])
})

test('S3: 로그아웃 후 뒤로 가기로 이전 화면에 돌아가지 않는다', async ({
  page,
}) => {
  await seedSession(page, '/tasks')
  await openSidebar(page)
  await logoutButton(page).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.goBack()

  await expect(page).not.toHaveURL(/\/tasks$/)
  await expect(sidebar(page)).toBeHidden()
  await expect(page.getByRole('button', { name: '사이드바 열기' })).toBeHidden()
})

test('S4: 로그아웃 후 인증이 필요한 경로에 직접 들어가면 로그인 화면으로 간다', async ({
  page,
}) => {
  await seedSession(page, '/')
  await openSidebar(page)
  await logoutButton(page).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
})

test('S5: 화면 높이가 낮아도 로그아웃 항목이 패널 안에 남는다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 })
  await seedSession(page, '/')
  await openSidebar(page)

  await sidebar(page)
    .getByRole('button', { name: '공지사항', exact: true })
    .click()

  await expect(logoutButton(page)).toBeInViewport({ ratio: 1 })
  await logoutButton(page).click({ trial: true })
})
