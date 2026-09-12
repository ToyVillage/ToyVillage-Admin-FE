import { expect, test, type Page, type Route } from '@playwright/test'

// 승인된 시나리오(task-query.test-scenarios.md: S1~S14)를 mock 으로 변환한 것.
// 대상: GET /tasks/{id}. 상세와 수정 화면이 같은 query key 로 공유한다.
// 조회는 진입 시 발생하므로 goto 전에 route 를 건다. 실제 서버는 호출하지 않는다.

const taskDetailPath = /^https:\/\/[^/]+\/tasks\/12(?:\?.*)?$/
const taskListPath = /^https:\/\/[^/]+\/tasks(?:\?.*)?$/
const teamTreePath = /^https:\/\/[^/]+\/team\/tree(?:\?.*)?$/

const detail = {
  id: 12,
  title: '9월 정기 안전점검',
  content: '놀이기구 전수 점검 후 체크리스트를 제출해주세요.',
  assignees: [
    { id: 3, name: '이승현', position: '사원' },
    { id: 4, name: '홍길동', position: '과장' },
    { id: 6, name: '배준영', position: null },
  ],
  assigneeCount: 3,
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  finishDate: '2026-09-05',
  createdAt: '2026-08-28T10:15:30',
  files: [
    { fileName: '당일 지침.pdf', fileKey: '2026/08/28/guide_a1b2c3.pdf' },
  ],
  reports: [],
  progress: { total: 3, approved: 0, rejected: 0, pending: 3, missing: 0 },
}

const teamTree = {
  totalMemberCount: 4,
  teams: [
    {
      id: 1,
      name: '동물 관리팀',
      memberCount: 3,
      members: [
        { id: 3, name: '이승현', position: '사원' },
        { id: 4, name: '홍길동', position: '과장' },
        { id: 5, name: '이지아', position: '대리' },
      ],
    },
  ],
  unassigned: {
    id: null,
    name: '미배정',
    memberCount: 1,
    members: [{ id: 6, name: '배준영', position: null }],
  },
}

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-09-09T19:56:53.62201',
  description: '에러 설명',
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'task-query-test-token')
  })
})

test('S1: 상세 진입 시 한 번 조회하고 응답을 표시한다', async ({ page }) => {
  let requestCount = 0
  let requestUrl = ''
  let headers: Record<string, string> = {}

  await page.route(taskDetailPath, async (route) => {
    requestCount += 1
    requestUrl = route.request().url()
    headers = route.request().headers()
    await fulfillJson(route, 200, detail)
  })

  await page.goto('/tasks/12')

  await expect(
    page.getByRole('heading', { name: '9월 정기 안전점검' }),
  ).toBeVisible()
  expect(requestCount).toBe(1)
  expect(headers.authorization).toMatch(/^Bearer /)
  expect(new URL(requestUrl).search).toBe('')

  const info = infoRow(page)
  await expect(info).toContainText('이승현')
  await expect(info).toContainText('외 2명')
  await expect(info).toContainText('진행중')
  await expect(info).toContainText('상')
  await expect(info).toContainText('2026-09-05')
  await expect(
    page.getByText('놀이기구 전수 점검 후 체크리스트를 제출해주세요.'),
  ).toBeVisible()
  await expect(page.getByText('당일 지침.pdf')).toBeVisible()
})

test('S2: 담당자가 1명이면 외 N명을 렌더하지 않는다', async ({ page }) => {
  await mockDetail(page, 200, {
    ...detail,
    assignees: [detail.assignees[0]],
    assigneeCount: 1,
  })
  await page.goto('/tasks/12')

  await expect(infoRow(page)).toContainText('이승현')
  await expect(infoRow(page)).not.toContainText('외')
})

test('S3: 첨부가 없으면 첨부자료를 렌더하지 않는다', async ({ page }) => {
  await mockDetail(page, 200, { ...detail, files: [] })
  await page.goto('/tasks/12')

  await expect(
    page.getByRole('heading', { name: '9월 정기 안전점검' }),
  ).toBeVisible()
  await expect(page.getByText('당일 지침.pdf')).toHaveCount(0)
})

test('S4: 완료·지연 상태를 그대로 표시한다', async ({ page }) => {
  await mockDetail(page, 200, { ...detail, status: 'COMPLETED' })
  await page.goto('/tasks/12')
  await expect(infoRow(page)).toContainText('완료')

  await page.unrouteAll()
  await mockDetail(page, 200, { ...detail, status: 'EXPIRED' })
  await page.reload()
  await expect(infoRow(page)).toContainText('지연')
})

