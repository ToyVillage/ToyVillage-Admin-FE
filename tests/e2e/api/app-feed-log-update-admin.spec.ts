import { expect, test, type Page } from '@playwright/test'
import {
  errorBody,
  mockFeedApi,
  todayIsoDate,
  type FeedApiOptions,
} from '../support/feed-api'

// 승인된 시나리오(app-feed-log-update-admin.test-scenarios.md)를 변환한 것.
// 대상: PUT /feed-log/admin/{feedLogId}. 실제 서버는 호출하지 않는다.

const field = (page: Page, label: string) => page.getByLabel(label)
const saveButton = (page: Page) =>
  page.getByRole('button', { name: /저장하기|저장 중/ })
const failure = '저장하지 못했습니다. 다시 시도해 주세요.'

async function openEdit(page: Page, options?: FeedApiOptions) {
  const api = await mockFeedApi(page, options)
  await page.goto('/feeds')
  await page.getByRole('button', { name: '표범 · 레오 급여 기록 메뉴' }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(field(page, '먹이 종류')).toHaveValue('생닭')
  return api
}

test('S1: 수정 저장', async ({ page }) => {
  const api = await openEdit(page)
  const listRequests = api.requests.list

  await field(page, '먹이 종류').fill('닭가슴살')
  await field(page, '급여량').fill('2.5kg')
  await field(page, '잔량').fill('0.3kg')
  await field(page, '특이사항').fill('잔반 조금 남김')
  await saveButton(page).click()

  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/feeds(\?.*)?$/)
  expect(api.updates).toHaveLength(1)
  expect(api.updates[0].feedLogId).toBe(1)
  expect(api.updates[0].authorization).toMatch(/^Bearer /)
  expect(api.updates[0].body).toEqual({
    feedDateTime: `${todayIsoDate()}T09:30:00`,
    feedType: '닭가슴살',
    feedAmount: 2.5,
    remainingAmount: 0.3,
    feedUnit: 'KGL',
    significant: '잔반 조금 남김',
  })
  await expect.poll(() => api.requests.list).toBeGreaterThan(listRequests)
})

test('S2: 급여량 표기 변환과 공백 제거', async ({ page }) => {
  const api = await openEdit(page)

  await field(page, '먹이 종류').fill('  생닭 ')
  await field(page, '급여량').fill('2 kg')
  await field(page, '특이사항').fill('')
  await saveButton(page).click()

  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
  expect(api.updates[0].body).toEqual({
    feedDateTime: `${todayIsoDate()}T09:30:00`,
    feedType: '생닭',
    feedAmount: 2,
    remainingAmount: 0,
    feedUnit: 'KGL',
    significant: '',
  })
})

test('S3: 변경 없이 저장', async ({ page }) => {
  const api = await openEdit(page)

  await saveButton(page).click()

  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
  expect(api.updates).toHaveLength(1)
  expect(api.updates[0].body).toEqual({
    feedDateTime: `${todayIsoDate()}T09:30:00`,
    feedType: '생닭',
    feedAmount: 1.2,
    remainingAmount: 0,
    feedUnit: 'KGL',
    significant: '평소보다 식욕이 왕성함. 잔반 없음.',
  })
})

test('S4: 검증 실패', async ({ page }) => {
  const api = await openEdit(page)

  await field(page, '먹이 종류').fill('')
  await saveButton(page).click()

  await expect(page.getByRole('alert')).toContainText([
    '먹이 종류를 입력해주세요!',
  ])
  expect(api.updates).toHaveLength(0)
})

for (const [status, message] of [
  [404, '존재하지 않는 급여일지입니다.'],
  [500, '내부 서버 오류가 발생했습니다.'],
] as const) {
  test(`S5: ${status} 이면 폼에 머물고 입력을 보존한다`, async ({ page }) => {
    const api = await openEdit(page, {
      updateStatus: status,
      updateBody: errorBody(status, message),
    })

    await field(page, '먹이 종류').fill('닭가슴살')
    await saveButton(page).click()

    await expect(page.getByText(failure)).toBeVisible()
    await expect(page).toHaveURL(/\/feeds\/1\/edit$/)
    await expect(field(page, '먹이 종류')).toHaveValue('닭가슴살')
    expect(api.updates.length).toBeGreaterThanOrEqual(1)
  })
}

test('S6: 응답 형식 오류', async ({ page }) => {
  await openEdit(page, { updateStatus: 200, updateBody: {} })

  await saveButton(page).click()

  await expect(page.getByText(failure)).toBeVisible()
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)
})

test('S7: 중복 제출 방지', async ({ page }) => {
  const api = await openEdit(page, { updateDelayMs: 800 })

  await saveButton(page).click()
  await expect(saveButton(page)).toHaveText('저장 중')
  await expect(saveButton(page)).toBeDisabled()
  await saveButton(page).click({ force: true })

  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
  expect(api.updates).toHaveLength(1)
})

test('S8: 수정 후 상세 재조회', async ({ page }) => {
  const api = await openEdit(page)
  const detailRequests = api.requests.adminDetail

  await field(page, '먹이 종류').fill('닭가슴살')
  await field(page, '급여량').fill('2.5')
  await field(page, '특이사항').fill('잔반 조금 남김')
  await saveButton(page).click()
  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
  await page.getByTestId('feed-row').first().click()

  await expect(page).toHaveURL(/\/feeds\/1$/)
  await expect
    .poll(() => api.requests.adminDetail)
    .toBeGreaterThan(detailRequests)
  // 캐시된 옛 값(생닭 1.2kg)이 아니라 수정한 값이 상세에 보인다.
  const main = page.getByRole('main')
  await expect(main.getByText('닭가슴살').first()).toBeVisible()
  await expect(main.getByText('2.5kg').first()).toBeVisible()
  await expect(main.getByText('잔반 조금 남김').first()).toBeVisible()
  await expect(main.getByText('생닭')).toHaveCount(0)
})

test('S9: 잔량이 없는 기록은 잔량을 입력해야 저장한다', async ({ page }) => {
  const api = await mockFeedApi(page)
  api.feedLogs[0].remainingAmount = null
  await page.goto('/feeds')
  await page.getByRole('button', { name: '표범 · 레오 급여 기록 메뉴' }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(field(page, '잔량')).toHaveValue('')

  await saveButton(page).click()
  await expect(page.getByRole('alert')).toContainText(['잔량을 입력해주세요!'])
  expect(api.updates).toHaveLength(0)

  await field(page, '잔량').fill('0')
  await saveButton(page).click()
  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
  expect(api.updates[0].body).toMatchObject({
    remainingAmount: 0,
    feedUnit: 'KGL',
  })
})
