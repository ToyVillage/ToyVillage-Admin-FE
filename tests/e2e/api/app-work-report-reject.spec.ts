import { expect, test, type Page, type Route } from '@playwright/test'
import {
  mockWorkReportApi,
  mockWorkReports,
  workReportRejectPattern,
  type MockWorkReport,
  type WorkReportApiHandle,
} from '../support/task-report-api'

// 승인된 시나리오(app-work-report-reject.test-scenarios.md: S1~S14)를 mock 으로 변환한 것.
// 대상: PATCH /work-report/reject/{workReportId} body `{ rejectionReason }`. 목록·상세 조회는
// `support/task-report-api` 메모리 mock 이 맡고, 반려 응답만 각 시나리오가 덮어쓴다. 실제 서버는 호출하지 않는다.

const reissuePath = /^https:\/\/[^/]+\/app\/auth\/reissue(?:\?.*)?$/

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
    localStorage.setItem('accessToken', 'work-report-reject-test-token')
  })
  reportApi = await mockWorkReportApi(page, { reports: startingReports() })
})

test('S1: 목록 케밥에서 공백을 뺀 사유를 body 로 한 번 보내고 목록에 머문다', async ({
  page,
}) => {
  const requests: {
    path: string
    search: string
    body: string | null
    headers: Record<string, string>
  }[] = []
  await page.route(workReportRejectPattern, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    requests.push({
      path: url.pathname,
      search: url.search,
      body: request.postData(),
      headers: request.headers(),
    })
    await route.fallback()
  })

  await page.goto('/task-reports')
  await openListRejectDialog(page)
  await reasonField(page).fill('  근거 자료가 빠졌습니다.  ')
  await confirmButton(page).click()

  await expect(rejectDialog(page)).toBeHidden()
  await expect(page.getByText('반려에 성공했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports$/)

  expect(requests).toHaveLength(1)
  expect(requests[0].path).toBe('/work-report/reject/32')
  expect(requests[0].search).toBe('')
  expect(JSON.parse(requests[0].body ?? 'null')).toEqual({
    rejectionReason: '근거 자료가 빠졌습니다.',
  })
  expect(requests[0].headers.authorization).toMatch(/^Bearer /)
  expect(requests[0].headers['content-type']).toContain('application/json')

  await expect(
    page.getByRole('button', { name: '심사대기 6', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '반려 3', exact: true }),
  ).toBeVisible()
})

test('S2: 상세에서 반려하면 목록으로 이동해 성공 토스트를 보인다', async ({
  page,
}) => {
  await page.goto('/task-reports/32')
  await page.getByRole('button', { name: '반려하기' }).click()
  await reasonField(page).fill('안전 점검 항목 일부가 누락되었습니다.')
  await confirmButton(page).click()

  await expect(page).toHaveURL(/\/task-reports$/)
  await expect(page.getByText('반려에 성공했습니다')).toBeVisible()
  expect(reportApi.rejectBodies).toEqual([
    { rejectionReason: '안전 점검 항목 일부가 누락되었습니다.' },
  ])
})

test('S3: 공백뿐인 사유는 확인할 수 없고 요청하지 않는다', async ({ page }) => {
  await page.goto('/task-reports/32')
  await page.getByRole('button', { name: '반려하기' }).click()
  await reasonField(page).fill('   ')

  await expect(confirmButton(page)).toBeDisabled()
  expect(reportApi.requests.reject).toBe(0)
})

test('S4: 사유는 1000자까지만 입력되고 그대로 보낸다', async ({ page }) => {
  await page.goto('/task-reports/32')
  await page.getByRole('button', { name: '반려하기' }).click()
  await reasonField(page).fill('가'.repeat(1001))

  await expect
    .poll(() =>
      reasonField(page).evaluate(
        (node) => (node as HTMLTextAreaElement).value.length,
      ),
    )
    .toBe(1000)
  await confirmButton(page).click()

  await expect(page).toHaveURL(/\/task-reports$/)
  expect(reportApi.rejectBodies).toEqual([
    { rejectionReason: '가'.repeat(1000) },
  ])
})

test('S5: 모달을 이탈하면 반려 요청을 보내지 않는다', async ({ page }) => {
  await page.goto('/task-reports')
  await openListRejectDialog(page)
  await page.keyboard.press('Escape')
  await expect(rejectDialog(page)).toBeHidden()

  await page.goto('/task-reports/32')
  await page.getByRole('button', { name: '반려하기' }).click()
  await page.mouse.click(10, 10)
  await expect(rejectDialog(page)).toBeHidden()

  await expect(page).toHaveURL(/\/task-reports\/32$/)
  expect(reportApi.requests.reject).toBe(0)
})

test('S6: 사유 누락 400 이면 모달을 닫고 상세에 머물며 서버 메시지는 표시하지 않는다', async ({
  page,
}) => {
  await mockRejectError(page, 400, '반려 사유를 입력해주세요.')

  await page.goto('/task-reports/32')
  await rejectFromDetail(page)

  await expect(rejectDialog(page)).toBeHidden()
  await expect(page.getByText('반려에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports\/32$/)
  await expect(page.getByText('반려 사유를 입력해주세요.')).toHaveCount(0)
})

test('S7: 1000자 초과 400 이면 목록에서 실패 토스트를 보이고 행을 유지한다', async ({
  page,
}) => {
  await mockRejectError(page, 400, '반려 사유를 1000자 이하로 입력해주세요.')

  await page.goto('/task-reports')
  await openListRejectDialog(page)
  await reasonField(page).fill('점검 항목 누락')
  await confirmButton(page).click()

  await expect(rejectDialog(page)).toBeHidden()
  await expect(page.getByText('반려에 실패했습니다')).toBeVisible()
  await expect(rows(page).filter({ hasText: '이승현' })).toHaveCount(1)
})

test('S8: HTTP 401 이면 재발급 없이 로그인 화면으로 이동한다', async ({
  page,
}) => {
  let reissueCount = 0
  await page.route(reissuePath, (route) => {
    reissueCount += 1
    return route.abort()
  })
  await mockRejectError(page, 401, '만료된 토큰입니다.')

  await page.goto('/task-reports/32')
  await rejectFromDetail(page)

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('반려에 성공했습니다')).toHaveCount(0)
  expect(reissueCount).toBe(0)
})

for (const [scenario, status, message] of [
  ['S9', 404, '존재하지 않는 업무관리입니다.'],
  ['S10', 409, '이미 반려된 업무관리입니다.'],
] as const) {
  test(`${scenario}: HTTP ${status} 이면 실패 토스트를 보인다`, async ({
    page,
  }) => {
    await mockRejectError(page, status, message)

    await page.goto('/task-reports/32')
    await rejectFromDetail(page)

    await expect(page.getByText('반려에 실패했습니다')).toBeVisible()
    await expect(page).toHaveURL(/\/task-reports\/32$/)
  })
}

test('S11: 서버 오류 뒤 다시 반려하면 성공한다', async ({ page }) => {
  let rejectCount = 0
  await page.route(workReportRejectPattern, async (route) => {
    rejectCount += 1
    if (rejectCount === 1) {
      await json(
        route,
        500,
        errorBody(500, '예상하지 못한 에러가 발생했습니다.'),
      )
      return
    }
    await route.fallback()
  })

  await page.goto('/task-reports')
  await openListRejectDialog(page)
  await reasonField(page).fill('점검 항목 누락')
  await confirmButton(page).click()
  await expect(page.getByText('반려에 실패했습니다')).toBeVisible()

  await openListRejectDialog(page)
  await reasonField(page).fill('점검 항목 누락')
  await confirmButton(page).click()

  await expect(page.getByText('반려에 성공했습니다')).toBeVisible()
  expect(rejectCount).toBe(2)
})

test('S12: 처리 중에는 입력을 잠그고 초점을 모달에 두며 한 번만 보낸다', async ({
  page,
}) => {
  let rejectCount = 0
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(workReportRejectPattern, async (route) => {
    rejectCount += 1
    await gate
    await json(route, 200, { message: '업무 보고가 반려되었습니다.' })
  })

  await page.goto('/task-reports/32')
  await page.getByRole('button', { name: '반려하기' }).click()
  await reasonField(page).fill('사유 입력')
  await confirmButton(page).click()

  await expect(rejectDialog(page)).toHaveAttribute('aria-busy', 'true')
  await expect(reasonField(page)).toHaveAttribute('readonly', '')
  await expect(confirmButton(page)).toBeDisabled()
  await expect(reasonField(page)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(reasonField(page)).toBeFocused()
  await confirmButton(page).click({ force: true })

  release?.()
  await expect(page).toHaveURL(/\/task-reports$/)
  expect(rejectCount).toBe(1)
})

test('S13: 200 이라도 message 가 없으면 성공으로 처리하지 않는다', async ({
  page,
}) => {
  await page.route(workReportRejectPattern, (route) =>
    json(route, 200, { result: 'ok' }),
  )

  await page.goto('/task-reports/32')
  await rejectFromDetail(page)

  await expect(page.getByText('반려에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports\/32$/)
})

test('S14: 승인되지 않은 성공 status(201)는 성공으로 처리하지 않는다', async ({
  page,
}) => {
  await page.route(workReportRejectPattern, (route) =>
    json(route, 201, { message: '업무 보고가 반려되었습니다.' }),
  )

  await page.goto('/task-reports/32')
  await rejectFromDetail(page)

  await expect(page.getByText('반려에 실패했습니다')).toBeVisible()
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

async function openListRejectDialog(page: Page) {
  await rows(page)
    .filter({ hasText: '이승현' })
    .getByRole('button', { name: /메뉴 열기/ })
    .click()
  await page.getByRole('menuitem', { name: '반려하기' }).click()
  await expect(rejectDialog(page)).toBeVisible()
}

async function rejectFromDetail(page: Page) {
  await page.getByRole('button', { name: '반려하기' }).click()
  await reasonField(page).fill('점검 항목 누락')
  await confirmButton(page).click()
}

async function mockRejectError(page: Page, status: number, message: string) {
  await page.route(workReportRejectPattern, (route) =>
    json(route, status, errorBody(status, message)),
  )
}

function rejectDialog(page: Page) {
  return page.getByRole('dialog', { name: '반려 사유를 작성해주세요' })
}

function reasonField(page: Page) {
  return page.getByRole('textbox', { name: '반려 사유' })
}

function confirmButton(page: Page) {
  return rejectDialog(page).getByRole('button', { name: '확인' })
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
