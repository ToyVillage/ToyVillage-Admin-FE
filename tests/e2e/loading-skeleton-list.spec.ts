import { test, expect, type Page } from '@playwright/test'
import { mockNoticeApi, noticeListPattern } from './support/notice-api'
import { mockTeamList } from './support/team-api'

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
  { id: 'S3', name: '휴관일 관리', path: '/notices/guide' },
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
  // 분류 탭은 팀 목록이 기준이다(공지 mock 의 분류와 같은 이름).
  await mockTeamList(page, ['팀이름 1', '팀이름 2'])
  await mockNoticeApi(page)
  await page.goto('/notices/list')
  await expect(page.getByTestId('notice-row').first()).toBeVisible()

  // 이후 목록 조회는 응답하지 않는다.
  await page.route(noticeListPattern, () => new Promise<void>(() => {}))
  await page.getByRole('button', { name: '팀이름 1' }).click()

  await expect(page.getByRole('status', { name: '불러오는 중' })).toHaveCount(0)
  await expect(page.getByTestId('notice-row').first()).toBeVisible()
})
