import { test, expect } from '@playwright/test'
import { mockNoticeApi } from './support/notice-api'

// 승인된 시나리오(notice-list.approved.json: S1~S12)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 공지 API 는 page.route mock 을 쓴다. 실제 서버는 호출하지 않는다.

test('S1: "공지 생성하기" 클릭 → /notices/list/create 이동', async ({
  page,
}) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list')
  await page.getByRole('link', { name: '공지 생성하기' }).click()
  await expect(page).toHaveURL(/\/notices\/list\/create$/)
})

test('S2: 분류 탭 클릭 → 활성화', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list')
  const tab = page.getByRole('button', { name: '팀이름 1' })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-pressed', 'true')
})

test('S3: 제목 검색 → 목록 필터', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list')
  await page.getByRole('searchbox', { name: '공지 검색' }).fill('주차장')
  await expect(page.getByTestId('notice-row')).toHaveCount(1)
  await expect(page.getByTestId('notice-row').first()).toContainText(
    '주차장 이용 변경 공지',
  )
})

test('S4: 검색 결과 없음 → 빈 상태', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list')
  await page
    .getByRole('searchbox', { name: '공지 검색' })
    .fill('존재하지않는공지명')
  await expect(page.getByTestId('notice-row')).toHaveCount(0)
  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
})

test('S5: 페이지네이션 2페이지 이동', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(page.getByTestId('notice-row')).toHaveCount(2)
  await expect(page.getByTestId('notice-row').first()).toContainText(
    '시설 점검 일정 공지',
  )
})

test('S6: 분류 탭 변경 시 1페이지로 리셋', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(page.getByTestId('notice-row').first()).toContainText(
    '시설 점검 일정 공지',
  )
  await page.getByRole('button', { name: '팀이름 1' }).click()
  await expect(page.getByTestId('notice-row')).toHaveCount(2)
  await expect(page.getByTestId('notice-row').first()).toContainText(
    '신규 프로그램 오픈 안내',
  )
})

test('S7: 행 클릭 → 상세 이동', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list')
  await page
    .getByTestId('notice-row')
    .first()
    .getByText('7월 13일 휴관안내')
    .click()
  await expect(page).toHaveURL(/\/notices\/list\/1$/)
})

test('S8: 케밥 클릭 → 수정·삭제 메뉴, URL 유지', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list')
  await page
    .getByRole('button', { name: '7월 13일 휴관안내 관리 메뉴' })
    .click()

  const menu = page.getByRole('menu', { name: '7월 13일 휴관안내 관리 메뉴' })
  await expect(menu.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: '삭제' })).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/list$/)
})

test('S9: 케밥 수정 → 수정 화면 이동', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list')
  await page
    .getByRole('button', { name: '7월 13일 휴관안내 관리 메뉴' })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/notices\/list\/1\/edit$/)
})

test('S10: 삭제 취소 → 요청 없이 행 유지', async ({ page }) => {
  const deleted: number[] = []
  await mockNoticeApi(page, { onDelete: (id) => deleted.push(id) })
  await page.goto('/notices/list')
  await page
    .getByRole('button', { name: '7월 13일 휴관안내 관리 메뉴' })
    .click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(
    page.getByText('7월 13일 휴관안내', { exact: true }),
  ).toBeVisible()
  expect(deleted).toEqual([])
})

test('S11: 삭제 확인 → 행 제거와 성공 토스트', async ({ page }) => {
  const deleted: number[] = []
  await mockNoticeApi(page, { onDelete: (id) => deleted.push(id) })
  await page.goto('/notices/list')
  await page
    .getByRole('button', { name: '7월 13일 휴관안내 관리 메뉴' })
    .click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByRole('button', { name: '확인', exact: true }).click()

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(
    page.getByText('7월 13일 휴관안내', { exact: true }),
  ).toHaveCount(0)
  expect(deleted).toEqual([1])
})

test('S12: 삭제 실패 → 행 유지와 오류 토스트', async ({ page }) => {
  await mockNoticeApi(page, { deleteStatus: 500 })
  await page.goto('/notices/list')
  await page
    .getByRole('button', { name: '7월 13일 휴관안내 관리 메뉴' })
    .click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByRole('button', { name: '확인', exact: true }).click()

  await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(
    page.getByText('7월 13일 휴관안내', { exact: true }),
  ).toBeVisible()
})
