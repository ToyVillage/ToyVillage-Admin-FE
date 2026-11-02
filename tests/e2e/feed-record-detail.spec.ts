import { expect, test, type Page } from '@playwright/test'
import { mockAnimalManageApi } from './support/animal-manage-api'
import {
  feedAdminDetailPattern,
  mockFeedApi,
  mockFeedLog,
  todayIsoDate,
} from './support/feed-api'

// 승인된 시나리오(feed-record-detail.approved.json: S1~S12)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 4층·5층 모두 `support/feed-api` 의 page.route mock 이다(5층 오늘 오스카 · 오돌이 = 10번).

const record = mockFeedLog({ feedDateTime: '2026-09-03T09:30:00' })

async function fieldValues(page: Page) {
  const fields = page.locator('dl > div')
  await expect(fields.first()).toBeVisible()
  return fields.evaluateAll((cards) =>
    cards.map((card) => [
      card.querySelector('dt')?.textContent ?? '',
      card.querySelector('dd')?.textContent ?? '',
    ]),
  )
}

function todayDotted() {
  return todayIsoDate().replaceAll('-', '.')
}

test('S1: 4층 급여 기록 상세', async ({ page }) => {
  await mockFeedApi(page, { feedLogs: [record] })
  await page.goto('/feeds/1')

  await expect(
    page.getByRole('heading', { name: '급여 기록 상세' }),
  ).toBeVisible()
  await expect(
    page.getByText('카피바라 · 동식이의 급여 기록입니다'),
  ).toBeVisible()
  expect(await fieldValues(page)).toEqual([
    ['대상 개체', '카피바라 · 동식이'],
    ['급여일시', '2026.09.03 09:30'],
    ['급여자', '이승현'],
    ['먹이 종류', '염소사료'],
    ['급여량', '200 g/ml'],
    ['잔량', '100 g/ml'],
    ['특이사항', '평소보다 식욕이 왕성함.'],
  ])
})

test('S2: 5층 급여 기록 상세', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds/fifth-floor/10')

  await expect(
    page.getByText('오스카 · 오돌이의 급여 기록입니다'),
  ).toBeVisible()
  expect(await fieldValues(page)).toEqual([
    ['대상 개체', '오스카 · 오돌이'],
    ['급여일', todayDotted()],
    ['급여자', '박도현'],
    ['먹이 종류', '펠렛'],
    ['급여량', '15 g/ml'],
  ])
  await expect(page.getByText('잔량', { exact: true })).toHaveCount(0)
  await expect(page.getByText('특이사항', { exact: true })).toHaveCount(0)
  await expect(page.getByText('급여일시', { exact: true })).toHaveCount(0)
})

test('S3: 급여 이력 보기', async ({ page }) => {
  await mockFeedApi(page, { feedLogs: [record] })
  await mockAnimalManageApi(page)
  await page.goto('/feeds/1')
  await page.getByRole('button', { name: '급여 이력 보기' }).click()
  await expect(page).toHaveURL(/\/feeds\/animals\/1$/)

  await page.goto('/feeds/fifth-floor/10')
  await page.getByRole('button', { name: '급여 이력 보기' }).click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/animals\/10$/)
})

test('S4: 뒤로가기', async ({ page }) => {
  await mockFeedApi(page)
  const listUrl = `/feeds?date=${todayIsoDate()}&floor=5`
  await page.goto(listUrl)
  await page.getByTestId('feed-row').filter({ hasText: '오돌이' }).click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/10$/)

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(new RegExp(`${listUrl.replace('?', '\\?')}$`))

  await page.goto('/feeds/fifth-floor/10')
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/feeds$/)
})

test('S5: 케밥 수정', async ({ page }) => {
  await mockFeedApi(page, { feedLogs: [record] })
  await page.goto('/feeds/1')
  await page.getByRole('button', { name: '급여 기록 메뉴' }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)

  await page.goto('/feeds/fifth-floor/10')
  await page.getByRole('button', { name: '급여 기록 메뉴' }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/10\/edit$/)
})

