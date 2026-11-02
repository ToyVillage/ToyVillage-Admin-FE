import { expect, test, type Page } from '@playwright/test'
import {
  feedListPattern,
  mockFeedApi,
  mockFeedLog,
  todayIsoDate,
} from './support/feed-api'

// 승인된 시나리오(feed-list.approved.json: S1~S13, 2026-10-28 4층·5층 수정안)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 4층은 `support/feed-api` 의 page.route mock(실제 서버 호출 없음), 5층도 같은 파일의 page.route mock 이다
// (오늘 12건 — 아로와나·…·자이언트구라미).

const rows = (page: Page) => page.getByTestId('feed-row')

async function headers(page: Page) {
  const header = page.getByTestId('feed-table-header')
  await expect(header).toBeVisible()
  const texts = await header.locator(':scope > *').allTextContents()
  return texts.filter((text) => text.trim() !== '')
}

function cells(page: Page, index: number) {
  return rows(page)
    .nth(index)
    .evaluate((row) =>
      [...row.children].map((cell) => cell.textContent?.trim() ?? ''),
    )
}

test('S1: 목록 진입 기본 표시', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds')

  await expect(
    page.getByRole('heading', { name: '먹이 급여 관리' }),
  ).toBeVisible()
  await expect(page.getByText('4층·5층별 먹이 급여 내역')).toBeVisible()
  await expect(page.getByRole('button', { name: '조회 연도' })).toBeVisible()
  await expect(page.getByRole('button', { name: '4층' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: '5층' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(await headers(page)).toEqual([
    '일반명',
    '개체명',
    '급여시간',
    '먹이 종류',
    '급여량',
    '잔량',
    '특이사항',
    '급여자',
  ])
  await expect(rows(page)).toHaveCount(10)
  await expect(page.getByRole('button', { name: '전체' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '포유류' })).toHaveCount(0)
  await expect(page.getByText('급여날짜')).toHaveCount(0)
})

test('S2: 4층 행 값 표시', async ({ page }) => {
  const today = todayIsoDate()
  await mockFeedApi(page, {
    feedLogs: [
      mockFeedLog({
        feedLogId: 1,
        animalKind: '이구아나',
        animalName: '초록',
        feedType: '청경채',
        feedAmount: 150,
        remainingAmount: 20,
        significant: '',
        feedUnit: 'GML',
        feedDateTime: `${today}T08:40:00`,
      }),
      mockFeedLog({
        feedLogId: 2,
        animalKind: '물범',
        animalName: '바다',
        feedType: '고등어',
        feedAmount: 1.2,
        remainingAmount: null,
        significant: '콧잔등 상처',
        feedUnit: 'KGL',
        name: '김유영',
        feedDateTime: `${today}T16:22:00`,
      }),
    ],
  })
  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(2)

  expect(await cells(page, 0)).toEqual([
    '이구아나',
    '초록',
    '08:40',
    '청경채',
    '150 g/ml',
    '20 g/ml',
    '-',
    '이승현',
    '',
  ])
  expect(await cells(page, 1)).toEqual([
    '물범',
    '바다',
    '16:22',
    '고등어',
    '1.2 kg/l',
    '-',
    '콧잔등 상처',
    '김유영',
    '',
  ])
})

test('S3: 5층 탭으로 바꾸기', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds?page=2')
  await expect(rows(page)).toHaveCount(2)

  await page.getByRole('button', { name: '5층' }).click()
  await expect(page).toHaveURL(/floor=5/)
  await expect(page).not.toHaveURL(/page=/)
  expect(await headers(page)).toEqual([
    '일반명',
    '개체명',
    '먹이 종류',
    '급여량',
    '급여자',
  ])
  await expect(rows(page).first()).toContainText('아로와나')
  expect(await cells(page, 0)).toEqual([
    '아로와나',
    '아로',
    '냉동새우',
    '30 g/ml',
    '박도현',
    '',
  ])
})

test('S4: 조회날짜 바꾸기', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds?floor=5&page=2')
  await expect(rows(page)).toHaveCount(2)

  const lastYear = String(new Date().getFullYear() - 1)
  await page.getByRole('button', { name: '조회 연도' }).click()
  await page.getByRole('option', { name: `${lastYear}년` }).click()

  await expect(page.getByRole('listbox', { name: '조회 연도' })).toBeHidden()
  await expect(page).toHaveURL(new RegExp(`date=${lastYear}-`))
  await expect(page).toHaveURL(/floor=5/)
  await expect(page).not.toHaveURL(/page=/)
  await expect(page.getByRole('button', { name: '5층' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('S5: 페이지네이션', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(10)
  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeDisabled()

  await page.getByRole('button', { name: '다음 페이지' }).click()
  await expect(rows(page)).toHaveCount(2)
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeDisabled()

  await page.getByRole('button', { name: '이전 페이지' }).click()
  await expect(rows(page)).toHaveCount(10)
})

test('S6: 행 클릭 이동', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds')
  await rows(page).filter({ hasText: '표범' }).click()
  await expect(page).toHaveURL(/\/feeds\/1$/)

  await page.goto('/feeds?floor=5')
  await rows(page).filter({ hasText: '오스카' }).first().click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/10$/)
})

test('S7: 행 케밥 메뉴', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds')
  const leoKebab = page.getByRole('button', {
    name: '표범 · 레오 급여 기록 메뉴',
  })
  const bearKebab = page.getByRole('button', {
    name: '곰 · 우니 급여 기록 메뉴',
  })

  await leoKebab.click()
  await expect(page.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '삭제' })).toBeVisible()
  // 바로 아래 행의 케밥은 열린 메뉴에 가려지므로 떨어진 행을 연다.
  await bearKebab.click()
  await expect(page.getByRole('menu')).toHaveCount(1)
  await expect(
    page.getByRole('menu', { name: '곰 · 우니 급여 기록 메뉴' }),
  ).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(page).toHaveURL(/\/feeds$/)
})

