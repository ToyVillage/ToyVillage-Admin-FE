import { expect, test, type Page, type Route } from '@playwright/test'

// 승인된 시나리오(app-work-report-query-detail.test-scenarios.md: S1~S12)를 mock 으로 변환한 것.
// 대상: GET /work-report/detail/{workReportId}. 조회는 진입 시 발생하므로 goto 전에 route 를 건다.
// 실제 서버는 호출하지 않는다.

const detailPath = /^https:\/\/[^/]+\/work-report\/detail\/[^/?]+(?:\?.*)?$/
const reissuePath = /^https:\/\/[^/]+\/app\/auth\/reissue(?:\?.*)?$/
const taskDetailPath = /^https:\/\/[^/]+\/tasks\/12(?:\?.*)?$/

const detail = {
  id: 32,
  title: '9월 정기 안전점검',
  priority: 'HIGH',
  finishDate: '2026-09-05',
  taskId: 12,
  name: '이승현',
  content: '동물 우리 청소와 소독을 완료했습니다.',
  note: '사료 보관함 추가 점검이 필요합니다.',
  files: [
    { fileName: '당일 지침.pdf', fileKey: 'work-report/2026/09/guide.pdf' },
    { fileName: '휴관안내.png', fileKey: 'work-report/2026/09/notice.png' },
  ],
  status: 'PENDING',
  rejectionReason: null,
}

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-09-13T19:56:53.62201',
  description: '에러 설명',
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'work-report-query-detail-test-token')
  })
})

test('S1: route id 로 한 번 조회하고 서버 값을 상세 요소에 표시한다', async ({
  page,
}) => {
  const requests: {
    path: string
    search: string
    body: string | null
    authorization?: string
  }[] = []
  await page.route(detailPath, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    requests.push({
      path: url.pathname,
      search: url.search,
      body: request.postData(),
      authorization: request.headers().authorization,
    })
    await json(route, 200, detail)
  })

  await page.goto('/task-reports/32')

  await expect(page.getByText('담당자: 이승현')).toBeVisible()
  expect(requests).toHaveLength(1)
  expect(requests[0].path).toBe('/work-report/detail/32')
  expect(requests[0].search).toBe('')
  expect(requests[0].body).toBeNull()
  expect(requests[0].authorization).toMatch(/^Bearer /)

  await expect(metaValue(page, '우선순위:')).toContainText('상')
  await expect(metaValue(page, '상태:')).toContainText('심사대기')
  await expect(page.getByText('완료 기한: 2026-09-05')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: '9월 정기 안전점검', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('동물 우리 청소와 소독을 완료했습니다.'),
  ).toBeVisible()

  const attachments = page.getByRole('group', { name: '첨부자료' })
  await expect(attachments.getByText('당일 지침.pdf')).toBeVisible()
  await expect(attachments.getByText('휴관안내.png')).toBeVisible()

  await expect(
    page.getByText('사료 보관함 추가 점검이 필요합니다.'),
  ).toHaveCount(0)
  await expect(page.getByText('work-report/2026/09/guide.pdf')).toHaveCount(0)
})

test('S2: 첨부 파일이 없어도 상세를 표시한다', async ({ page }) => {
  await page.route(detailPath, (route) =>
    json(route, 200, { ...detail, files: [] }),
  )

  await page.goto('/task-reports/32')

  await expect(page.getByText('담당자: 이승현')).toBeVisible()
  const attachments = page.getByRole('group', { name: '첨부자료' })
  await expect(attachments).toBeVisible()
  await expect(attachments.getByText('첨부된 자료가 없습니다.')).toBeVisible()
  await expect(
    attachments.getByRole('button', { name: /다운로드/ }),
  ).toHaveCount(0)
})

test('S3: 반려된 보고는 반려 배지를 보이고 사유는 표시하지 않는다', async ({
  page,
}) => {
  await page.route(detailPath, (route) =>
    json(route, 200, {
      ...detail,
      status: 'REJECTED',
      rejectionReason: '근거 자료가 빠졌습니다.',
    }),
  )

  await page.goto('/task-reports/32')

  await expect(metaValue(page, '상태:')).toContainText('반려')
  await expect(page.getByText('근거 자료가 빠졌습니다.')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '반려하기' })).toBeVisible()
  await expect(page.getByRole('button', { name: '승인하기' })).toBeVisible()
})

test('S4: 승인된 보고는 완료 배지를 보인다', async ({ page }) => {
  await page.route(detailPath, (route) =>
    json(route, 200, { ...detail, status: 'APPROVED' }),
  )

  await page.goto('/task-reports/32')

  await expect(metaValue(page, '상태:')).toContainText('완료')
})

test('S5: HTTP 404 이면 찾을 수 없음 화면에 머문다', async ({ page }) => {
  const paths: string[] = []
  await page.route(detailPath, async (route) => {
    paths.push(new URL(route.request().url()).pathname)
    await json(route, 404, errorBody(404, '존재하지 않는 업무관리입니다.'))
  })

  await page.goto('/task-reports/999')

  await expectNotFound(page)
  expect(paths[0]).toBe('/work-report/detail/999')
  await expect(page).toHaveURL(/\/task-reports\/999$/)
})