test('S5: 응답 전에는 로딩 상태를 표시한다', async ({ page }) => {
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })

  await page.route(taskDetailPath, async (route) => {
    await gate
    await fulfillJson(route, 200, detail)
  })

  await page.goto('/tasks/12')
  await expect(page.getByRole('status')).toContainText(
    '업무를 불러오는 중입니다.',
  )

  release?.()
  await expect(
    page.getByRole('heading', { name: '9월 정기 안전점검' }),
  ).toBeVisible()
})

test('S6: HTTP 404 면 찾을 수 없음 화면을 표시한다', async ({ page }) => {
  await mockDetail(page, 404, errorBody(404, '존재하지 않는 업무 지시입니다.'))
  await page.goto('/tasks/12')

  await expectDetailError(page)
  await expect(page).toHaveURL(/\/tasks\/12$/)
})

test('S7: HTTP 403 도 같은 오류 화면이다', async ({ page }) => {
  await mockDetail(page, 403, { ...errorBody(403, ''), message: '' })
  await page.goto('/tasks/12')

  await expectDetailError(page)
})

test('S8: HTTP 401 도 같은 오류 화면이다', async ({ page }) => {
  await mockDetail(page, 401, errorBody(401, '만료된 토큰입니다.'))
  await page.goto('/tasks/12')

  await expectDetailError(page)
})

test('S9: HTTP 500 도 같은 오류 화면이다', async ({ page }) => {
  await mockDetail(page, 500, errorBody(500, '예상하지 못한 에러가 발생했습니다.'))
  await page.goto('/tasks/12')

  await expectDetailError(page)
})

test('S10: Contract 밖 응답은 성공으로 처리하지 않는다', async ({ page }) => {
  await mockDetail(page, 200, { id: 12, title: '제목' })
  await page.goto('/tasks/12')

  await expectDetailError(page)
})

test('S11: 허용값 밖 status 는 성공으로 처리하지 않는다', async ({ page }) => {
  await mockDetail(page, 200, { ...detail, status: 'DONE' })
  await page.goto('/tasks/12')

  await expectDetailError(page)
})

test('S12: 수정 화면 초기값을 상세 응답으로 채운다', async ({ page }) => {
  await mockDetail(page, 200, detail)
  await mockTree(page)

  await page.goto('/tasks/12/edit')

  await expect(page.getByLabel(/제목/)).toHaveValue('9월 정기 안전점검')
  await expect(page.getByLabel(/상세 업무 내용/)).toHaveValue(
    '놀이기구 전수 점검 후 체크리스트를 제출해주세요.',
  )
  await expect(page.getByRole('radio', { name: '상' })).toBeChecked()
  await expect(page.getByLabel('완료기한')).toHaveValue('2026-09-05')
  await expect(page.getByText('3/4명')).toBeVisible()

  await page.getByRole('button', { name: '동물 관리팀 펼치기' }).click()
  await expect(page.getByRole('checkbox', { name: '이승현 사원' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: '홍길동 과장' })).toBeChecked()
  await expect(
    page.getByRole('checkbox', { name: '이지아 대리' }),
  ).not.toBeChecked()

  await expect(
    page.getByRole('group', { name: '첨부파일' }).getByText('당일 지침.pdf'),
  ).toBeVisible()
})

