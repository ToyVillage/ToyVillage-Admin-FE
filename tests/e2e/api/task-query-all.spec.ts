import { expect, test, type Page, type Route } from '@playwright/test'

// 승인된 시나리오(task-query-all.test-scenarios.md: S1~S12)를 mock 으로 변환한 것.
// 대상: GET /tasks. 서버 사이드 페이지네이션(page/size=10)과 상태 탭 필터를 검증한다.
// 조회는 목록 진입 시 발생하므로 goto 전에 route 를 건다. 실제 서버는 호출하지 않는다.

const taskListPath = /\/api\/tasks(?:\?.*)?$/
const taskDeletePath = /\/api\/tasks\/\d+(?:\?.*)?$/

const tasks = [
  {
    id: 12,
    title: '9월 정기 안전점검',
    assignees: [
      { id: 3, name: '이승현', position: '사원' },
      { id: 4, name: '김수인', position: '사원' },
      { id: 5, name: '이지아', position: '대리' },
      { id: 6, name: '박도윤', position: null },
    ],
    assigneeCount: 4,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    finishDate: '2026-09-05',
  },
  {
    id: 13,
    title: '사료 재고 정리',
    assignees: [{ id: 4, name: '김수인', position: '사원' }],
    assigneeCount: 1,
    status: 'COMPLETED',
    priority: 'LOW',
    finishDate: '2026-08-20',
  },
  {
    id: 14,
    title: '급수설비 점검',
    assignees: [
      { id: 5, name: '이지아', position: '대리' },
      { id: 6, name: '박도윤', position: null },
    ],
    assigneeCount: 2,
    status: 'EXPIRED',
    priority: 'MEDIUM',
    finishDate: '2026-07-01',
  },
]

const successBody = { tasks, totalPageSize: 2 }

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-09-09T19:56:53.62201',
  description: '에러 설명',
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'task-query-all-test-token')
  })
})

test('S1: 진입 시 page=0&size=10 으로 조회하고 행을 표시한다', async ({
  page,
}) => {
  let requestCount = 0
  let requestUrl = ''
  let headers: Record<string, string> = {}

  await page.route(taskListPath, async (route) => {
    requestCount += 1
    requestUrl = route.request().url()
    headers = route.request().headers()
    await fulfillJson(route, 200, successBody)
  })

  await page.goto('/tasks')

  await expect(rows(page)).toHaveCount(3)
  expect(requestCount).toBe(1)
  expect(headers.authorization).toMatch(/^Bearer /)

  const query = new URL(requestUrl).searchParams
  expect(query.get('page')).toBe('0')
  expect(query.get('size')).toBe('10')
  expect(query.has('status')).toBe(false)
  expect(query.has('sort')).toBe(false)

  await expect(rows(page).nth(0)).toContainText('이승현')
  await expect(rows(page).nth(0)).toContainText('외 3명')
  await expect(rows(page).nth(0)).toContainText('진행중')
  await expect(rows(page).nth(1)).toContainText('김수인')
  await expect(rows(page).nth(1)).not.toContainText('외')
  await expect(rows(page).nth(1)).toContainText('완료')
  await expect(rows(page).nth(2)).toContainText('이지아')
  await expect(rows(page).nth(2)).toContainText('외 1명')
  await expect(rows(page).nth(2)).toContainText('지연')
  await expect(page.getByRole('button', { name: '2 페이지' })).toBeVisible()
})

