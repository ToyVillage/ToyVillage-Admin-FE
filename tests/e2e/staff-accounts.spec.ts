import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  mockEmployeeApi,
  type EmployeeApiOptions,
} from './support/employee-api'

// 승인된 시나리오(staff-accounts.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 직원 API(목록·생성·비밀번호 초기화·삭제)는 모두 `support/employee-api` 가짜 서버로 받는다.

const listUrl = '/settings/accounts'

const rows = (page: Page) => page.getByTestId('staff-account-row')
const row = (page: Page, name: string) => rows(page).filter({ hasText: name })
const total = (page: Page, count: number) =>
  page.getByText(`총 ${count}명`, { exact: true })
const searchInput = (page: Page) =>
  page.getByRole('searchbox', { name: '이름 또는 아이디 검색' })
const createButton = (page: Page) =>
  page.getByRole('button', { name: '계정 생성하기' })
const createDialog = (page: Page) =>
  page.getByRole('dialog', { name: '계정 생성' })
const nameInput = (page: Page) => createDialog(page).getByLabel('이름')
const usernameInput = (page: Page) => createDialog(page).getByLabel('아이디')
const submitButton = (page: Page) =>
  createDialog(page).getByRole('button', { name: '계정 생성' })
const kebab = (page: Page, name: string) =>
  page.getByRole('button', { name: `${name} 계정 메뉴` })
const menuItem = (page: Page, name: string) =>
  page.getByRole('menuitem', { name })
const confirmDialog = (page: Page) => page.getByRole('alertdialog')

async function openList(page: Page, options?: EmployeeApiOptions) {
  const api = await mockEmployeeApi(page, options)
  await page.goto(listUrl)
  await expect(row(page, '김수인')).toBeVisible()
  return api
}

async function openCreate(page: Page) {
  await createButton(page).click()
  await expect(createDialog(page)).toBeVisible()
}

async function fillAndSubmit(page: Page, name: string, username: string) {
  await nameInput(page).fill(name)
  await usernameInput(page).fill(username)
  await submitButton(page).click()
}