test('S6: 삭제 성공', async ({ page }) => {
  const api = await mockFeedApi(page, { feedLogs: [record] })
  await mockAnimalManageApi(page)
  await page.goto('/feeds/1')
  await page.getByRole('button', { name: '급여 기록 메뉴' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page).toHaveURL(/\/feeds\/animals\/1$/)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  expect(api.deletes.map(({ feedLogId }) => feedLogId)).toEqual([1])
})

test('S7: 삭제 실패·취소', async ({ page }) => {
  const api = await mockFeedApi(page, {
    feedLogs: [record],
    deleteStatus: 500,
  })
  await page.goto('/feeds/1')

  await page.getByRole('button', { name: '급여 기록 메뉴' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '취소' })
    .click()
  await expect(page.getByRole('alertdialog')).toBeHidden()
  expect(api.deletes).toHaveLength(0)

  await page.getByRole('button', { name: '급여 기록 메뉴' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()
  await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/feeds\/1$/)
})

test('S8: 값이 없을 때', async ({ page }) => {
  await mockFeedApi(page, {
    feedLogs: [{ ...record, remainingAmount: null, significant: '' }],
  })
  await page.goto('/feeds/1')

  const values = Object.fromEntries(await fieldValues(page))
  expect(values['잔량']).toBe('-')
  expect(values['특이사항']).toBe('-')
})

test('S9: 불러오기 실패와 다시 시도', async ({ page }) => {
  await mockFeedApi(page, { feedLogs: [record] })
  let failures = 1
  await page.route(feedAdminDetailPattern, async (route) => {
    if (route.request().method() === 'GET' && failures > 0) {
      failures -= 1
      await route.fulfill({ status: 500, json: {} })
      return
    }
    await route.fallback()
  })
  await page.goto('/feeds/1')

  await expect(page.getByText('정보를 불러오지 못했습니다')).toBeVisible()
  await expect(
    page.getByText('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요'),
  ).toBeVisible()
  await page.getByRole('button', { name: '다시 시도' }).click()
  await expect(
    page.getByText('카피바라 · 동식이의 급여 기록입니다'),
  ).toBeVisible()
})

test('S10: 없는 기록', async ({ page }) => {
  await mockFeedApi(page, { feedLogs: [record] })
  await page.goto('/feeds/abc')
  await expect(page).toHaveURL(/\/feeds$/)

  await page.goto('/feeds/999')
  await expect(page).toHaveURL(/\/feeds$/)
})

const historyLogs = [
  record,
  mockFeedLog({ feedLogId: 2, feedDateTime: '2026-09-02T09:20:00' }),
]

// 기록 상세(/feeds/1) → 급여 이력 → 2번 행으로 들어간다.
async function openRecordFromHistory(page: Page) {
  await page.goto('/feeds/1')
  await page.getByRole('button', { name: '급여 이력 보기' }).click()
  await page.getByTestId('feed-history-row').nth(1).click()
  await expect(page).toHaveURL(/\/feeds\/2$/)
}

const recordMenu = (page: Page) =>
  page.getByRole('button', { name: '급여 기록 메뉴', exact: true })

test('S11: 이력에서 들어간 기록 삭제', async ({ page }) => {
  await mockAnimalManageApi(page)
  const api = await mockFeedApi(page, { feedLogs: historyLogs })
  await openRecordFromHistory(page)

  await recordMenu(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page).toHaveURL(/\/feeds\/animals\/1$/)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(page.getByTestId('feed-history-row')).toHaveCount(1)
  expect(api.deletes.map(({ feedLogId }) => feedLogId)).toEqual([2])

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/feeds\/1$/)
})

test('S12: 이력에서 들어간 기록 수정 뒤 뒤로가기', async ({ page }) => {
  await mockAnimalManageApi(page)
  await mockFeedApi(page, { feedLogs: historyLogs })
  await openRecordFromHistory(page)

  await recordMenu(page).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/feeds\/2\/edit$/)
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page).toHaveURL(/\/feeds\/2$/)

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/feeds\/animals\/1$/)
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/feeds\/1$/)
})
