import { test, expect, type Page } from '@playwright/test'
import { mockNoticeApi, noticeListPattern } from './support/notice-api'
import { mockTaskApi, taskListPattern } from './support/task-api'

// 승인된 시나리오(loading-skeleton-list.approved.json: S1~S15)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 실제 서버는 호출하지 않는다. 조회 지연은 응답하지 않는 page.route 로 만든다.

const apiPattern = /^https:\/\/api\.e2e\.invalid\//

// 모든 API 응답을 멈춰 첫 조회가 끝나지 않게 한다.
async function stallApi(page: Page) {
  await page.route(apiPattern, () => new Promise<void>(() => {}))
}

async function expectSkeleton(page: Page) {
  const skeleton = page.getByRole('status', { name: '불러오는 중' })
  await expect(skeleton).toBeVisible()
  await expect(skeleton).toHaveAttribute('aria-busy', 'true')
  await expect(page.getByText(/불러오는 중입니다/)).toHaveCount(0)
}

const screens = [
  { id: 'S1', name: '대시보드', path: '/' },
  { id: 'S2', name: '공지사항 목록', path: '/notices/list' },
  { id: 'S3', name: '휴무일 관리', path: '/notices/guide' },
  { id: 'S4', name: '자료실 목록', path: '/notices/resources' },
  { id: 'S5', name: '단체예약 목록', path: '/notices/reservations' },
  { id: 'S6', name: '업무관리 목록', path: '/tasks' },
  { id: 'S7', name: '업무보고 목록', path: '/task-reports' },
  { id: 'S8', name: '업무일지 목록', path: '/work-logs' },
  { id: 'S9', name: '업무일지 양식 목록', path: '/work-logs?tab=forms' },
  { id: 'S10', name: '팀 설정', path: '/settings/teams' },
  { id: 'S11', name: '개체관리 종 목록', path: '/species' },
  { id: 'S12', name: '먹이 급여 목록', path: '/feeds' },
]

for (const screen of screens) {
  test(`${screen.id}: ${screen.name} 조회 중 스켈레톤`, async ({ page }) => {
    await stallApi(page)
    await page.goto(screen.path)
    await expectSkeleton(page)
  })
}

test('S13: 조회 성공 → 스켈레톤 사라짐', async ({ page }) => {
  await mockNoticeApi(page)
  let release!: () => void
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(noticeListPattern, async (route) => {
    await released
    await route.fallback()
  })

  await page.goto('/notices/list')
  const skeleton = page.getByRole('status', { name: '불러오는 중' })
  await expect(skeleton).toBeVisible()

  release()
  await expect(skeleton).toHaveCount(0)
  await expect(page.getByTestId('notice-row').first()).toBeVisible()
})

test('S14: 조회 실패 → 스켈레톤 대신 기존 오류 표시', async ({ page }) => {
  await page.route(noticeListPattern, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: '서버 오류' }),
    }),
  )

  await page.goto('/notices/list')
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: '공지사항을 불러오지 못했습니다' }),
  ).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('status', { name: '불러오는 중' })).toHaveCount(0)
})

test('S15: 재조회에는 스켈레톤을 다시 보이지 않음', async ({ page }) => {
  await mockTaskApi(page)
  await page.goto('/tasks')
  const rows = page.getByTestId('task-row')
  await expect(rows.first()).toBeVisible()
  const firstRowText = (await rows.first().textContent()) ?? ''

  // 이후 목록 조회는 응답하지 않는다. 상태 탭은 서버에 다시 조회한다.
  let refetched = false
  await page.route(taskListPattern, () => {
    refetched = true
    return new Promise<void>(() => {})
  })
  await page.getByRole('button', { name: '진행중', exact: true }).click()

  await expect.poll(() => refetched).toBe(true)
  await expect(page.getByRole('status', { name: '불러오는 중' })).toHaveCount(0)
  await expect(rows.first()).toHaveText(firstRowText)
})

test('S16: 목록 조회 중에도 정적 UI는 실제 UI로 보인다', async ({ page }) => {
  await stallApi(page)
  await page.goto('/notices/list')
  await expectSkeleton(page)

  await expect(
    page.getByRole('heading', { name: '공지사항', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: /공지 생성하기/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: '전체', exact: true }),
  ).toBeVisible()
  for (const header of ['분류', '제목', '날짜']) {
    await expect(page.getByText(header, { exact: true })).toBeVisible()
  }
  await expect(page.getByPlaceholder('제목을 입력해주세요')).toBeVisible()
})

test('S17: 목록 조회 중 고정 상태 탭 라벨은 실제 UI로 보인다', async ({
  page,
}) => {
  await stallApi(page)
  await page.goto('/tasks')
  await expectSkeleton(page)

  for (const label of ['전체 업무', '진행중', '완료', '지연']) {
    await expect(
      page.getByRole('button', { name: label, exact: true }),
    ).toBeVisible()
  }
})