test('S1: 진입 시 목록 첫 페이지가 보인다', async ({ page }) => {
  await openList(page)

  await expect(
    page.getByRole('heading', { name: '직원 계정 관리', level: 1 }),
  ).toBeVisible()
  await expect(page.getByText('토이빌리지 직원 계정 관리')).toBeVisible()
  await expect(createButton(page)).toBeVisible()
  await expect(searchInput(page)).toHaveAttribute(
    'placeholder',
    '이름 또는 아이디 검색',
  )
  for (const header of ['이름', '비밀번호', '계정 생성일']) {
    await expect(page.getByText(header, { exact: true })).toBeVisible()
  }

  await expect(rows(page)).toHaveCount(5)
  const first = rows(page).first()
  await expect(first).toContainText('김수인')
  await expect(first).toContainText('suin.kim')
  await expect(first).toContainText('변경 완료')
  await expect(first).toContainText('2026.07.03')
  await expect(total(page, 12)).toBeVisible()
  await expect(page.getByRole('button', { name: '1 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('S2: 페이지를 옮기면 다음 행들이 보이고 URL 에 남는다', async ({
  page,
}) => {
  await openList(page)

  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(page).toHaveURL(/[?&]page=2(&|$)/)
  await expect(rows(page)).toHaveCount(5)
  await expect(rows(page).first()).toContainText('정하늘')
  await expect(row(page, '김수인')).toHaveCount(0)

  await page.reload()
  await expect(rows(page).first()).toContainText('정하늘')
  await expect(page.getByRole('button', { name: '2 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('S3: 이름 또는 아이디로 검색한다', async ({ page }) => {
  await mockEmployeeApi(page)
  await page.goto(`${listUrl}?page=2`)
  await expect(rows(page).first()).toContainText('정하늘')

  await searchInput(page).fill('jia')

  await expect(rows(page)).toHaveCount(1)
  await expect(rows(page).first()).toContainText('이지아')
  await expect(total(page, 1)).toBeVisible()
  await expect(page).toHaveURL(/[?&]keyword=jia(&|$)/)
  await expect(page).not.toHaveURL(/[?&]page=/)

  await searchInput(page).fill('김수')
  await expect(rows(page)).toHaveCount(1)
  await expect(rows(page).first()).toContainText('김수인')
})

test('S4: 계정을 만들면 모달이 닫히고 목록에 추가된다', async ({ page }) => {
  const api = await openList(page)

  await openCreate(page)
  await fillAndSubmit(page, ' 김직원 ', ' employee01 ')

  await expect(createDialog(page)).toBeHidden()
  await expect(page.getByText('계정 생성에 성공했습니다')).toBeVisible()
  expect(api.requests).toHaveLength(1)
  expect(api.requests[0].body).toEqual({
    username: 'employee01',
    name: '김직원',
  })
  await expect(total(page, 13)).toBeVisible()
  await searchInput(page).fill('employee01')
  await expect(rows(page)).toHaveCount(1)
  await expect(rows(page).first()).toContainText('김직원')
  await expect(rows(page).first()).toContainText('초기 비밀번호')
})

test('S5: 비밀번호를 초기화하면 배지가 초기 비밀번호로 바뀐다', async ({
  page,
}) => {
  await openList(page)
  await expect(row(page, '김수인')).toContainText('변경 완료')

  await kebab(page, '김수인').click()
  await menuItem(page, '비밀번호 초기화').click()
  await expect(confirmDialog(page)).toContainText(
    '비밀번호를 초기화하시겠습니까?',
  )
  await confirmDialog(page).getByRole('button', { name: '초기화' }).click()

  await expect(confirmDialog(page)).toBeHidden()
  await expect(row(page, '김수인')).toContainText('초기 비밀번호')
  await expect(page.getByText('비밀번호 초기화에 성공했습니다')).toBeVisible()
})

test('S6: 계정을 삭제하면 목록에서 사라진다', async ({ page }) => {
  await openList(page)
  await expect(total(page, 12)).toBeVisible()

  await kebab(page, '이승현').click()
  await menuItem(page, '삭제').click()
  await confirmDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(confirmDialog(page)).toBeHidden()
  await expect(row(page, '이승현')).toHaveCount(0)
  await expect(total(page, 11)).toBeVisible()
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
})

test('S7: 사이드바에서 직원 계정 관리로 들어온다', async ({ page }) => {
  await page.route(/^https:\/\//, (route) => route.abort())
  await page.goto('/')

  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await page.getByRole('button', { name: '설정', exact: true }).click()
  await page.getByRole('link', { name: '직원 계정 관리' }).click()

  await expect(page).toHaveURL(/\/settings\/accounts$/)
  await expect(
    page.getByRole('heading', { name: '직원 계정 관리', level: 1 }),
  ).toBeVisible()

  await page.getByRole('button', { name: '사이드바 열기' }).click()
  const current = page.getByRole('link', { name: '직원 계정 관리' })
  await expect(current).toHaveCSS('color', 'rgb(73, 82, 255)')
  await expect(page.getByRole('link', { name: '팀 관리' })).toBeVisible()
})

test('S8: 빈 값으로 제출하면 두 오류가 함께 보이고 요청하지 않는다', async ({
  page,
}) => {
  const api = await openList(page)
  await openCreate(page)

  await submitButton(page).click()

  await expect(createDialog(page).getByRole('alert')).toHaveText([
    '이름을 입력해주세요',
    '아이디를 입력해주세요',
  ])
  await expect(nameInput(page)).toHaveAttribute('aria-invalid', 'true')
  await expect(usernameInput(page)).toHaveAttribute('aria-invalid', 'true')
  await expect(nameInput(page)).toBeFocused()

  await nameInput(page).fill('   ')
  await usernameInput(page).fill('  ')
  await submitButton(page).click()
  await expect(createDialog(page).getByRole('alert')).toHaveCount(2)
  expect(api.requests).toHaveLength(0)
})

test('S9: 오류가 난 필드에 입력하면 그 필드 오류만 사라진다', async ({
  page,
}) => {
  await openList(page)
  await openCreate(page)
  await submitButton(page).click()
  await expect(createDialog(page).getByRole('alert')).toHaveCount(2)

  await nameInput(page).fill('김직원')

  await expect(createDialog(page).getByRole('alert')).toHaveText([
    '아이디를 입력해주세요',
  ])
  await expect(nameInput(page)).toHaveAttribute('aria-invalid', 'false')
})

test('S10: 아이디가 중복이면 아이디 아래에 알려준다', async ({ page }) => {
  await openList(page, {
    status: 409,
    body: errorBody(409, '이미 사용 중인 앱 관리자 아이디입니다.'),
  })
  await openCreate(page)

  await fillAndSubmit(page, '김직원', 'employee01')

  await expect(createDialog(page)).toBeVisible()
  await expect(createDialog(page).getByRole('alert')).toHaveText([
    '이미 사용 중인 아이디예요',
  ])
  await expect(usernameInput(page)).toBeFocused()
  await expect(page.getByText('데이터 생성에 실패했습니다')).toHaveCount(0)
  await expect(total(page, 12)).toBeAttached()

  await usernameInput(page).fill('employee02')
  await expect(createDialog(page).getByRole('alert')).toHaveCount(0)
})

test('S11: 서버 오류면 입력을 유지하고 실패 토스트를 띄운다', async ({
  page,
}) => {
  await openList(page, {
    status: 500,
    body: errorBody(500, '내부 서버 오류가 발생했습니다.'),
  })
  await openCreate(page)

  await fillAndSubmit(page, '김직원', 'employee01')

  await expect(page.getByText('데이터 생성에 실패했습니다')).toBeVisible()
  await expect(createDialog(page)).toBeVisible()
  await expect(nameInput(page)).toHaveValue('김직원')
  await expect(usernameInput(page)).toHaveValue('employee01')
})

test('S12: 제출 중에는 다시 제출되지 않는다', async ({ page }) => {
  const api = await openList(page, { delay: 800 })
  await openCreate(page)

  await fillAndSubmit(page, '김직원', 'employee01')

  await expect(submitButton(page)).toBeDisabled()
  await expect(createDialog(page)).toHaveAttribute('aria-busy', 'true')
  await usernameInput(page).press('Enter')
  await submitButton(page).click({ force: true })

  await expect(createDialog(page)).toBeHidden()
  expect(api.requests).toHaveLength(1)
})

test('S13: 생성 모달을 취소하면 아무것도 만들지 않고 다음에 빈 상태로 열린다', async ({
  page,
}) => {
  const api = await openList(page)

  await openCreate(page)
  await nameInput(page).fill('김직원')
  await page.keyboard.press('Escape')

  await expect(createDialog(page)).toBeHidden()
  await expect(createButton(page)).toBeFocused()
  expect(api.requests).toHaveLength(0)

  await openCreate(page)
  await expect(nameInput(page)).toHaveValue('')
  await expect(nameInput(page)).toBeFocused()
  await createDialog(page).getByRole('button', { name: '취소' }).click()
  await expect(createDialog(page)).toBeHidden()

  await openCreate(page)
  await page.mouse.click(10, 10)
  await expect(createDialog(page)).toBeHidden()
  expect(api.requests).toHaveLength(0)
})

test('S14: 확인 모달에서 취소하면 아무것도 바뀌지 않는다', async ({ page }) => {
  await openList(page)

  await kebab(page, '김수인').click()
  await menuItem(page, '비밀번호 초기화').click()
  await confirmDialog(page).getByRole('button', { name: '취소' }).click()
  await expect(confirmDialog(page)).toBeHidden()

  await kebab(page, '이승현').click()
  await menuItem(page, '삭제').click()
  await expect(confirmDialog(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(confirmDialog(page)).toBeHidden()

  await expect(row(page, '김수인')).toContainText('변경 완료')
  await expect(row(page, '이승현')).toBeVisible()
  await expect(total(page, 12)).toBeVisible()
  await expect(page.getByText(/성공했습니다|실패했습니다/)).toHaveCount(0)
})

test('S15: 케밥 메뉴는 Escape 와 바깥 클릭으로 닫힌다', async ({ page }) => {
  await openList(page)
  const menu = page.getByRole('menu', { name: '김수인 계정 메뉴' })

  await kebab(page, '김수인').click()
  await expect(menu.getByRole('menuitem')).toHaveText([
    '비밀번호 초기화',
    '삭제',
  ])

  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()

  await kebab(page, '김수인').click()
  await expect(menu).toBeVisible()
  await page.getByRole('heading', { name: '직원 계정 관리' }).click()
  await expect(menu).toBeHidden()
})

test('S16: 검색 결과가 없으면 빈 문구를 보인다', async ({ page }) => {
  await openList(page)

  await searchInput(page).fill('없는사람')

  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
  await expect(rows(page)).toHaveCount(0)
  await expect(total(page, 0)).toBeVisible()
  await expect(page.getByRole('button', { name: '1 페이지' })).toHaveCount(0)
})

test('S17: 마지막 페이지의 마지막 행을 지우면 앞 페이지로 간다', async ({
  page,
}) => {
  await mockEmployeeApi(page)
  await page.goto(`${listUrl}?page=3`)
  await expect(rows(page)).toHaveCount(2)

  for (const name of ['서지훈', '임다은']) {
    await kebab(page, name).click()
    await menuItem(page, '삭제').click()
    await confirmDialog(page).getByRole('button', { name: '확인' }).click()
    await expect(confirmDialog(page)).toBeHidden()
  }

  await expect(page).toHaveURL(/[?&]page=2(&|$)/)
  await expect(rows(page)).toHaveCount(5)
  await expect(total(page, 10)).toBeVisible()
})

test('S18: 옛 계정 생성 주소는 목록으로 옮겨진다', async ({ page }) => {
  await mockEmployeeApi(page)

  await page.goto('/settings/accounts/create')

  await expect(page).toHaveURL(/\/settings\/accounts$/)
  await expect(
    page.getByRole('heading', { name: '직원 계정 관리', level: 1 }),
  ).toBeVisible()
})