test('S13: 상세에서 수정으로 가면 같은 캐시를 재사용한다', async ({ page }) => {
  let requestCount = 0

  await page.route(taskDetailPath, async (route) => {
    requestCount += 1
    await fulfillJson(route, 200, detail)
  })
  await mockTree(page)

  await page.goto('/tasks/12')
  await expect(
    page.getByRole('heading', { name: '9월 정기 안전점검' }),
  ).toBeVisible()

  await page.getByRole('button', { name: /업무 메뉴 열기$/ }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(/\/tasks\/12\/edit$/)
  await expect(page.getByLabel(/제목/)).toHaveValue('9월 정기 안전점검')
  expect(requestCount).toBe(1)
})

test('S14: 삭제 성공 후 상세 캐시를 비운다', async ({ page }) => {
  let detailRequestCount = 0

  await page.route(taskDetailPath, async (route) => {
    if (route.request().method() === 'DELETE') {
      await fulfillJson(route, 200, { message: '업무지시가 삭제되었습니다.' })
      return
    }

    detailRequestCount += 1
    await fulfillJson(route, 200, detail)
  })
  await page.route(taskListPath, async (route) => {
    await fulfillJson(route, 200, { tasks: [], totalPageSize: 0 })
  })

  await page.goto('/tasks/12')
  await expect(
    page.getByRole('heading', { name: '9월 정기 안전점검' }),
  ).toBeVisible()

  await page.getByRole('button', { name: /업무 메뉴 열기$/ }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page).toHaveURL(/\/tasks$/)
  expect(detailRequestCount).toBe(1)

  await page.goto('/tasks/12')
  await expect(
    page.getByRole('heading', { name: '9월 정기 안전점검' }),
  ).toBeVisible()
  expect(detailRequestCount).toBe(2)
})

// 2026-09-11 추가 범위: 업무보고·진행도 카드가 같은 응답의 reports·progress 를 쓴다.
const reports = [
  { workReportId: 31, appAdminId: 3, name: '이승현', status: 'APPROVED' },
  { workReportId: 33, appAdminId: 4, name: '홍길동', status: 'REJECTED' },
  { workReportId: 34, appAdminId: 6, name: '배준영', status: 'PENDING' },
  { workReportId: null, appAdminId: 7, name: '김유영', status: 'MISSING' },
]

test('S15: 담당자별 보고 현황을 표시하고 제출 전 줄은 누를 수 없다', async ({
  page,
}) => {
  await mockDetail(page, 200, {
    ...detail,
    reports,
    progress: { total: 4, approved: 1, rejected: 1, pending: 1, missing: 1 },
  })
  await page.goto('/tasks/12')

  const rows = page.getByTestId('task-report-row')
  await expect(rows).toHaveCount(4)
  await expect(rows.nth(0)).toContainText('이승현')
  await expect(rows.nth(0)).toContainText('승인')
  await expect(rows.nth(1)).toContainText('반려')
  await expect(rows.nth(2)).toContainText('심사대기')
  // 서버 `MISSING`(미제출)도 화면에서는 `심사대기` 다.
  await expect(rows.nth(3)).toContainText('김유영')
  await expect(rows.nth(3)).toContainText('심사대기')
  await expect(rows.nth(3)).not.toContainText('미제출')

  // 열 보고가 없는 줄(workReportId: null)은 버튼이 아니다.
  await expect(reportButtons(page)).toHaveCount(3)

  await reportButtons(page).first().click()
  await expect(page).toHaveURL(/\/task-reports\/31$/)
})

test('S16: 진행도는 서버 집계를 쓰고 미제출을 심사대기에 합산한다', async ({
  page,
}) => {
  // reports 로 다시 세면 이 값과 어긋난다.
  await mockDetail(page, 200, {
    ...detail,
    reports,
    progress: { total: 9, approved: 5, rejected: 2, pending: 1, missing: 1 },
  })
  await page.goto('/tasks/12')

  // 심사대기 2 = pending 1 + missing 1. 나머지는 응답 값 그대로다.
  await expect(
    page.getByText('전체 9 · 승인 5 · 반려 2 · 심사대기 2'),
  ).toBeVisible()
})

test('S17: 허용값 밖 보고 상태는 성공으로 처리하지 않는다', async ({ page }) => {
  await mockDetail(page, 200, {
    ...detail,
    reports: [{ ...reports[0], status: 'RESUBMITTED' }],
    progress: { total: 1, approved: 0, rejected: 0, pending: 1, missing: 0 },
  })
  await page.goto('/tasks/12')

  await expect(page.getByText('업무를 찾을 수 없습니다.')).toBeVisible()
})

function reportButtons(page: Page) {
  return page
    .locator('section')
    .filter({ hasText: '업무 보고' })
    .getByRole('button')
}

async function mockDetail(page: Page, status: number, body: unknown) {
  await page.route(taskDetailPath, async (route) => {
    await fulfillJson(route, status, body)
  })
}

async function mockTree(page: Page) {
  await page.route(teamTreePath, async (route) => {
    await fulfillJson(route, 200, teamTree)
  })
}

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function expectDetailError(page: Page) {
  await expect(page.getByRole('alert')).toContainText('업무를 찾을 수 없습니다.')
  await expect(page.getByRole('link', { name: '목록으로 돌아가기' })).toBeVisible()
}

function infoRow(page: Page) {
  return page.locator('dl').first()
}
