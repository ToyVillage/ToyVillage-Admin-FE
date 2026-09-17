import { test, expect } from '@playwright/test'
import { createMockNotices, mockNoticeApi } from './support/notice-api'

// 승인된 시나리오(notice-detail.approved.json: S1~S5)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 공지 API 는 page.route mock 을 쓴다. 실제 서버는 호출하지 않는다.

test('S1: 목록 행 → 상세 이동', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list')
  await page
    .getByTestId('notice-row')
    .first()
    .getByText('7월 13일 휴관안내')
    .click()

  await expect(page).toHaveURL(/\/notices\/list\/1$/)
  await expect(
    page.getByRole('heading', { name: '7월 13일 휴관안내' }),
  ).toBeVisible()
})

test('S2: 읽기 전용 내용 표시', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list/1')

  await expect(page.getByText('분류', { exact: true })).toBeVisible()
  await expect(page.getByText('전체', { exact: true })).toBeVisible()
  await expect(page.getByText('2026-07-06')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: '7월 13일 휴관안내' }),
  ).toBeVisible()
  await expect(page.getByText('그냥 더미 텍스트 입니다.')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '당일 지침.pdf 다운로드' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '휴관안내.png 다운로드' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '휴관안내.jpg 다운로드' }),
  ).toBeVisible()
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '저장하기' })).toHaveCount(0)
})

test('S3: 첨부 없음 → 빈 문구', async ({ page }) => {
  await mockNoticeApi(page, {
    notices: createMockNotices().map((notice) => ({ ...notice, files: [] })),
  })
  await page.goto('/notices/list/1')
  await expect(page.getByText('등록된 자료가 없습니다.')).toBeVisible()
})

test('S4: 뒤로가기 → 목록', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list/1')
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/notices\/list$/)
})

test('S5: 존재하지 않는 공지 → not-found', async ({ page }) => {
  await mockNoticeApi(page)
  await page.goto('/notices/list/999')
  await expect(
    page.getByRole('heading', { name: '공지사항을 찾을 수 없습니다.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: '공지사항 목록으로 돌아가기' }),
  ).toHaveAttribute('href', '/notices/list')
})
