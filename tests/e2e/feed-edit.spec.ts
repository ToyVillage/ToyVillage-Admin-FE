import { expect, test, type Page } from '@playwright/test'
import { mockAnimalManageApi } from './support/animal-manage-api'
import {
  feedAdminDetailPattern,
  mockFeedApi,
  mockFeedLog,
  todayIsoDate,
} from './support/feed-api'

// 승인된 시나리오(feed-edit.approved.json: S1~S12, 2026-10-28 4층·5층 수정안)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 4층·5층 모두 `support/feed-api` 의 page.route mock 이다(5층 오늘 오스카 · 오돌이 = 10번).

const record = mockFeedLog({
  feedDateTime: '2026-09-03T09:30:00',
  animalTaxonomic: 'MAMMALS',
})

const field = (page: Page, label: string) =>
  page.getByLabel(label, { exact: true })
const saveButton = (page: Page) =>
  page.getByRole('button', { name: /저장하기|저장 중/ })

test('S1: 4층 수정 화면 복원', async ({ page }) => {
  await mockFeedApi(page, { feedLogs: [record] })
  await page.goto('/feeds/1/edit')

  await expect(
    page.getByRole('heading', { name: '급여 기록 수정' }),
  ).toBeVisible()
  await expect(
    page.getByText('카피바라 · 동식이의 급여 기록을 수정합니다'),
  ).toBeVisible()
  await expect(field(page, '대상 개체')).toHaveValue('카피바라 · 동식이')
  await expect(field(page, '대상 개체')).toHaveAttribute('readonly', '')
  await expect(field(page, '급여일시')).toHaveValue('2026.09.03 09:30')
  await expect(field(page, '급여자')).toHaveValue('이승현')
  await expect(field(page, '먹이 종류')).toHaveValue('염소사료')
  await expect(field(page, '급여량')).toHaveValue('200')
  await expect(field(page, '잔량')).toHaveValue('100')
  await expect(field(page, '특이사항')).toHaveValue('평소보다 식욕이 왕성함.')
  await expect(page.getByText('g/ml', { exact: true })).toHaveCount(2)
})

test('S2: 5층 수정 화면 복원', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds/fifth-floor/10/edit')

  await expect(field(page, '대상 개체')).toHaveValue('오스카 · 오돌이')
  await expect(field(page, '급여일')).toHaveValue(
    todayIsoDate().replaceAll('-', '.'),
  )
  await expect(field(page, '급여자')).toHaveValue('박도현')
  await expect(field(page, '먹이 종류')).toHaveValue('펠렛')
  await expect(field(page, '급여량')).toHaveValue('15')
  await expect(field(page, '잔량')).toHaveCount(0)
  await expect(field(page, '특이사항')).toHaveCount(0)
})

test('S3: 4층 저장 — 목록에서 왔을 때', async ({ page }) => {
  const api = await mockFeedApi(page, {
    feedLogs: [{ ...record, feedDateTime: `${todayIsoDate()}T09:30:00` }],
  })
  await page.goto('/feeds?floor=4')
  await page
    .getByRole('button', { name: '카피바라 · 동식이 급여 기록 메뉴' })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)

  await field(page, '먹이 종류').fill('단배추')
  await field(page, '급여량').fill('250')
  await field(page, '잔량').fill('30')
  await field(page, '특이사항').fill('잔반 조금')
  await saveButton(page).click()

  await expect(page).toHaveURL(/\/feeds\?floor=4$/)
  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
  expect(api.updates).toHaveLength(1)
  expect(api.updates[0].body).toEqual({
    feedDateTime: `${todayIsoDate()}T09:30:00`,
    feedType: '단배추',
    feedAmount: 250,
    remainingAmount: 30,
    feedUnit: 'GML',
    significant: '잔반 조금',
  })
})

test('S4: 5층 저장 — 기록 상세에서 왔을 때', async ({ page }) => {
  await mockFeedApi(page)
  await page.goto('/feeds/fifth-floor/10')
  await page.getByRole('button', { name: '급여 기록 메뉴' }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/10\/edit$/)

  await field(page, '먹이 종류').fill('냉동새우')
  await field(page, '급여량').fill('20')
  await saveButton(page).click()

  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/10$/)
  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
  await expect(page.getByText('냉동새우')).toBeVisible()
  await expect(page.getByText('20 g/ml')).toBeVisible()
})

