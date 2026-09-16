import { expect, test, type Page } from '@playwright/test'
import { errorBody, mockFeedApi, todayIsoDate } from '../support/feed-api'

// 대상: GET /feed-log/admin/{feedLogId}(기록), GET /feed-log/admin/history/{animalManageId}(이력).
// 두 응답만으로 상세와 이력 표가 채워진다는 점을 계약으로 고정한다. 실제 서버는 호출하지 않는다.

const adminDetailPattern = /^https:\/\/[^/]+\/feed-log\/admin\/(\d+)$/

const historyRows = (page: Page) => page.getByTestId('feed-history-row')

test('S1: 상세는 기록 1회 · 이력 1회만 조회한다', async ({ page }) => {
  const api = await mockFeedApi(page)

  await page.goto('/feeds/1')
  await expect(page.getByRole('heading', { name: '레오' })).toBeVisible()

  expect(api.requests.adminDetail).toBe(1)
  expect(api.requests.history).toBe(1)
})

test('S1-1: 특이사항은 상세 응답의 significant 를 쓴다', async ({ page }) => {
  await mockFeedApi(page)

  await page.goto('/feeds/1')

  await expect(
    page.getByText('평소보다 식욕이 왕성함. 잔반 없음.').first(),
  ).toBeVisible()
})

test('S3: 급여일시·급여자·급여량은 관리자 상세 값으로 그린다', async ({
  page,
}) => {
  await mockFeedApi(page)

  await page.goto('/feeds/1')

  const today = todayIsoDate().replaceAll('-', '.')
  await expect(page.getByText(`${today} 09:30`).first()).toBeVisible()
  await expect(page.getByText('김수인').first()).toBeVisible()
  // 급여량은 실수다(단위 없음). 소수점은 필요한 만큼만 남긴다.
  await expect(page.getByText('1.2kg').first()).toBeVisible()
})

test('S4: 없는 급여 기록이면 목록으로 되돌린다', async ({ page }) => {
  await mockFeedApi(page)
  await page.route(adminDetailPattern, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify(errorBody(404, '존재하지 않는 급여 기록입니다.')),
    })
  })

  await page.goto('/feeds/999')

  await expect(page).toHaveURL(/\/feeds$/)
})

test('S5: 급여 이력은 최신 급여가 위에 온다', async ({ page }) => {
  await mockFeedApi(page)

  await page.goto('/feeds/1')
  await expect(historyRows(page)).toHaveCount(3)

  const today = todayIsoDate().replaceAll('-', '.')
  await expect(historyRows(page).first()).toContainText(`${today} 09:30`)
})

test('S6: 숫자가 아닌 id 로 진입하면 조회하지 않고 목록으로 되돌린다', async ({
  page,
}) => {
  const api = await mockFeedApi(page)

  await page.goto('/feeds/feed-1')

  await expect(page).toHaveURL(/\/feeds$/)
  expect(api.requests.adminDetail).toBe(0)
})