test('S2: 상태 탭을 status query 로 전달하고 1페이지로 되돌린다', async ({
  page,
}) => {
  const requestedQueries: URLSearchParams[] = []

  await page.route(taskListPath, async (route) => {
    requestedQueries.push(new URL(route.request().url()).searchParams)
    await fulfillJson(route, 200, successBody)
  })

  await page.goto('/tasks')
  await expect(rows(page)).toHaveCount(3)

  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect.poll(() => requestedQueries.length).toBe(2)

  for (const [tab, status] of [
    ['진행중', 'IN_PROGRESS'],
    ['완료', 'COMPLETED'],
    ['지연', 'EXPIRED'],
  ]) {
    const before = requestedQueries.length
    await page.getByRole('button', { name: tab, exact: true }).click()
    await expect.poll(() => requestedQueries.length).toBe(before + 1)

    const query = requestedQueries.at(-1)!
    expect(query.get('status')).toBe(status)
    expect(query.get('page')).toBe('0')
  }

  // `전체 업무` 1페이지는 첫 조회 결과가 캐시에 있어 재요청 없이 복원된다.
  await page.getByRole('button', { name: '전체 업무', exact: true }).click()
  await expect(rows(page)).toHaveCount(3)
  await expect(page.getByRole('button', { name: '1 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(requestedQueries.filter((query) => !query.has('status'))).toHaveLength(
    2,
  )
})

test('S3: 화면 2페이지는 서버 page=1 이다', async ({ page }) => {
  const requestedPages: (string | null)[] = []

  await page.route(taskListPath, async (route) => {
    const query = new URL(route.request().url()).searchParams
    requestedPages.push(query.get('page'))
    await fulfillJson(
      route,
      200,
      query.get('page') === '1'
        ? { tasks: [tasks[0]], totalPageSize: 2 }
        : successBody,
    )
  })

  await page.goto('/tasks')
  await expect(rows(page)).toHaveCount(3)

  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(rows(page)).toHaveCount(1)
  expect(requestedPages).toEqual(['0', '1'])
})

test('S4: 페이지 수는 totalPageSize 를 그대로 쓴다', async ({ page }) => {
  await mockList(page, 200, { tasks, totalPageSize: 3 })
  await page.goto('/tasks')

  await expect(page.getByRole('button', { name: '1 페이지' })).toBeVisible()
  await expect(page.getByRole('button', { name: '2 페이지' })).toBeVisible()
  await expect(page.getByRole('button', { name: '3 페이지' })).toBeVisible()
  await expect(page.getByRole('button', { name: '4 페이지' })).toHaveCount(0)
})

test('S5: 빈 목록은 오류가 아니라 빈 상태다', async ({ page }) => {
  await mockList(page, 200, { tasks: [], totalPageSize: 0 })
  await page.goto('/tasks')

  await expect(page.getByText('등록된 업무가 없습니다.')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  // 총 페이지가 1 이하면 페이지 버튼을 그리지 않는다(기존 표 동작).
  await expect(page.getByRole('button', { name: /페이지$/ })).toHaveCount(0)
})

test('S6: 응답 전에는 로딩 상태를 표시한다', async ({ page }) => {
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })

  await page.route(taskListPath, async (route) => {
    await gate
    await fulfillJson(route, 200, successBody)
  })

  await page.goto('/tasks')
  await expect(page.getByRole('status')).toContainText(
    '업무를 불러오는 중입니다.',
  )

  release?.()
  await expect(rows(page)).toHaveCount(3)
})

test('S7: HTTP 400 이면 오류 화면을 표시한다', async ({ page }) => {
  await mockList(page, 400, errorBody(400, '요청이 유효하지 않습니다.'))
  await page.goto('/tasks')

  await expectListError(page)
})

test('S8: HTTP 401 이면 오류 화면을 표시한다', async ({ page }) => {
  await mockList(page, 401, errorBody(401, '만료된 토큰입니다.'))
  await page.goto('/tasks')

  await expectListError(page)
})

test('S9: HTTP 500 이면 오류 화면을 표시한다', async ({ page }) => {
  await mockList(page, 500, errorBody(500, '예상하지 못한 에러가 발생했습니다.'))
  await page.goto('/tasks')

  await expectListError(page)
})

test('S10: Contract 밖 응답은 성공으로 처리하지 않는다', async ({ page }) => {
  await mockList(page, 200, { items: [], total: 1 })
  await page.goto('/tasks')

  await expectListError(page)
})

test('S11: 허용값 밖 status 는 성공으로 처리하지 않는다', async ({ page }) => {
  await mockList(page, 200, {
    tasks: [{ ...tasks[0], status: 'DONE' }],
    totalPageSize: 1,
  })
  await page.goto('/tasks')

  await expectListError(page)
})

test('S12: 삭제 성공 후 목록을 재조회한다', async ({ page }) => {
  let listRequestCount = 0
  let deleteRequestCount = 0

  await page.route(taskDeletePath, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()

    deleteRequestCount += 1
    await fulfillJson(route, 200, { message: '업무지시가 삭제되었습니다.' })
  })
  await page.route(taskListPath, async (route) => {
    listRequestCount += 1
    await fulfillJson(
      route,
      200,
      listRequestCount === 1
        ? successBody
        : { tasks: tasks.slice(1), totalPageSize: 1 },
    )
  })

  await page.goto('/tasks')
  await expect(rows(page)).toHaveCount(3)

  await page
    .getByRole('button', { name: '이승현 9월 정기 안전점검 업무 메뉴 열기' })
    .click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page.getByRole('status')).toContainText(
    '데이터 삭제에 성공했습니다',
  )
  await expect(rows(page)).toHaveCount(2)
  expect(deleteRequestCount).toBe(1)
  expect(listRequestCount).toBeGreaterThan(1)
})

// 2026-09-11 회귀: 서버가 assignees 배열로 바뀌었는데 검증이 assigneeName 을
// 요구해 200 응답에도 오류 화면이 떴다. 반대 방향(옛 스키마)을 고정한다.
test('S13: 옛 스키마(assigneeName) 응답은 성공으로 처리하지 않는다', async ({
  page,
}) => {
  await mockList(page, 200, {
    tasks: [
      {
        id: 12,
        title: '9월 정기 안전점검',
        assigneeName: '이승현',
        assigneeCount: 4,
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        finishDate: '2026-09-05',
      },
    ],
    totalPageSize: 1,
  })
  await page.goto('/tasks')

  await expectListError(page)
})

async function mockList(page: Page, status: number, body: unknown) {
  await page.route(taskListPath, async (route) => {
    await fulfillJson(route, status, body)
  })
}

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function expectListError(page: Page) {
  await expect(page.getByRole('alert')).toContainText(
    '업무를 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(rows(page)).toHaveCount(0)
}

function rows(page: Page) {
  return page.getByTestId('task-row')
}