test('S5: 저장 — 급여 이력에서 왔을 때', async ({ page }) => {
  await mockAnimalManageApi(page)
  const api = await mockFeedApi(page, { feedLogs: [record] })
  await page.goto('/feeds/animals/1')
  await page
    .getByTestId('feed-history-row')
    .first()
    .getByRole('button', { name: /급여 기록 메뉴/ })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)

  await saveButton(page).click()
  await expect(page).toHaveURL(/\/feeds\/animals\/1$/)
  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
  expect(api.updates).toHaveLength(1)
})

test('S6: 필수 검증', async ({ page }) => {
  const api = await mockFeedApi(page, { feedLogs: [record] })
  await page.goto('/feeds/1/edit')

  await field(page, '먹이 종류').fill('')
  await field(page, '급여량').fill('')
  await field(page, '잔량').fill('')
  await saveButton(page).click()

  await expect(page.getByText('먹이 종류를 입력해주세요!')).toBeVisible()
  await expect(page.getByText('급여량을 입력해주세요!')).toBeVisible()
  await expect(page.getByText('잔량을 입력해주세요!')).toBeVisible()
  expect(api.updates).toHaveLength(0)
})

test('S7: 숫자 칸 규칙', async ({ page }) => {
  const api = await mockFeedApi(page, { feedLogs: [record] })
  await page.goto('/feeds/1/edit')

  await field(page, '급여량').fill('')
  // 단위·공백 같은 숫자가 아닌 글자는 입력하는 즉시 걸러진다.
  await field(page, '급여량').pressSequentially('2 kg')
  await expect(field(page, '급여량')).toHaveValue('2')

  await field(page, '급여량').fill('0')
  await field(page, '잔량').fill('0')
  await saveButton(page).click()
  await expect(page.getByText('급여량을 숫자로 입력해주세요!')).toBeVisible()
  await expect(page.getByText('잔량을 숫자로 입력해주세요!')).toHaveCount(0)
  expect(api.updates).toHaveLength(0)

  await field(page, '급여량').fill('2')
  await saveButton(page).click()
  await expect.poll(() => api.updates.length).toBe(1)
  expect(api.updates[0].body).toMatchObject({
    feedAmount: 2,
    remainingAmount: 0,
  })
})

test('S8: KGL 기록', async ({ page }) => {
  const api = await mockFeedApi(page, {
    feedLogs: [
      { ...record, feedUnit: 'KGL', feedAmount: 1.2, remainingAmount: 0.3 },
    ],
  })
  await page.goto('/feeds/1/edit')

  await expect(page.getByText('kg/l', { exact: true })).toHaveCount(2)
  await expect(field(page, '급여량')).toHaveValue('1.2')
  await saveButton(page).click()
  await expect.poll(() => api.updates.length).toBe(1)
  expect(api.updates[0].body).toMatchObject({
    feedUnit: 'KGL',
    feedAmount: 1.2,
  })
})

test('S9: 저장 실패와 중복 제출', async ({ page }) => {
  const api = await mockFeedApi(page, {
    feedLogs: [record],
    updateStatus: 500,
    updateDelayMs: 800,
  })
  await page.goto('/feeds/1/edit')
  await field(page, '먹이 종류').fill('단배추')

  await saveButton(page).click()
  await expect(page.getByRole('button', { name: '저장 중' })).toBeDisabled()
  await saveButton(page).click({ force: true })

  await expect(
    page.getByText('저장하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  expect(api.updates).toHaveLength(1)
  await expect(field(page, '먹이 종류')).toHaveValue('단배추')
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)
})

test('S10: 이탈 보호', async ({ page }) => {
  await mockFeedApi(page, { feedLogs: [record] })
  await page.goto('/feeds/1/edit')

  await field(page, '먹이 종류').fill('단배추')
  await page.getByRole('link', { name: '뒤로가기' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('정말 나가시겠습니까?')
  await dialog.getByRole('button', { name: '취소' }).click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)

  await field(page, '먹이 종류').fill('염소사료')
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/feeds\/1$/)
})

test('S11: 불러오기 실패와 다시 시도', async ({ page }) => {
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
  await page.goto('/feeds/1/edit')

  await expect(page.getByText('정보를 불러오지 못했습니다')).toBeVisible()
  await page.getByRole('button', { name: '다시 시도' }).click()
  await expect(field(page, '먹이 종류')).toHaveValue('염소사료')
})

test('S12: 없는 기록', async ({ page }) => {
  await mockFeedApi(page, { feedLogs: [record] })
  await page.goto('/feeds/abc/edit')
  await expect(page).toHaveURL(/\/feeds$/)

  await page.goto('/feeds/999/edit')
  await expect(page).toHaveURL(/\/feeds$/)
})
