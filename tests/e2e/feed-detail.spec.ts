import { expect, test as base, type Page } from '@playwright/test'
import { mockFeedApi, type FeedApiHandle } from './support/feed-api'

// 승인된 시나리오(feed-detail.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 먹이 급여 API 연동 이후 mock 데이터 대신 `support/feed-api` 의 page.route mock 을 쓴다.
// 실제 서버는 호출하지 않는다.

const test = base.extend<{ feedApi: FeedApiHandle }>({
  feedApi: [
    async ({ page }, runTest) => {
      await runTest(await mockFeedApi(page))
    },
    { auto: true },
  ],
})

const historyRows = (page: Page) => page.getByTestId('feed-history-row')

test('S1: 상세 진입 기본 표시', async ({ page }) => {
  await page.goto('/feeds/1')

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '레오' })).toBeVisible()
  await expect(page.getByText('포유류')).toBeVisible()
  await expect(page.getByText('급여일시').first()).toBeVisible()
  await expect(page.getByText('급여자').first()).toBeVisible()
  await expect(page.getByText('먹이 종류', { exact: true })).toBeVisible()
  await expect(page.getByText('급여량', { exact: true })).toBeVisible()
  await expect(page.getByText('특이사항').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: '급여 이력' })).toBeVisible()
})

test('S2: 목록에서 상세로, 뒤로가기로 목록으로', async ({ page }) => {
  await page.goto('/feeds')
  await page.getByTestId('feed-row').first().click()
  await expect(page).toHaveURL(/\/feeds\/1$/)

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/feeds$/)
})

test('S3: 급여 이력 건수와 행 수가 일치한다', async ({ page }) => {
  await page.goto('/feeds/1')

  await expect(page.getByText('3건')).toBeVisible()
  await expect(historyRows(page)).toHaveCount(3)
})

test('S4: 급여 이력 표의 열 구성', async ({ page }) => {
  await page.goto('/feeds/1')

  await expect(page.getByText('급여일시').last()).toBeVisible()
  await expect(page.getByText('급여자').last()).toBeVisible()
  await expect(page.getByText('먹이 종류 · 급여량')).toBeVisible()
  await expect(page.getByText('특이사항').last()).toBeVisible()
})

test('S5: `관찰 및 특이사항 보러가기` 는 비활성이다', async ({ page }) => {
  await page.goto('/feeds/1')

  const button = page.getByText('관찰 및 특이사항 보러가기')
  await expect(button).toHaveAttribute('aria-disabled', 'true')

  await button.click()
  await expect(page).toHaveURL(/\/feeds\/1$/)
})

// 급여 이력은 개체 기준이라 조회 중인 급여 기록 자신이 항상 한 건 포함된다.
// 개체 `초코`(6)는 그 한 건뿐이다.
test('S6: 급여 이력이 자기 자신 한 건뿐인 상태', async ({ page }) => {
  await page.goto('/feeds/6')

  await expect(page.getByText('1건')).toBeVisible()
  await expect(historyRows(page)).toHaveCount(1)
})

test('S7: 급여 이력 행은 클릭 대상이 아니다', async ({ page }) => {
  await page.goto('/feeds/1')

  await historyRows(page).first().click()
  await expect(page).toHaveURL(/\/feeds\/1$/)
})

test('S8: 진입 시 스크롤은 맨 위다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 })
  await page.goto('/feeds')
  await page.mouse.wheel(0, 600)

  await page.getByTestId('feed-row').first().click()
  await expect(page).toHaveURL(/\/feeds\/1$/)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThanOrEqual(1)
})
