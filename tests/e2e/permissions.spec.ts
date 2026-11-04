import { expect, test, type Page } from '@playwright/test'
import { mockEmployeeApi, permissionEmployees } from './support/employee-api'

// 승인된 시나리오(permissions.approved.json: S1~S16, S18)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 직원 조회와 권한 변경은 `support/employee-api` 가짜 서버로 받는다. 실패 처리는 API 테스트가 맡는다.

const url = '/settings/permissions'
const searchLabel = '이름 또는 아이디 검색'
const candidates = ['박도현', '최민지', '정하윤', '오세훈', '한지민']

const rows = (page: Page) => page.getByTestId('middle-manager-row')
const row = (page: Page, name: string) => rows(page).filter({ hasText: name })
const total = (page: Page, count: number) =>
  page.getByText(`총 ${count}명`, { exact: true })
const searchInput = (page: Page) =>
  page.getByRole('searchbox', { name: searchLabel })
const assignTrigger = (page: Page) =>
  page.getByRole('button', { name: '중간 관리자 지정' })
const releaseTrigger = (page: Page, name: string) =>
  page.getByRole('button', { name: `${name} 중간 관리자 해제` })

const dialog = (page: Page) =>
  page.getByRole('dialog', { name: '중간 관리자 지정' })
const dialogSearch = (page: Page) =>
  dialog(page).getByRole('searchbox', { name: searchLabel })
const candidate = (page: Page, name: string) =>
  dialog(page).getByRole('radio', { name })
const candidateRow = (page: Page, name: string) =>
  dialog(page).getByText(name, { exact: true })
const dialogButton = (page: Page, name: string) =>
  dialog(page).getByRole('button', { name, exact: true })

const confirmDialog = (page: Page) => page.getByRole('alertdialog')
const confirmButton = (page: Page, name: string) =>
  confirmDialog(page).getByRole('button', { name, exact: true })

async function openList(page: Page) {
  await mockEmployeeApi(page, {
    employees: permissionEmployees.map((item) => ({ ...item })),
  })
  await page.goto(url)
  await expect(row(page, '김수인')).toBeVisible()
}

async function openDialog(page: Page) {
  await assignTrigger(page).click()
  await expect(dialog(page)).toBeVisible()
}

async function assign(page: Page, name: string) {
  await openDialog(page)
  await candidateRow(page, name).click()
  await dialogButton(page, '지정하기').click()
  await expect(dialog(page)).toBeHidden()
  await expect(row(page, name)).toBeVisible()
}

async function release(page: Page, name: string) {
  await releaseTrigger(page, name).click()
  await confirmButton(page, '해제').click()
  await expect(confirmDialog(page)).toBeHidden()
  await expect(row(page, name)).toHaveCount(0)
}

test('S1: 사이드바에서 권한 관리 진입', async ({ page }) => {
  await mockEmployeeApi(page, {
    employees: permissionEmployees.map((item) => ({ ...item })),
  })
  await page.goto('/')

  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await page.getByRole('button', { name: '설정', exact: true }).click()
  await page.getByRole('link', { name: '권한 관리' }).click()

  await expect(page).toHaveURL(/\/settings\/permissions$/)
  await expect(
    page.getByRole('heading', { name: '권한 관리', level: 1 }),
  ).toBeVisible()
  await expect(
    page.getByText('토이빌리지 중간 관리자 지정 및 해제'),
  ).toBeVisible()
  await expect(assignTrigger(page)).toBeVisible()

  await page.getByRole('button', { name: '사이드바 열기' }).click()
  const active = page.getByRole('link', { name: '권한 관리' })
  await expect(active).toHaveCSS('color', 'rgb(73, 82, 255)')
  await expect(active).toHaveCSS('background-color', 'rgb(232, 233, 255)')
})

test('S2: 첫 진입 목록', async ({ page }) => {
  await openList(page)

  const main = page.getByRole('main')
  await expect(main.getByText('이름', { exact: true })).toBeVisible()
  await expect(main.getByText('지정일', { exact: true })).toHaveCount(0)

  await expect(rows(page)).toHaveCount(3)
  const expected = [
    ['김수인', 'suin.kim'],
    ['이승현', 'seunghyun.lee'],
    ['이지아', 'jia.lee'],
  ]
  for (const [index, [name, username]] of expected.entries()) {
    await expect(rows(page).nth(index)).toContainText(name)
    await expect(rows(page).nth(index)).toContainText(username)
    await expect(releaseTrigger(page, name)).toBeVisible()
  }

  await expect(total(page, 3)).toBeVisible()
  await expect(page.getByRole('button', { name: '1 페이지' })).toHaveCount(0)
})

