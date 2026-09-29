import { expect, test, type Page, type Route } from '@playwright/test'

// 승인된 시나리오(app-work-report-query-all.test-scenarios.md: S1~S12)를 mock 으로 변환한 것.
// 대상: GET /work-report. 서버 페이지네이션(page 1부터, size=10)과 상태 탭 필터, 서버 건수를 검증한다.
// 조회는 목록 진입 시 발생하므로 goto 전에 route 를 건다. 실제 서버는 호출하지 않는다.

const listPath = /^https:\/\/[^/]+\/work-report(?:\?.*)?$/

type Status = 'PENDING' | 'APPROVED' | 'REJECTED'

const pendingReports = [
  item(32, '이승현', 'PENDING', 'HIGH', '2026-07-03'),
  item(35, '김수인', 'PENDING', 'LOW', '2026-07-01'),
  item(36, '이지아', 'PENDING', 'MEDIUM', '2026-07-28'),
]

const approvedReports = Array.from({ length: 12 }, (_, index) =>
  item(
    100 + index,
    `완료담당${index + 1}`,
    'APPROVED',
    'LOW',
    `2026-08-${String(index + 1).padStart(2, '0')}`,
  ),
)

const rejectedReports = [
  item(51, '박도윤', 'REJECTED', 'HIGH', '2026-09-01'),
  item(52, '최유진', 'REJECTED', 'MEDIUM', '2026-09-02'),
]

const counts = { pendingCount: 3, approvedCount: 12, rejectedCount: 2 }

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-09-13T19:56:53.62201',
  description: '에러 설명',
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'work-report-query-all-test-token')
  })
})

test('S1: 진입 시 page=1&size=10&status=PENDING 으로 한 번 조회하고 행을 표시한다', async ({
  page,
}) => {
  const requests: { url: string; headers: Record<string, string> }[] = []
  await page.route(listPath, async (route) => {
    requests.push({
      url: route.request().url(),
      headers: route.request().headers(),
    })
    await fulfillList(route)
  })

  await page.goto('/task-reports')

  await expect(rows(page)).toHaveCount(3)
  expect(requests).toHaveLength(1)
  expect(requests[0].headers.authorization).toMatch(/^Bearer /)

  const query = new URL(requests[0].url).searchParams
  expect([...query.keys()].sort()).toEqual(['page', 'size', 'status'])
  expect(query.get('page')).toBe('1')
  expect(query.get('size')).toBe('10')
  expect(query.get('status')).toBe('PENDING')

  await expect(rows(page).nth(0)).toContainText('이승현')
  await expect(rows(page).nth(0)).toContainText('심사대기')
  await expect(rows(page).nth(0)).toContainText('상')
  await expect(rows(page).nth(0)).toContainText('2026-07-03')
  await expect(rows(page).nth(1)).toContainText('김수인')
  await expect(rows(page).nth(2)).toContainText('이지아')
  await expect(page.getByText('9월 정기 안전점검')).toHaveCount(0)
})

test('S2: 탭 건수는 응답의 상태별 건수를 그대로 쓴다', async ({ page }) => {
  await page.route(listPath, fulfillList)

  await page.goto('/task-reports')

  for (const label of ['심사대기 3', '완료 12', '반려 2']) {
    await expect(
      page.getByRole('button', { name: label, exact: true }),
    ).toBeVisible()
  }
})

test('S3: 페이지 이동은 서버 page 를 보낸다', async ({ page }) => {
  const queries: URLSearchParams[] = []
  await page.route(listPath, async (route) => {
    queries.push(new URL(route.request().url()).searchParams)
    await fulfillList(route)
  })

  await page.goto('/task-reports')
  await page.getByRole('button', { name: '완료 12', exact: true }).click()
  await expect(rows(page)).toHaveCount(10)
  expect(queries.at(-1)?.get('status')).toBe('APPROVED')
  expect(queries.at(-1)?.get('page')).toBe('1')
  await expect(page.getByRole('button', { name: '1 페이지' })).toBeVisible()
  await expect(page.getByRole('button', { name: '2 페이지' })).toBeVisible()

  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(rows(page)).toHaveCount(2)
  const query = queries.at(-1)!
  expect(query.get('page')).toBe('2')
  expect(query.get('size')).toBe('10')
  expect(query.get('status')).toBe('APPROVED')
  await expect(page.getByRole('button', { name: '2 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('S4: 탭 전환은 status 필터로 재요청하고 1페이지로 돌아간다', async ({
  page,
}) => {
  const queries: URLSearchParams[] = []
  await page.route(listPath, async (route) => {
    queries.push(new URL(route.request().url()).searchParams)
    await fulfillList(route)
  })

  await page.goto('/task-reports')
  await page.getByRole('button', { name: '완료 12', exact: true }).click()
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page)).toHaveCount(2)

  await page.getByRole('button', { name: '반려 2', exact: true }).click()

  await expect(rows(page)).toHaveCount(2)
  await expect(rows(page).filter({ hasText: '반려' })).toHaveCount(2)
  const query = queries.at(-1)!
  expect(query.get('status')).toBe('REJECTED')
  expect(query.get('page')).toBe('1')
  await expect(page.getByRole('button', { name: '2 페이지' })).toHaveCount(0)
})

