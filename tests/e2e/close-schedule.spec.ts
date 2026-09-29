import { test, expect } from '@playwright/test'
import { mockCloseDayApi } from './support/close-day-api'

// 승인된 시나리오(close-schedule.approved.json: S1~S10)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 휴무일 API 는 page.route mock 을 쓴다. 실제 서버는 호출하지 않는다.

const cardMenu = '토이빌리지 동물 정기검진 메뉴'

test('S1: "휴무일 생성하기" 클릭 → /notices/guide/create 이동', async ({
  page,
}) => {
  await mockCloseDayApi(page)
  await page.goto('/notices/guide')
  await page.getByRole('link', { name: '휴무일 생성하기' }).click()
  await expect(page).toHaveURL(/\/notices\/guide\/create$/)
})

test('S2: 다음 달 클릭 → 캘린더 월과 카드 목록 변경', async ({ page }) => {
  await mockCloseDayApi(page)
  const nextMonth = addMonths(new Date(), 1)
  const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0)

  await page.goto('/notices/guide')
  await expect(page.getByText('토이빌리지 동물 정기검진')).toBeVisible()
  await page.getByRole('button', { name: '다음 달' }).click()
  await expect(
    page.getByRole('heading', { name: formatMonthTitle(nextMonth) }),
  ).toBeVisible()
  await expect(page.getByLabel(formatFullDate(lastDay))).toBeVisible()
  await expect(page.getByText('토이빌리지 동물 정기검진')).toHaveCount(0)
})

test('S3: 검색·필터 없음', async ({ page }) => {
  await mockCloseDayApi(page)
  await page.goto('/notices/guide')
  await expect(page.getByText('토이빌리지 동물 정기검진')).toBeVisible()
  await expect(page.getByLabel('휴무 일정 검색')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: '휴무 일정 필터' }),
  ).toHaveCount(0)
})

test('S4: 케밥 클릭 → 수정·삭제 메뉴, URL 유지', async ({ page }) => {
  await mockCloseDayApi(page)
  await page.goto('/notices/guide')
  await page.getByRole('button', { name: cardMenu }).click()

  const menu = page.getByRole('menu', { name: cardMenu })
  await expect(menu.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: '삭제' })).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/guide$/)
})

test('S5: 케밥 수정 → 수정 화면 이동', async ({ page }) => {
  await mockCloseDayApi(page)
  await page.goto('/notices/guide')
  await page.getByRole('button', { name: cardMenu }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/notices\/guide\/1\/edit$/)
})

test('S6: 삭제 취소 → 요청 없이 카드 유지', async ({ page }) => {
  const deleted: number[] = []
  await mockCloseDayApi(page, { onDelete: (id) => deleted.push(id) })
  await page.goto('/notices/guide')
  await page.getByRole('button', { name: cardMenu }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByText('토이빌리지 동물 정기검진')).toBeVisible()
  expect(deleted).toEqual([])
})

test('S7: 삭제 확인 → 카드 제거와 성공 토스트', async ({ page }) => {
  const deleted: number[] = []
  await mockCloseDayApi(page, { onDelete: (id) => deleted.push(id) })
  await page.goto('/notices/guide')
  await page.getByRole('button', { name: cardMenu }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByRole('button', { name: '확인', exact: true }).click()

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(page.getByText('토이빌리지 동물 정기검진')).toHaveCount(0)
  await expect(page.getByText('시설 점검')).toBeVisible()
  expect(deleted).toEqual([1])
})

test('S8: 삭제 실패 → 카드 유지와 오류 토스트', async ({ page }) => {
  await mockCloseDayApi(page, { deleteStatus: 500 })
  await page.goto('/notices/guide')
  await page.getByRole('button', { name: cardMenu }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByRole('button', { name: '확인', exact: true }).click()

  await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByText('토이빌리지 동물 정기검진')).toBeVisible()
})

test('S9: 일정 없는 달 → 빈 상태', async ({ page }) => {
  await mockCloseDayApi(page, { closeDays: [] })
  await page.goto('/notices/guide')
  await expect(page.getByText('아직 추가된 휴무일이 없습니다')).toBeVisible()
})

test('S10: 카드 클릭 → 상세 이동', async ({ page }) => {
  await mockCloseDayApi(page)
  await page.goto('/notices/guide')
  await page
    .getByRole('link', { name: '토이빌리지 동물 정기검진 휴무 일정 상세' })
    .click()

  await expect(page).toHaveURL(/\/notices\/guide\/1$/)
  await expect(
    page.getByRole('heading', { name: '토이빌리지 동물 정기검진' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '저장하기' })).toHaveCount(0)
})

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function formatMonthTitle(date: Date) {
  return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}월`
}

function formatFullDate(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}
