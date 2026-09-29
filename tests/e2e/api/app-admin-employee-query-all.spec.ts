import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  mockEmployeeApi,
  type EmployeeApiOptions,
} from '../support/employee-api'

// 승인된 시나리오(app-admin-employee-query-all.test-scenarios.md)를 변환한 것.
// 대상: GET /app/admin/employees. 실제 서버는 호출하지 않는다.

const rows = (page: Page) => page.getByTestId('staff-account-row')
const total = (page: Page, count: number) =>
  page.getByText(`총 ${count}명`, { exact: true })

async function openList(page: Page, options?: EmployeeApiOptions) {
  const api = await mockEmployeeApi(page, options)
  await page.goto('/settings/accounts')
  return api
}

test('S1: 목록 표시', async ({ page }) => {
  const api = await openList(page)

  await expect(rows(page)).toHaveCount(5)
  const first = rows(page).first()
  await expect(first).toContainText('김수인')
  await expect(first).toContainText('suin.kim')
  await expect(first).toContainText('변경 완료')
  await expect(first).toContainText('2026.07.03')
  await expect(rows(page).nth(2)).toContainText('이지아')
  await expect(rows(page).nth(2)).toContainText('초기 비밀번호')
  await expect(total(page, 12)).toBeVisible()
  for (const header of ['이름', '비밀번호', '계정 생성일']) {
    await expect(page.getByText(header, { exact: true })).toBeVisible()
  }
  expect(api.lists).toBe(1)
})

test('S2: 검색·페이지는 화면에서 거른다', async ({ page }) => {
  const api = await openList(page)
  await expect(rows(page)).toHaveCount(5)

  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page).first()).toContainText('정하늘')
  await page
    .getByRole('searchbox', { name: '이름 또는 아이디 검색' })
    .fill('jia')
  await expect(rows(page)).toHaveCount(1)
  await expect(rows(page).first()).toContainText('이지아')
  expect(api.lists).toBe(1)
})

test('S3: 조회 실패(500)', async ({ page }) => {
  await openList(page, {
    listStatus: 500,
    listBody: errorBody(500, '내부 서버 오류가 발생했습니다.'),
  })

  await expect(
    page.getByText('직원 목록을 불러오지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(rows(page)).toHaveCount(0)
})

test('S3-1: 형식 오류', async ({ page }) => {
  // passwordChanged 가 빠진 항목은 형식 오류다.
  await openList(page, {
    listBody: [
      { id: 1, username: 'suin.kim', name: '김수인', createAt: '2026-07-03' },
    ],
  })

  await expect(
    page.getByText('직원 목록을 불러오지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
})

test('S4: 빈 목록', async ({ page }) => {
  await openList(page, { employees: [] })

  await expect(total(page, 0)).toBeVisible()
  await expect(page.getByRole('button', { name: '1 페이지' })).toHaveCount(0)
})