test('S3: 목록 검색', async ({ page }) => {
  await openList(page)

  await searchInput(page).fill('SEUNG')

  await expect(rows(page)).toHaveCount(1)
  await expect(row(page, '이승현')).toBeVisible()
  await expect(total(page, 1)).toBeVisible()
  await expect(page).toHaveURL(/keyword=SEUNG/)

  await page.reload()

  await expect(searchInput(page)).toHaveValue('SEUNG')
  await expect(rows(page)).toHaveCount(1)
  await expect(row(page, '이승현')).toBeVisible()
})

test('S4: 지정 모달 기본 상태', async ({ page }) => {
  await openList(page)

  await openDialog(page)

  await expect(
    dialog(page).getByText('중간 관리자로 지정할 직원을 선택하세요'),
  ).toBeVisible()
  await expect(dialogSearch(page)).toBeFocused()

  await expect(dialog(page).getByRole('radio')).toHaveCount(5)
  for (const name of candidates) {
    await expect(candidate(page, name)).not.toBeChecked()
  }
  for (const name of ['김수인', '이승현', '이지아']) {
    await expect(candidate(page, name)).toHaveCount(0)
  }

  await expect(dialogButton(page, '지정하기')).toBeDisabled()
})

test('S5: 한 명만 선택', async ({ page }) => {
  await openList(page)
  await openDialog(page)

  await candidateRow(page, '박도현').click()

  await expect(candidate(page, '박도현')).toBeChecked()
  await expect(dialogButton(page, '지정하기')).toBeEnabled()

  await candidateRow(page, '최민지').click()

  await expect(candidate(page, '최민지')).toBeChecked()
  await expect(candidate(page, '박도현')).not.toBeChecked()
  await expect(dialog(page).getByRole('radio', { checked: true })).toHaveCount(
    1,
  )
})

test('S6: 지정 완료', async ({ page }) => {
  await openList(page)
  await openDialog(page)
  await candidateRow(page, '박도현').click()

  await dialogButton(page, '지정하기').click()

  await expect(dialog(page)).toBeHidden()
  await expect(page.getByText('권한 부여에 성공했습니다')).toBeVisible()
  await expect(row(page, '박도현')).toBeVisible()
  await expect(rows(page)).toHaveCount(4)
  await expect(total(page, 4)).toBeVisible()
})

test('S7: 모달 검색과 선택 유지', async ({ page }) => {
  await openList(page)
  await openDialog(page)

  await candidateRow(page, '박도현').click()
  await dialogSearch(page).fill('sehun')

  await expect(dialog(page).getByRole('radio')).toHaveCount(1)
  await expect(candidate(page, '오세훈')).toBeVisible()
  await expect(dialogButton(page, '지정하기')).toBeEnabled()

  await dialogSearch(page).fill('')

  await expect(dialog(page).getByRole('radio')).toHaveCount(5)
  await expect(candidate(page, '박도현')).toBeChecked()

  await dialogSearch(page).fill('sehun')
  await candidateRow(page, '오세훈').click()
  await dialogSearch(page).fill('')

  await expect(candidate(page, '오세훈')).toBeChecked()
  await expect(dialog(page).getByRole('radio', { checked: true })).toHaveCount(
    1,
  )
})

test('S8: 지정 모달 닫기', async ({ page }) => {
  await openList(page)
  await openDialog(page)
  await candidateRow(page, '박도현').click()
  await dialogSearch(page).fill('do')

  await dialogButton(page, '취소').click()

  await expect(dialog(page)).toBeHidden()
  await expect(total(page, 3)).toBeVisible()
  await expect(assignTrigger(page)).toBeFocused()

  await openDialog(page)
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toBeHidden()

  await openDialog(page)
  await page.mouse.click(10, 10)
  await expect(dialog(page)).toBeHidden()

  await openDialog(page)
  await expect(dialogSearch(page)).toHaveValue('')
  await expect(candidate(page, '박도현')).not.toBeChecked()
  await expect(dialogButton(page, '지정하기')).toBeDisabled()
})

