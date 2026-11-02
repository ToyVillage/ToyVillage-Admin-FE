import { expect, test, type Page } from '@playwright/test'
import { mockAnimalManageApi } from '../support/animal-manage-api'
import { errorBody, mockFeedApi, todayIsoDate } from '../support/feed-api'

// 대상: GET /feed-log/admin/{feedLogId}(기록), GET /feed-log/admin/history/{animalManageId}(이력).
// 기록 상세(`/feeds/:id`)는 기록 응답만, 개체별 급여 이력(`/feeds/animals/:animalId`)은 이력 응답만으로 채워진다는 점을
// 고정한다(2026-10-28 수정안에서 이력 표가 개체별 급여 이력 화면으로 옮겨졌다). 실제 서버는 호출하지 않는다.

const adminDetailPattern = /^https:\/\/[^/]+\/feed-log\/admin\/(\d+)$/

const historyRows = (page: Page) => page.getByTestId('feed-history-row')

test('S1: 기록 상세는 기록 1회만 조회하고 이력은 부르지 않는다', async ({
  page,
}) => {
  const api = await mockFeedApi(page)

  await page.goto('/feeds/1')
  await expect(page.getByText('표범 · 레오의 급여 기록입니다')).toBeVisible()

  expect(api.requests.adminDetail).toBe(1)
  expect(api.requests.history).toBe(0)
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
  // 기록 상세는 급여일시를 한 칸(`YYYY.MM.DD HH:mm`)에 보여 준다.
  await expect(page.getByText(`${today} 09:30`).first()).toBeVisible()
  await expect(page.getByText('김수인').first()).toBeVisible()
  // 급여량은 실수다. 소수점은 필요한 만큼만 남기고 단위(feedUnit)를 붙인다.
  await expect(page.getByText('1.2 kg/l').first()).toBeVisible()
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

test('S5: 개체별 급여 이력은 이력 1회만 조회하고 최신 급여가 위에 온다', async ({
  page,
}) => {
  await mockAnimalManageApi(page)
  const api = await mockFeedApi(page)

  await page.goto('/feeds/animals/1')
  await expect(historyRows(page)).toHaveCount(3)

  const today = todayIsoDate().replaceAll('-', '.')
  await expect(historyRows(page).first()).toContainText(`${today} 09:30`)
  expect(api.requests.history).toBe(1)
  expect(api.requests.adminDetail).toBe(0)
})

test('S6: 숫자가 아닌 id 로 진입하면 조회하지 않고 목록으로 되돌린다', async ({
  page,
}) => {
  const api = await mockFeedApi(page)

  await page.goto('/feeds/feed-1')

  await expect(page).toHaveURL(/\/feeds$/)
  expect(api.requests.adminDetail).toBe(0)
})
