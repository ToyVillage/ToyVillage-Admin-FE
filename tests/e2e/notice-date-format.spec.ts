import { expect, test } from '@playwright/test'
import { createMockNotices, mockNoticeApi } from './support/notice-api'
import { mockTeamList } from './support/team-api'

// 서버가 createdAt을 시간까지 포함해 보내는 경우(#287).
function noticesWithTime() {
  const [first, ...rest] = createMockNotices()
  return [{ ...first, createAt: '2026-10-29T10:32:33.344078' }, ...rest]
}

test.beforeEach(async ({ page }) => {
  await mockTeamList(page, ['팀이름 1', '팀이름 2'])
  await mockNoticeApi(page, { notices: noticesWithTime() })
})

test('목록 날짜 열에 시간을 빼고 날짜만 표시한다', async ({ page }) => {
  await page.goto('/notices/list')

  const row = page.getByTestId('notice-row').first()
  await expect(row).toContainText('2026.10.29')
  await expect(row).not.toContainText('10:32')
})

test('상세에 시간을 빼고 날짜만 표시한다', async ({ page }) => {
  await page.goto('/notices/list/1')

  await expect(page.getByText('2026.10.29', { exact: true })).toBeVisible()
})

test('화면에 없는 시간으로는 목록이 검색되지 않는다', async ({ page }) => {
  await page.goto('/notices/list')
  await expect(page.getByTestId('notice-row').first()).toBeVisible()

  await page.getByRole('searchbox', { name: '공지 검색' }).fill('10:32')

  await expect(page.getByTestId('notice-row')).toHaveCount(0)
})