test('S9: 해제 확인 모달', async ({ page }) => {
  await openList(page)

  await releaseTrigger(page, '김수인').click()

  await expect(confirmDialog(page)).toContainText(
    '중간 관리자를 해제하시겠습니까?',
  )
  await expect(confirmDialog(page)).toContainText('해제하면 김수인님은')
  await expect(confirmDialog(page)).toContainText('직원 권한으로 돌아갑니다')
  await expect(confirmButton(page, '취소')).toBeVisible()
  await expect(confirmButton(page, '해제')).toBeVisible()
})

test('S10: 해제 취소', async ({ page }) => {
  await openList(page)

  await releaseTrigger(page, '김수인').click()
  await confirmButton(page, '취소').click()

  await expect(confirmDialog(page)).toBeHidden()
  await expect(row(page, '김수인')).toBeVisible()
  await expect(total(page, 3)).toBeVisible()
  await expect(releaseTrigger(page, '김수인')).toBeFocused()

  await releaseTrigger(page, '김수인').click()
  await expect(confirmDialog(page)).toBeVisible()
  await page.keyboard.press('Escape')

  await expect(confirmDialog(page)).toBeHidden()
  await expect(row(page, '김수인')).toBeVisible()
  await expect(total(page, 3)).toBeVisible()
  await expect(releaseTrigger(page, '김수인')).toBeFocused()
})

test('S11: 해제 완료', async ({ page }) => {
  await openList(page)

  await releaseTrigger(page, '김수인').click()
  await confirmButton(page, '해제').click()

  await expect(confirmDialog(page)).toBeHidden()
  await expect(page.getByText('권한 해제에 성공했습니다')).toBeVisible()
  await expect(row(page, '김수인')).toHaveCount(0)
  await expect(rows(page)).toHaveCount(2)
  await expect(rows(page).nth(0)).toContainText('이승현')
  await expect(rows(page).nth(1)).toContainText('이지아')
  await expect(total(page, 2)).toBeVisible()
})

test('S12: 지정·해제가 후보 목록에 반영된다', async ({ page }) => {
  await openList(page)
  await assign(page, '박도현')
  await release(page, '김수인')

  await openDialog(page)

  await expect(candidate(page, '김수인')).toBeVisible()
  await expect(candidate(page, '박도현')).toHaveCount(0)
})

test('S13: 모두 해제하면 빈 상태', async ({ page }) => {
  await openList(page)

  await release(page, '김수인')
  await release(page, '이승현')
  await release(page, '이지아')

  await expect(page.getByText('지정된 중간 관리자가 없어요')).toBeVisible()
  await expect(
    page.getByText('중간 관리자 지정 버튼으로 직원을 지정해 보세요'),
  ).toBeVisible()
  await expect(total(page, 0)).toHaveCount(0)
  await expect(assignTrigger(page)).toBeVisible()
  await expect(searchInput(page)).toBeVisible()
})

test('S14: 목록 검색 결과 없음', async ({ page }) => {
  await openList(page)

  await searchInput(page).fill('없는사람')

  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
  await expect(total(page, 0)).toBeVisible()
  await expect(page.getByText('지정된 중간 관리자가 없어요')).toHaveCount(0)
})

test('S15: 모달 검색 결과 없음', async ({ page }) => {
  await openList(page)
  await openDialog(page)
  await candidateRow(page, '박도현').click()

  await dialogSearch(page).fill('없는사람')

  await expect(dialog(page).getByText('검색결과가 없습니다')).toBeVisible()
  await expect(dialogButton(page, '지정하기')).toBeEnabled()
})

test('S16: 지정할 수 있는 직원이 없음', async ({ page }) => {
  await openList(page)
  for (const name of candidates) await assign(page, name)
  await expect(total(page, 8)).toBeVisible()

  await openDialog(page)

  await expect(
    dialog(page).getByText('지정할 수 있는 직원이 없습니다'),
  ).toBeVisible()
  await expect(dialogButton(page, '지정하기')).toBeDisabled()
})

test('S18: 키보드로 모달 조작', async ({ page }) => {
  await openList(page)
  await openDialog(page)
  await expect(dialogSearch(page)).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(candidate(page, '박도현')).toBeFocused()
  await page.keyboard.press('Space')

  await expect(candidate(page, '박도현')).toBeChecked()
  const submit = dialogButton(page, '지정하기')
  await expect(submit).toBeEnabled()

  await submit.focus()
  await page.keyboard.press('Tab')
  await expect(dialogSearch(page)).toBeFocused()
})