test('S6: HTTP 401 이면 재발급 없이 로그인 화면으로 이동한다', async ({
  page,
}) => {
  let reissueCount = 0
  await page.route(reissuePath, (route) => {
    reissueCount += 1
    return route.abort()
  })
  await page.route(detailPath, (route) =>
    json(route, 401, errorBody(401, '만료된 토큰입니다.')),
  )

  await page.goto('/task-reports/32')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('담당자: 이승현')).toHaveCount(0)
  expect(reissueCount).toBe(0)
})

test('S7: HTTP 500 이면 찾을 수 없음 화면을 표시한다', async ({ page }) => {
  await page.route(detailPath, (route) =>
    json(route, 500, errorBody(500, '예상하지 못한 에러가 발생했습니다.')),
  )

  await page.goto('/task-reports/32')

  await expectNotFound(page)
})

test('S8: 응답 형식이 Contract 와 다르면 오류 화면을 표시한다', async ({
  page,
}) => {
  const withoutTitle = Object.fromEntries(
    Object.entries(detail).filter(([key]) => key !== 'title'),
  )
  await page.route(detailPath, (route) => json(route, 200, withoutTitle))

  await page.goto('/task-reports/32')
  await expectNotFound(page)

  await page.unrouteAll({ behavior: 'ignoreErrors' })
  await page.route(detailPath, (route) =>
    json(route, 200, { ...detail, status: 'MISSING' }),
  )

  await page.reload()
  await expectNotFound(page)
})

test('S9: 화면이 쓰지 않는 note 가 null 이어도 상세를 표시한다', async ({
  page,
}) => {
  await page.route(detailPath, (route) =>
    json(route, 200, { ...detail, note: null }),
  )

  await page.goto('/task-reports/32')

  await expect(page.getByText('담당자: 이승현')).toBeVisible()
})

test('S10: 정수가 아닌 route id 는 요청하지 않고 오류 화면을 표시한다', async ({
  page,
}) => {
  let requestCount = 0
  await page.route(detailPath, async (route) => {
    requestCount += 1
    await json(route, 200, detail)
  })

  await page.goto('/task-reports/r1')

  await expectNotFound(page)
  expect(requestCount).toBe(0)
})

test('S11: 응답 전에는 로딩 상태를 표시한다', async ({ page }) => {
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(detailPath, async (route) => {
    await gate
    await json(route, 200, detail)
  })

  await page.goto('/task-reports/32')

  await expect(page.getByText('업무보고를 불러오는 중입니다.')).toBeVisible()
  release?.()
  await expect(page.getByText('담당자: 이승현')).toBeVisible()
})

test('S12: 업무 상세의 제출된 보고 줄에서 업무보고 상세로 이동한다', async ({
  page,
}) => {
  await page.route(taskDetailPath, (route) =>
    json(route, 200, {
      id: 12,
      title: '9월 정기 안전점검',
      content: '놀이기구 전수 점검 후 체크리스트를 제출해주세요.',
      assignees: [
        { id: 3, name: '이승현', position: '사원' },
        { id: 4, name: '홍길동', position: '과장' },
        { id: 6, name: '배준영', position: null },
        { id: 7, name: '김유영', position: '사원' },
      ],
      assigneeCount: 4,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      finishDate: '2026-09-05',
      createdAt: '2026-08-28T10:15:30',
      files: [],
      reports: [
        { workReportId: 31, appAdminId: 3, name: '이승현', status: 'APPROVED' },
        { workReportId: 33, appAdminId: 4, name: '홍길동', status: 'REJECTED' },
        { workReportId: 34, appAdminId: 6, name: '배준영', status: 'PENDING' },
        {
          workReportId: null,
          appAdminId: 7,
          name: '김유영',
          status: 'MISSING',
        },
      ],
      progress: { total: 4, approved: 1, rejected: 1, pending: 1, missing: 1 },
    }),
  )
  const detailPaths: string[] = []
  await page.route(detailPath, async (route) => {
    detailPaths.push(new URL(route.request().url()).pathname)
    await json(route, 200, { ...detail, id: 31, status: 'APPROVED' })
  })

  await page.goto('/tasks/12')

  const reportButtons = page
    .locator('section')
    .filter({ hasText: '업무 보고' })
    .getByRole('button')
  await expect(page.getByTestId('task-report-row')).toHaveCount(4)
  await expect(reportButtons).toHaveCount(3)

  await reportButtons.first().click()

  await expect(page).toHaveURL(/\/task-reports\/31$/)
  await expect(metaValue(page, '상태:')).toContainText('완료')
  expect(detailPaths).toEqual(['/work-report/detail/31'])
})

// 요약행의 `우선순위:`·`상태:` 라벨과 배지는 같은 묶음 안의 형제 요소다.
function metaValue(page: Page, label: string) {
  return page.getByText(label, { exact: true }).locator('..')
}

async function expectNotFound(page: Page) {
  await expect(page.getByText('업무보고를 찾을 수 없습니다.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: '목록으로 돌아가기' }),
  ).toBeVisible()
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
