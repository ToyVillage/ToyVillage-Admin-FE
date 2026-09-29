import { expect, test, type Page, type Route } from '@playwright/test'
import {
  mockWorkReportApi,
  mockWorkReports,
  workReportApprovePattern,
  type MockWorkReport,
  type WorkReportApiHandle,
} from '../support/task-report-api'

// 승인된 시나리오(app-work-report-approve.test-scenarios.md: S1~S11)를 mock 으로 변환한 것.
// 대상: PATCH /work-report/approve/{workReportId}. 목록·상세 조회는 `support/task-report-api` 메모리 mock 이
// 맡고, 승인 응답만 각 시나리오가 덮어쓴다(나중에 등록한 route 가 먼저 매칭된다). 실제 서버는 호출하지 않는다.

const reissuePath = /^https:\/\/[^/]+\/app\/auth\/reissue(?:\?.*)?$/
const taskDetailPath = /^https:\/\/[^/]+\/tasks\/12(?:\?.*)?$/

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-09-13T19:56:53.62201',
  description: '에러 설명',
})

let reportApi: WorkReportApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'work-report-approve-test-token')
  })
  reportApi = await mockWorkReportApi(page, { reports: startingReports() })
})

test('S1: 목록 케밥에서 행 id 로 한 번 승인하고 목록에 머문다', async ({
  page,
}) => {
  const requests: {
    path: string
    search: string
    body: string | null
    authorization?: string
  }[] = []
  await page.route(workReportApprovePattern, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    requests.push({
      path: url.pathname,
      search: url.search,
      body: request.postData(),
      authorization: request.headers().authorization,
    })
    await route.fallback()
  })

  await page.goto('/task-reports')
  await expect(rows(page)).toHaveCount(7)
  const listRequestsBefore = reportApi.requests.list

  await approveFromList(page)

  await expect(page.getByText('승인에 성공했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports$/)
  expect(requests).toHaveLength(1)
  expect(requests[0].path).toBe('/work-report/approve/32')
  expect(requests[0].search).toBe('')
  expect(requests[0].body).toBeNull()
  expect(requests[0].authorization).toMatch(/^Bearer /)
  await expect(
    page.getByRole('button', { name: '심사대기 6', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '완료 4', exact: true }),
  ).toBeVisible()
  await expect(rows(page).filter({ hasText: '이승현' })).toHaveCount(0)
  expect(reportApi.requests.list).toBeGreaterThan(listRequestsBefore)
})

test('S2: 상세에서 승인하면 목록으로 이동해 성공 토스트를 보인다', async ({
  page,
}) => {
  await page.goto('/task-reports/32')
  await page.getByRole('button', { name: '승인하기' }).click()

  await expect(page).toHaveURL(/\/task-reports$/)
  await expect(page.getByText('승인에 성공했습니다')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '심사대기 6', exact: true }),
  ).toBeVisible()
  expect(reportApi.requests.approve).toBe(1)
})

test('S3: 승인에 성공하면 업무관리 캐시를 무효화한다', async ({ page }) => {
  let taskDetailRequests = 0
  await page.route(taskDetailPath, async (route) => {
    taskDetailRequests += 1
    await json(route, 200, taskDetail)
  })

  await page.goto('/tasks/12')
  await expect(page.getByTestId('task-report-row')).toHaveCount(1)
  expect(taskDetailRequests).toBe(1)

  // 앱 안에서 이동해야 같은 QueryClient 캐시가 유지된다.
  await page
    .locator('section')
    .filter({ hasText: '업무 보고' })
    .getByRole('button')
    .click()
  await expect(page).toHaveURL(/\/task-reports\/32$/)
  await page.getByRole('button', { name: '승인하기' }).click()
  await expect(page).toHaveURL(/\/task-reports$/)

  await page.goBack()
  await page.goBack()

  await expect(page).toHaveURL(/\/tasks\/12$/)
  await expect.poll(() => taskDetailRequests).toBe(2)
})

test('S4: 목록 승인 중 HTTP 401 이면 재발급 없이 로그인 화면으로 이동한다', async ({
  page,
}) => {
  let reissueCount = 0
  await page.route(reissuePath, (route) => {
    reissueCount += 1
    return route.abort()
  })
  await mockApproveError(page, 401, '만료된 토큰입니다.')

  await page.goto('/task-reports')
  await expect(rows(page)).toHaveCount(7)
  const listRequestsBefore = reportApi.requests.list

  await approveFromList(page)

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('승인에 성공했습니다')).toHaveCount(0)
  expect(reissueCount).toBe(0)
  expect(reportApi.requests.list).toBe(listRequestsBefore)
})

