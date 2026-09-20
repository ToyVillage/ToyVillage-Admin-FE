import { test, expect, type Page } from '@playwright/test'
import { mockNoticeApi, noticeItemPattern } from './support/notice-api'

// 승인된 시나리오(loading-skeleton-detail.approved.json: S1~S21)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 실제 서버는 호출하지 않는다. 조회 지연은 응답하지 않는 page.route 로 만든다.

const apiPattern = /^https:\/\/api\.e2e\.invalid\//

// 모든 API 응답을 멈춰 첫 조회가 끝나지 않게 한다.
async function stallApi(page: Page) {
  await page.route(apiPattern, () => new Promise<void>(() => {}))
}

async function expectSkeleton(page: Page) {
  const skeleton = page.getByRole('status', { name: '불러오는 중' }).first()
  await expect(skeleton).toBeVisible()
  await expect(skeleton).toHaveAttribute('aria-busy', 'true')
  await expect(page.getByText(/불러오는 중입니다/)).toHaveCount(0)
}

// 조회를 release() 할 때까지 붙잡는다. 이후 요청은 먼저 등록한 mock 으로 넘긴다.
async function holdRoute(page: Page, pattern: RegExp) {
  let release!: () => void
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(pattern, async (route) => {
    await released
    await route.fallback()
  })
  return () => release()
}

const screens = [
  { id: 'S1', name: '공지사항 상세', path: '/notices/list/1' },
  { id: 'S2', name: '휴관일 상세', path: '/notices/guide/1' },
  { id: 'S3', name: '업무 상세', path: '/tasks/1' },
  { id: 'S4', name: '업무보고 상세', path: '/task-reports/1' },
  { id: 'S5', name: '업무일지 상세', path: '/work-logs/1' },
  { id: 'S6', name: '업무일지 양식 상세', path: '/work-logs/forms/1' },
  { id: 'S7', name: '먹이 급여 상세', path: '/feeds/1' },
  { id: 'S8', name: '종 상세', path: '/species/1' },
  { id: 'S9', name: '개체 상세', path: '/species/1/individuals/1' },
  {
    id: 'S10',
    name: '관찰 상세',
    path: '/species/1/individuals/1/observations/1',
  },
  { id: 'S11', name: '공지사항 수정', path: '/notices/list/1/edit' },
  { id: 'S12', name: '휴관일 수정', path: '/notices/guide/1/edit' },
  { id: 'S13', name: '운영시간 수정', path: '/notices/guide/hours/2026-09-20' },
  { id: 'S14', name: '자료실 수정', path: '/notices/resources/1/edit' },
  { id: 'S15', name: '단체예약 수정', path: '/notices/reservations/1' },
  { id: 'S16', name: '종 수정', path: '/species/1/edit' },
  { id: 'S17', name: '개체 수정', path: '/species/1/individuals/1/edit' },
  {
    id: 'S18',
    name: '관찰 수정',
    path: '/species/1/individuals/1/observations/1/edit',
  },
]

for (const screen of screens) {
  test(`${screen.id}: ${screen.name} 조회 중 스켈레톤`, async ({ page }) => {
    await stallApi(page)
    await page.goto(screen.path)
    await expectSkeleton(page)
  })
}

test('S19: 상세 조회 성공 → 스켈레톤 사라짐', async ({ page }) => {
  await mockNoticeApi(page)
  const release = await holdRoute(page, noticeItemPattern)

  await page.goto('/notices/list/1')
  const skeleton = page.getByRole('status', { name: '불러오는 중' })
  await expect(skeleton).toBeVisible()

  release()
  await expect(skeleton).toHaveCount(0)
  await expect(page.getByText('7월 13일 휴관안내').first()).toBeVisible()
})

test('S20: 수정 조회 성공 → 값이 채워진 폼', async ({ page }) => {
  await mockNoticeApi(page)
  const release = await holdRoute(page, noticeItemPattern)

  await page.goto('/notices/list/1/edit')
  const skeleton = page.getByRole('status', { name: '불러오는 중' })
  await expect(skeleton).toBeVisible()
  await expect(page.getByLabel('제목')).toHaveCount(0)

  release()
  await expect(skeleton).toHaveCount(0)
  await expect(page.getByLabel('제목')).toHaveValue('7월 13일 휴관안내')
})

test('S21: 조회 실패 → 스켈레톤 대신 기존 오류 표시', async ({ page }) => {
  await page.route(noticeItemPattern, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: '서버 오류' }),
    }),
  )

  await page.goto('/notices/list/1')
  await expect(page.getByText('공지사항을 불러오지 못했습니다.')).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByRole('status', { name: '불러오는 중' })).toHaveCount(0)
})

test('S22: 상세 조회 중에도 정적 UI는 실제 UI로 보인다', async ({ page }) => {
  await stallApi(page)
  await page.goto('/notices/list/1')
  await expectSkeleton(page)

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  for (const label of ['분류', '날짜', '첨부자료']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible()
  }
})

test('S23: 수정 조회 중에도 폼 라벨은 실제 UI로 보인다', async ({ page }) => {
  await stallApi(page)
  await page.goto('/notices/list/1/edit')
  await expectSkeleton(page)

  for (const label of ['제목', '분류', '첨부자료']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible()
  }
  await expect(page.getByText('상세 업무 내용')).toBeVisible()
})
