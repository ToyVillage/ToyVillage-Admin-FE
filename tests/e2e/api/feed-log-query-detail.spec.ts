import { expect, test, type Page } from '@playwright/test'
import { errorBody, mockFeedApi, todayIsoDate } from '../support/feed-api'

// 대상: GET /feed-log/admin/{feedLogId}(기록), GET /feed-log/{feedLogId}(특이사항),
// GET /animal-manage/{animalManageId}(분류), GET /feed-log/admin/history/{animalManageId}(이력).
// 상세 한 화면이 네 곳을 합쳐 그린다는 점을 계약으로 고정한다. 실제 서버는 호출하지 않는다.

const adminDetailPattern = /^https:\/\/[^/]+\/feed-log\/admin\/(\d+)$/

const historyRows = (page: Page) => page.getByTestId('feed-history-row')

test('S1: 상세 진입 시 기록·특이사항·개체·이력을 모두 조회한다', async ({
  page,
}) => {
  const api = await mockFeedApi(page)

  await page.goto('/feeds/1')
  await expect(page.getByRole('heading', { name: '레오' })).toBeVisible()

  expect(api.requests.history).toBe(1)
  expect(api.requests.animal).toBe(1)
  // 상세 1건 + 이력 3건이 각각 관리자·작성자 상세를 쓴다.
  expect(api.requests.adminDetail).toBe(4)
  expect(api.requests.ownDetail).toBe(4)
})

test('S2: 특이사항은 GET /feed-log/{feedLogId} 의 significant 를 쓴다', async ({
  page,
}) => {
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
  // 명세상 급여량은 정수다(단위 없음).
  await expect(page.getByText('2kg').first()).toBeVisible()
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