test('S5: 상세 승인이 HTTP 404 이면 상세에 머물고 실패 토스트를 보인다', async ({
  page,
}) => {
  await mockApproveError(page, 404, '존재하지 않는 업무관리입니다.')

  await page.goto('/task-reports/32')
  await page.getByRole('button', { name: '승인하기' }).click()

  await expect(page.getByText('승인에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports\/32$/)
  await expect(page.getByRole('button', { name: '승인하기' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '반려하기' })).toBeEnabled()
})

test('S6: 이미 승인된 보고(409)는 실패 토스트만 보이고 서버 메시지는 표시하지 않는다', async ({
  page,
}) => {
  await mockApproveError(page, 409, '이미 승인된 업무관리입니다.')

  await page.goto('/task-reports/32')
  await page.getByRole('button', { name: '승인하기' }).click()

  await expect(page.getByText('승인에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports\/32$/)
  await expect(page.getByText('이미 승인된 업무관리입니다.')).toHaveCount(0)
})

test('S7: 서버 오류 뒤 다시 승인하면 요청을 다시 보낸다', async ({ page }) => {
  let approveCount = 0
  await page.route(workReportApprovePattern, async (route) => {
    approveCount += 1
    await json(route, 500, errorBody(500, '예상하지 못한 에러가 발생했습니다.'))
  })

  await page.goto('/task-reports')
  await approveFromList(page)
  await expect(page.getByText('승인에 실패했습니다')).toBeVisible()
  await expect(rows(page).filter({ hasText: '이승현' })).toHaveCount(1)

  await approveFromList(page)

  await expect.poll(() => approveCount).toBe(2)
})

test('S8: 처리 중에는 버튼을 막고 승인 요청을 한 번만 보낸다', async ({
  page,
}) => {
  let approveCount = 0
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(workReportApprovePattern, async (route) => {
    approveCount += 1
    await gate
    await json(route, 200, { message: '업무 보고가 승인되었습니다.' })
  })

  await page.goto('/task-reports/32')
  const approveButton = page.getByRole('button', { name: '승인하기' })
  await approveButton.click()

  await expect(approveButton).toBeDisabled()
  await expect(page.getByRole('button', { name: '반려하기' })).toBeDisabled()
  await approveButton.click({ force: true })

  release?.()
  await expect(page).toHaveURL(/\/task-reports$/)
  expect(approveCount).toBe(1)
})

test('S9: 목록 처리 중에는 다른 행 메뉴가 열리지 않는다', async ({ page }) => {
  let approveCount = 0
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(workReportApprovePattern, async (route) => {
    approveCount += 1
    await gate
    await route.fallback()
  })

  await page.goto('/task-reports')
  await approveFromList(page)

  await rows(page)
    .nth(1)
    .getByRole('button', { name: /메뉴 열기/ })
    .click({ force: true })
  await expect(page.getByRole('menuitem', { name: '승인하기' })).toHaveCount(0)

  release?.()
  await expect(page.getByText('승인에 성공했습니다')).toBeVisible()
  expect(approveCount).toBe(1)
})

test('S10: 200 이라도 message 가 없으면 성공으로 처리하지 않는다', async ({
  page,
}) => {
  await page.route(workReportApprovePattern, (route) =>
    json(route, 200, { result: 'ok' }),
  )

  await page.goto('/task-reports/32')
  await page.getByRole('button', { name: '승인하기' }).click()

  await expect(page.getByText('승인에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports\/32$/)
})

test('S11: 승인되지 않은 성공 status(204)는 성공으로 처리하지 않는다', async ({
  page,
}) => {
  await page.route(workReportApprovePattern, (route) =>
    route.fulfill({ status: 204 }),
  )

  await page.goto('/task-reports/32')
  await page.getByRole('button', { name: '승인하기' }).click()

  await expect(page.getByText('승인에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports\/32$/)
})

// 시작 건수: 심사대기 7 · 완료 3 · 반려 2. 심사대기 첫 행은 이승현(32)이다.
function startingReports(): MockWorkReport[] {
  const [template] = mockWorkReports
  const make = (
    id: number,
    name: string,
    status: MockWorkReport['status'],
    finishDate: string,
  ): MockWorkReport => ({
    ...template,
    id,
    name,
    status,
    finishDate,
    files: [],
  })

  return [
    make(32, '이승현', 'PENDING', '2026-07-03'),
    make(33, '김수인', 'PENDING', '2026-07-04'),
    make(34, '이지아', 'PENDING', '2026-07-05'),
    make(35, '김유영', 'PENDING', '2026-07-06'),
    make(36, '박도윤', 'PENDING', '2026-07-07'),
    make(37, '최유진', 'PENDING', '2026-07-08'),
    make(38, '홍길동', 'PENDING', '2026-07-09'),
    make(41, '강태오', 'APPROVED', '2026-08-01'),
    make(42, '윤소린', 'APPROVED', '2026-08-02'),
    make(43, '서준호', 'APPROVED', '2026-08-03'),
    make(51, '문가온', 'REJECTED', '2026-09-01'),
    make(52, '배수민', 'REJECTED', '2026-09-02'),
  ]
}

const taskDetail = {
  id: 12,
  title: '9월 정기 안전점검',
  content: '놀이기구 전수 점검 후 체크리스트를 제출해주세요.',
  assignees: [{ id: 3, name: '이승현', position: '사원' }],
  assigneeCount: 1,
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  finishDate: '2026-09-05',
  createdAt: '2026-08-28T10:15:30',
  files: [],
  reports: [
    { workReportId: 32, appAdminId: 3, name: '이승현', status: 'PENDING' },
  ],
  progress: { total: 1, approved: 0, rejected: 0, pending: 1, missing: 0 },
}

async function approveFromList(page: Page) {
  await rows(page)
    .filter({ hasText: '이승현' })
    .getByRole('button', { name: /메뉴 열기/ })
    .click()
  await page.getByRole('menuitem', { name: '승인하기' }).click()
}

async function mockApproveError(page: Page, status: number, message: string) {
  await page.route(workReportApprovePattern, (route) =>
    json(route, status, errorBody(status, message)),
  )
}

function rows(page: Page) {
  return page.getByTestId('task-report-row')
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
