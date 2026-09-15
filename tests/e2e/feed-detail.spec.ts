import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(feed-detail.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 mock 만 사용한다.

const historyRows = (page: Page) => page.getByTestId('feed-history-row')

test('S1: 상세 진입 기본 표시', async ({ page }) => {
  await page.goto('/feeds/feed-1')

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
  await expect(page).toHaveURL(/\/feeds\/feed-1$/)

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/feeds$/)
})

test('S3: 급여 이력 건수와 행 수가 일치한다', async ({ page }) => {
  await page.goto('/feeds/feed-1')

  await expect(page.getByText('3건')).toBeVisible()
  await expect(historyRows(page)).toHaveCount(3)
})

test('S4: 급여 이력 표의 열 구성', async ({ page }) => {
  await page.goto('/feeds/feed-1')

  await expect(page.getByText('급여일시').last()).toBeVisible()
  await expect(page.getByText('급여자').last()).toBeVisible()
  await expect(page.getByText('먹이 종류 · 급여량')).toBeVisible()
  await expect(page.getByText('특이사항').last()).toBeVisible()
})

test('S5: `관찰 및 특이사항 보러가기` 는 비활성이다', async ({ page }) => {
  await page.goto('/feeds/feed-1')

  const button = page.getByText('관찰 및 특이사항 보러가기')
  await expect(button).toHaveAttribute('aria-disabled', 'true')

  await button.click()
  await expect(page).toHaveURL(/\/feeds\/feed-1$/)
})

test('S6: 급여 이력이 없는 빈 상태', async ({ page }) => {
  await page.goto('/feeds/feed-6')

  await expect(page.getByText('0건')).toBeVisible()
  await expect(historyRows(page)).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('급여 이력이 없습니다.')
})

test('S7: 급여 이력 행은 클릭 대상이 아니다', async ({ page }) => {
  await page.goto('/feeds/feed-1')

  await historyRows(page).first().click()
  await expect(page).toHaveURL(/\/feeds\/feed-1$/)
})

test('S8: 진입 시 스크롤은 맨 위다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 })
  await page.goto('/feeds')
  await page.mouse.wheel(0, 600)

  await page.getByTestId('feed-row').first().click()
  await expect(page).toHaveURL(/\/feeds\/feed-1$/)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThanOrEqual(1)
})
