import { expect, test, type Page } from '@playwright/test'
import {
  mockAnimalManageApi,
  storedFilePattern,
} from './support/animal-manage-api'
import {
  feedHistoryPattern,
  mockFeedApi,
  mockFeedLog,
  todayIsoDate,
} from './support/feed-api'

// 승인된 시나리오(feed-detail.approved.json: S1~S11, 2026-10-28 개체별 급여 이력)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 개체는 `support/animal-manage-api`(동식이 = 1, 딸기 = 10), 4층 이력은 `support/feed-api` 의 page.route mock,
// 5층 이력도 `support/feed-api` 의 page.route mock(개체 10 — 오늘·어제 2건)이다.

const historyLogs = [
  mockFeedLog({
    feedLogId: 1,
    feedDateTime: '2026-09-03T09:30:00',
  }),
  mockFeedLog({
    feedLogId: 2,
    feedType: '단배추',
    feedAmount: 1500,
    remainingAmount: 0,
    significant: '',
    name: '김수인',
    feedDateTime: '2026-09-02T09:20:00',
  }),
  mockFeedLog({
    feedLogId: 3,
    remainingAmount: 20,
    significant: '',
    name: '박도현',
    feedDateTime: '2026-09-01T09:15:00',
  }),
]

const rows = (page: Page) => page.getByTestId('feed-history-row')

async function headers(page: Page) {
  const header = page.getByTestId('feed-history-header')
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

function rowKebab(page: Page, index: number) {
  return rows(page)
    .nth(index)
    .getByRole('button', { name: /급여 기록 메뉴/ })
}

test('S1: 4층 개체 카드', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page, { feedLogs: historyLogs })
  await page.goto('/feeds/animals/1')

  await expect(page.getByRole('heading', { name: '동식이' })).toBeVisible()
  await expect(page.getByRole('img', { name: '동식이 사진' })).toBeVisible()
  await expect(page.getByText('수컷')).toBeVisible()
  await expect(page.getByText('4층', { exact: true })).toBeVisible()
  await expect(page.getByText('2019년')).toBeVisible()
  await expect(page.getByText('알락꼬리여우원숭이와 합사 중')).toBeVisible()
  await expect(
    page.getByRole('link', { name: '관찰 및 특이사항 보러가기' }),
  ).toBeVisible()
})

test('S2: 4층 급여 이력 표', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page, { feedLogs: historyLogs })
  await page.goto('/feeds/animals/1')

  await expect(rows(page)).toHaveCount(3)
  await expect(page.getByText('3건')).toBeVisible()
  expect(await headers(page)).toEqual([
    '급여일시',
    '먹이 종류',
    '급여량',
    '잔량',
    '특이사항',
    '급여자',
  ])
  expect(await cells(page, 0)).toEqual([
    '2026.09.03 09:30',
    '염소사료',
    '200 g/ml',
    '100 g/ml',
    '평소보다 식욕이 왕성함.',
    '이승현',
    '',
  ])
  expect((await cells(page, 1)).slice(0, 5)).toEqual([
    '2026.09.02 09:20',
    '단배추',
    '1500 g/ml',
    '0 g/ml',
    '-',
  ])
  expect((await cells(page, 2))[0]).toBe('2026.09.01 09:15')
})

test('S3: 5층 개체와 이력', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page)
  await page.goto('/feeds/fifth-floor/animals/10')

  await expect(page.getByText('5층', { exact: true })).toBeVisible()
  expect(await headers(page)).toEqual([
    '급여일',
    '먹이 종류',
    '급여량',
    '급여자',
  ])
  await expect(rows(page)).toHaveCount(2)
  expect((await cells(page, 0))[0]).toBe(todayIsoDate().replaceAll('-', '.'))
  expect((await cells(page, 0)).slice(1, 4)).toEqual([
    '펠렛',
    '15 g/ml',
    '박도현',
  ])
})

test('S4: 관찰 및 특이사항 보러가기', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page, { feedLogs: historyLogs })
  await page.goto('/feeds/animals/1')

  await page.getByRole('link', { name: '관찰 및 특이사항 보러가기' }).click()
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
})

test('S5: 행 케밥 수정', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page, { feedLogs: historyLogs })
  await page.goto('/feeds/animals/1')

  await rowKebab(page, 0).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)

  await page.goto('/feeds/fifth-floor/animals/10')
  await rowKebab(page, 0).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/10\/edit$/)
})

test('S6: 행 삭제 성공', async ({ page }) => {
  await mockAnimalManageApi(page)
  const api = await mockFeedApi(page, { feedLogs: historyLogs })
  await page.goto('/feeds/animals/1')
  await expect(rows(page)).toHaveCount(3)

  await rowKebab(page, 1).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(rows(page)).toHaveCount(2)
  await expect(page.getByText('2건')).toBeVisible()
  expect(api.deletes.map(({ feedLogId }) => feedLogId)).toEqual([2])
})

test('S7: 삭제 실패', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page, { feedLogs: historyLogs, deleteStatus: 500 })
  await page.goto('/feeds/animals/1')

  await rowKebab(page, 0).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
  await expect(rows(page)).toHaveCount(3)
})

test('S8: 이력 없음·사진 없음', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page, { feedLogs: [] })
  await page.route(storedFilePattern, (route) => route.abort())
  await page.goto('/feeds/animals/1')

  await expect(page.getByText('급여 이력이 없습니다.')).toBeVisible()
  await expect(page.getByText('0건')).toBeVisible()
  await expect(page.getByRole('img', { name: '동식이 사진' })).toBeVisible()
})

test('S9: 불러오기 실패와 다시 시도', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page, { feedLogs: historyLogs })
  let failures = 1
  await page.route(feedHistoryPattern, async (route) => {
    if (failures > 0) {
      failures -= 1
      await route.fulfill({ status: 500, json: {} })
      return
    }
    await route.fallback()
  })
  await page.goto('/feeds/animals/1')

  await expect(page.getByText('정보를 불러오지 못했습니다')).toBeVisible()
  await page.getByRole('button', { name: '다시 시도' }).click()
  await expect(rows(page)).toHaveCount(3)
})

test('S10: 뒤로가기', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page, { feedLogs: historyLogs })
  await page.goto('/feeds/1')
  await page.getByRole('button', { name: '급여 이력 보기' }).click()
  await expect(page).toHaveURL(/\/feeds\/animals\/1$/)

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/feeds\/1$/)

  await page.goto('/feeds/animals/1')
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/feeds$/)
})

test('S11: 행 클릭 이동', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page, { feedLogs: historyLogs })
  await page.goto('/feeds/animals/1')

  await rows(page).nth(1).click()
  await expect(page).toHaveURL(/\/feeds\/2$/)
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/feeds\/animals\/1$/)

  await page.goto('/feeds/fifth-floor/animals/10')
  await rows(page).first().click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/10$/)
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/animals\/10$/)
})