test('S8: 케밥 수정', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds')
  await page.getByRole('button', { name: '표범 · 레오 급여 기록 메뉴' }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)

  await page.goto('/feeds?floor=5')
  await page
    .getByRole('button', { name: '아로와나 · 아로 급여 기록 메뉴' })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/1\/edit$/)
})

test('S9: 케밥 삭제 성공', async ({ page }) => {
  const api = await mockFeedApi(page)
  await page.goto('/feeds')
  await expect(rows(page).filter({ hasText: '레오' })).toHaveCount(1)

  await page.getByRole('button', { name: '표범 · 레오 급여 기록 메뉴' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(rows(page).filter({ hasText: '레오' })).toHaveCount(0)
  expect(api.deletes.map(({ feedLogId }) => feedLogId)).toEqual([1])
})

test('S10: 삭제 취소·실패', async ({ page }) => {
  await mockFeedApi(page, { deleteStatus: 500 })
  await page.goto('/feeds')
  const kebab = page.getByRole('button', { name: '표범 · 레오 급여 기록 메뉴' })

  await kebab.click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '취소' })
    .click()
  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(kebab).toBeFocused()
  await expect(rows(page).filter({ hasText: '레오' })).toHaveCount(1)

  await kebab.click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()
  await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
  await expect(rows(page).filter({ hasText: '레오' })).toHaveCount(1)
})

test('S11: 빈 날짜', async ({ page }) => {
  await mockFeedApi(page, { feedLogs: [] })
  await page.goto('/feeds')

  await expect(
    page.getByText('해당 날짜에 급여 내역이 없습니다.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '다음 페이지' })).toHaveCount(0)
})

test('S12: 조건 유지와 잘못된 쿼리', async ({ page }) => {
  await mockFeedApi(page)
  const today = todayIsoDate()
  await page.goto(`/feeds?date=${today}&floor=5&page=2`)
  await expect(rows(page)).toHaveCount(2)
  await page.reload()
  await expect(page.getByRole('button', { name: '5층' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(rows(page)).toHaveCount(2)
  await expect(page).toHaveURL(/page=2/)

  await page.goto('/feeds?floor=7&page=x&date=bad')
  await expect(page.getByRole('button', { name: '4층' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(rows(page)).toHaveCount(10)
})

test('S13: 조회 실패', async ({ page }) => {
  await mockFeedApi(page)
  await page.route(feedListPattern, (route) =>
    route.fulfill({ status: 500, json: {} }),
  )
  await page.goto('/feeds')

  await expect(
    page.getByText('급여 내역을 불러오지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
})