test('S5: 페이지 전환 중에는 직전 결과를 유지한다', async ({ page }) => {
  let releaseSecondPage: (() => void) | undefined
  const secondPageGate = new Promise<void>((resolve) => {
    releaseSecondPage = resolve
  })

  await page.route(listPath, async (route) => {
    const query = new URL(route.request().url()).searchParams
    if (query.get('status') === 'APPROVED' && query.get('page') === '2') {
      await secondPageGate
    }
    await fulfillList(route)
  })

  await page.goto('/task-reports')
  await page.getByRole('button', { name: '완료 12', exact: true }).click()
  await expect(rows(page)).toHaveCount(10)

  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(page.getByText('업무보고를 불러오는 중입니다.')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: '완료 12', exact: true }),
  ).toBeVisible()
  await expect(rows(page)).toHaveCount(10)

  releaseSecondPage?.()
  await expect(rows(page)).toHaveCount(2)
})

test('S6: 빈 목록이면 빈 상태와 0건 탭을 표시한다', async ({ page }) => {
  await page.route(listPath, (route) =>
    json(route, 200, {
      reports: [],
      totalPageSize: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
    }),
  )

  await page.goto('/task-reports')

  await expect(page.getByText('등록된 업무보고가 없습니다.')).toBeVisible()
  await expect(rows(page)).toHaveCount(0)
  for (const label of ['심사대기 0', '완료 0', '반려 0']) {
    await expect(
      page.getByRole('button', { name: label, exact: true }),
    ).toBeVisible()
  }
  await expect(page.getByRole('button', { name: '2 페이지' })).toHaveCount(0)
})

test('S7: 행을 누르면 응답 id 의 상세로 이동한다', async ({ page }) => {
  await page.route(listPath, fulfillList)
  // 이동한 화면의 상세 조회는 이 시나리오 범위가 아니라 요청만 끊는다(실제 서버 요청 없음).
  await page.route(
    /^https:\/\/[^/]+\/work-report\/detail\/32(?:\?.*)?$/,
    (route) => route.abort(),
  )

  await page.goto('/task-reports')
  await rows(page).filter({ hasText: '이승현' }).click()

  await expect(page).toHaveURL(/\/task-reports\/32$/)
})

test('S9: HTTP 401 이면 재발급 없이 로그인 화면으로 이동한다', async ({
  page,
}) => {
  let reissueCount = 0
  await page.route(
    /^https:\/\/[^/]+\/app\/auth\/reissue(?:\?.*)?$/,
    (route) => {
      reissueCount += 1
      return route.abort()
    },
  )
  await page.route(listPath, (route) =>
    json(route, 401, errorBody(401, '만료된 토큰입니다.')),
  )

  // refresh token 을 두지 않는다(beforeEach 는 accessToken 만 심는다).
  await page.goto('/task-reports')

  await expect(page).toHaveURL(/\/login$/)
  await expect(rows(page)).toHaveCount(0)
  expect(reissueCount).toBe(0)
})

for (const [scenario, status, message] of [
  ['S8', 400, '요청이 유효하지 않습니다.'],
  ['S10', 500, '예상하지 못한 에러가 발생했습니다.'],
] as const) {
  test(`${scenario}: HTTP ${status} 이면 오류 화면을 표시하고 목록으로 대체하지 않는다`, async ({
    page,
  }) => {
    await page.route(listPath, (route) =>
      json(route, status, errorBody(status, message)),
    )

    await page.goto('/task-reports')

    await expect(
      page.getByText('업무보고를 불러오지 못했습니다. 다시 시도해 주세요.'),
    ).toBeVisible()
    await expect(rows(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: /심사대기/ })).toHaveCount(0)
  })
}

test('S11: 응답 형식이 Contract 와 다르면 오류 화면을 표시한다', async ({
  page,
}) => {
  await page.route(listPath, (route) =>
    json(route, 200, {
      reports: [{ ...pendingReports[0], status: 'MISSING' }],
      totalPageSize: 1,
      ...counts,
    }),
  )

  await page.goto('/task-reports')
  await expect(
    page.getByText('업무보고를 불러오지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()

  await page.unrouteAll({ behavior: 'ignoreErrors' })
  await page.route(listPath, (route) =>
    json(route, 200, {
      reports: pendingReports,
      totalPageSize: 1,
      approvedCount: 12,
      rejectedCount: 2,
    }),
  )

  await page.reload()
  await expect(
    page.getByText('업무보고를 불러오지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
})

test('S12: 응답 전에는 로딩 상태를 표시한다', async ({ page }) => {
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })

  await page.route(listPath, async (route) => {
    await gate
    await fulfillList(route)
  })

  await page.goto('/task-reports')

  await expect(page.getByText('업무보고를 불러오는 중입니다.')).toBeVisible()
  release?.()
  await expect(rows(page)).toHaveCount(3)
})

function item(
  id: number,
  name: string,
  status: Status,
  priority: 'HIGH' | 'MEDIUM' | 'LOW',
  finishDate: string,
) {
  return {
    id,
    taskId: 12,
    name,
    title: '9월 정기 안전점검',
    status,
    priority,
    finishDate,
  }
}

// 요청 query 의 status·page 로 표 데이터를 고른다. 건수는 필터와 무관하게 같다.
async function fulfillList(route: Route) {
  const query = new URL(route.request().url()).searchParams
  const size = Number(query.get('size'))
  const pageNumber = Number(query.get('page'))
  const source = {
    PENDING: pendingReports,
    APPROVED: approvedReports,
    REJECTED: rejectedReports,
  }[query.get('status') as Status]

  await json(route, 200, {
    reports: source.slice((pageNumber - 1) * size, pageNumber * size),
    totalPageSize: Math.ceil(source.length / size),
    ...counts,
  })
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
