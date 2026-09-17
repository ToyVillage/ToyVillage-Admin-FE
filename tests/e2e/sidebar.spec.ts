import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(sidebar.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.

const sidebar = (page: Page) => page.getByRole('dialog', { name: '사이드바' })
const group = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true })

// 보호 경로라 토큰이 필요하고, 프로필 이름은 로그인 때 저장한 세션 사용자에서 온다.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'sidebar-test-token')
    localStorage.setItem(
      'toyvillage.session.user',
      JSON.stringify({ name: '김직원', role: 'EMPLOYEE' }),
    )
  })
})

async function openSidebar(page: Page, path: string) {
  await page.goto(path)
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await expect(sidebar(page)).toBeVisible()
}

test('S1: 사이드바 열기와 닫기', async ({ page }) => {
  await openSidebar(page, '/notices/list')
  await expect(sidebar(page).getByText('김직원')).toBeVisible()
  await expect(
    sidebar(page).getByRole('img', { name: '김직원 프로필' }),
  ).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(sidebar(page)).toBeHidden()
})

test('S1-1: 세션 사용자 정보가 없으면 기본 이름을 보인다', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('toyvillage.session.user')
  })
  await openSidebar(page, '/notices/list')

  await expect(sidebar(page).getByText('사용자', { exact: true })).toBeVisible()
  await expect(
    sidebar(page).getByRole('img', { name: '사용자 프로필' }),
  ).toBeVisible()
})

test('S2: 대분류를 펼쳐 하위 메뉴로 이동', async ({ page }) => {
  // `/` 는 어느 대분류에도 속하지 않아 모두 접힌 상태로 열린다.
  await openSidebar(page, '/')

  await group(page, '공지사항').click()
  await page.getByRole('link', { name: '자료실', exact: true }).click()

  await expect(page).toHaveURL(/\/notices\/resources$/)
  await expect(sidebar(page)).toBeHidden()
})

test('S3: 한 번에 하나의 대분류만 펼쳐진다', async ({ page }) => {
  await openSidebar(page, '/')

  await group(page, '공지사항').click()
  await expect(page.getByRole('link', { name: '단체예약' })).toBeVisible()

  await group(page, '재고관리').click()
  await expect(page.getByText('사육용품')).toBeVisible()
  await expect(page.getByRole('link', { name: '단체예약' })).toBeHidden()
})

test('S4: 같은 대분류를 다시 누르면 접힌다', async ({ page }) => {
  await openSidebar(page, '/notices/list')

  await group(page, '개체관리').click()
  await expect(group(page, '개체관리')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('개체 카드')).toBeVisible()

  await group(page, '개체관리').click()
  await expect(group(page, '개체관리')).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await expect(page.getByText('개체 카드')).toBeHidden()
})

test('S5: 대분류 헤더는 화면을 이동시키지 않는다', async ({ page }) => {
  await openSidebar(page, '/notices/list')

  await group(page, '업무관리').click()

  await expect(page).toHaveURL(/\/notices\/list$/)
  await expect(sidebar(page)).toBeVisible()
})

test('S6: 현재 경로의 대분류가 자동으로 펼쳐진다', async ({ page }) => {
  await openSidebar(page, '/feeds')

  await expect(group(page, '개체관리')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('link', { name: '먹이 급여 관리' })).toBeVisible()
})

test('S7: 대시보드는 바로 이동하고 현재 경로일 때 활성이다', async ({
  page,
}) => {
  await openSidebar(page, '/')
  const dashboard = page.getByRole('link', { name: '대시보드' })
  await expect(dashboard).toHaveCSS('color', 'rgb(73, 82, 255)')
  await expect(dashboard).toHaveCSS('background-color', 'rgb(232, 233, 255)')

  await openSidebar(page, '/tasks')
  await page.getByRole('link', { name: '대시보드' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(sidebar(page)).toBeHidden()
})

test('S8: 먹이 급여 관리로 이동', async ({ page }) => {
  await openSidebar(page, '/notices/list')

  await group(page, '개체관리').click()
  await page.getByRole('link', { name: '먹이 급여 관리' }).click()

  await expect(page).toHaveURL(/\/feeds$/)
  await expect(sidebar(page)).toBeHidden()
})

test('S9: 화면이 없는 하위 항목은 비활성이다', async ({ page }) => {
  await openSidebar(page, '/notices/list')

  await group(page, '설정').click()

  const teamSettings = page.getByText('팀 설정', { exact: true })
  await expect(teamSettings).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByRole('link', { name: '팀 설정' })).toHaveCount(0)
})

test('S11: 현재 경로의 하위 항목이 선택 상태로 표시된다', async ({ page }) => {
  await openSidebar(page, '/feeds')

  const selected = page.getByRole('link', { name: '먹이 급여 관리' })
  await expect(selected).toHaveCSS('color', 'rgb(73, 82, 255)')
  await expect(selected).toHaveCSS('background-color', 'rgb(232, 233, 255)')

  // 같은 그룹의 다른 하위 항목에는 밴드가 없다(`개체 카드` 는 화면이 없어 링크가 아니다).
  await expect(page.getByText('개체 카드', { exact: true })).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  )
})

test('S10: 상세 경로에서도 같은 대분류가 펼쳐진다', async ({ page }) => {
  await openSidebar(page, '/tasks/t-1')

  await expect(group(page, '업무관리')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('link', { name: '업무지시' })).toBeVisible()
})
