import { test, expect } from '@playwright/test'
import { mockNoticeApi } from './support/notice-api'

// 공지사항 API 는 page.route mock 을 쓴다. 실제 서버는 호출하지 않는다.
test.beforeEach(async ({ page }) => {
  await mockNoticeApi(page)
})

test('날짜 필터에서 오래된순을 선택하면 공지가 오름차순으로 정렬된다', async ({
  page,
}) => {
  await page.goto('/notices/list')

  const sortButton = page.getByRole('button', { name: '공지 날짜 정렬' })
  await sortButton.click()

  const sortMenu = page.getByRole('menu', { name: '날짜 정렬 옵션' })
  await expect(sortMenu).toBeVisible()
  await expect(sortButton).toHaveAttribute('aria-expanded', 'true')

  await page.getByRole('menuitemradio', { name: '오래된순' }).click()

  await expect(sortMenu).toBeHidden()
  await expect(page.getByTestId('notice-row').first()).toContainText(
    // mock 공지 중 가장 오래된 공지(2026-07-01)
    '사육사 교육 일정',
  )
})

test('날짜 필터는 바깥 클릭과 Escape로 닫힌다', async ({ page }) => {
  await page.goto('/notices/list')

  const sortButton = page.getByRole('button', { name: '공지 날짜 정렬' })
  const sortMenu = page.getByRole('menu', { name: '날짜 정렬 옵션' })

  await sortButton.click()
  await page.keyboard.press('Escape')
  await expect(sortMenu).toBeHidden()

  await sortButton.click()
  await page.getByRole('heading', { name: '공지사항' }).click()
  await expect(sortMenu).toBeHidden()
})
