import { expect, test, type Page } from '@playwright/test'
import { mockDashboardApi } from '../support/dashboard-api'

// 대상: DASHBOARD_COUNT_QUERY (GET /dashboard/count)와 대시보드 공통 화면 연결.
// 승인 시나리오: harness/api/approvals/dashboard-count-query.test-scenarios.md

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-03T12:30:00'))
})

const kpi = (page: Page, value: number, label: string) =>
  page.getByRole('link', { name: `${value} ${label}`, exact: true })

const section = (page: Page, title: string) =>
  page.getByRole('region', { name: title, exact: true })

test('S1: 진입 시 GET /dashboard/count 를 Bearer 토큰으로 1회 호출한다', async ({
  page,
}) => {
  const requests = await mockDashboardApi(page)
  await page.goto('/')
  await expect(kpi(page, 3, '먹이 급여 기록')).toBeVisible()

  expect(requests.count).toHaveLength(1)
  expect(requests.count[0].url.search).toBe('')
  expect(requests.count[0].authorization).toBe('Bearer test-access-token')
})

test('S2: 200 응답 건수를 KPI 카드에 표시한다', async ({ page }) => {
  await mockDashboardApi(page, {
    data: {
      count: {
        feedLogCount: 24,
        animalCount: 3,
        workReportCount: 12,
        workLogCount: 8,
      },
    },
  })
  await page.goto('/')

  await expect(kpi(page, 24, '먹이 급여 기록')).toBeVisible()
  await expect(kpi(page, 3, '개체 관리')).toBeVisible()
  await expect(kpi(page, 12, '업무보고')).toBeVisible()
  await expect(kpi(page, 8, '작성된 일지')).toBeVisible()
})

test('S3: 0건도 0으로 표시한다', async ({ page }) => {
  await mockDashboardApi(page, {
    data: {
      count: {
        feedLogCount: 0,
        animalCount: 0,
        workReportCount: 0,
        workLogCount: 0,
      },
    },
  })
  await page.goto('/')

  for (const label of [
    '먹이 급여 기록',
    '개체 관리',
    '업무보고',
    '작성된 일지',
  ]) {
    await expect(kpi(page, 0, label)).toBeVisible()
  }
})

test('S4: 500 → 대시보드 오류 상태', async ({ page }) => {
  await mockDashboardApi(page, { status: { count: 500 } })
  await page.goto('/')

  await expect(page.getByText('대시보드를 불러오지 못했습니다.')).toBeVisible()
  await expect(kpi(page, 3, '먹이 급여 기록')).toHaveCount(0)
})

for (const [name, body] of [
  [
    '문자열 숫자',
    { feedLogCount: '3', animalCount: 12, workReportCount: 3, workLogCount: 9 },
  ],
  ['필드 누락', { feedLogCount: 3, animalCount: 12, workReportCount: 3 }],
] as const) {
  test(`S5: 응답 형식 오류(${name}) → 오류 상태`, async ({ page }) => {
    await mockDashboardApi(page, { rawBody: { count: body } })
    await page.goto('/')

    await expect(
      page.getByText('대시보드를 불러오지 못했습니다.'),
    ).toBeVisible()
  })
}

test('S6: 응답 대기 중 로딩 문구', async ({ page }) => {
  await mockDashboardApi(page, { delayMs: { count: 2000 } })
  await page.goto('/')

  await expect(page.getByText('대시보드를 불러오는 중입니다.')).toBeVisible()
  await expect(kpi(page, 3, '먹이 급여 기록')).toBeVisible()
})

test('S7: 재사용 API 3개를 대시보드 조건으로 호출한다', async ({ page }) => {
  const requests = await mockDashboardApi(page)
  await page.goto('/')
  await expect(kpi(page, 3, '먹이 급여 기록')).toBeVisible()

  expect(requests.closeDays).toHaveLength(1)

  expect(requests.workReports).toHaveLength(1)
  const reportQuery = requests.workReports[0].url.searchParams
  expect(reportQuery.get('page')).toBe('1')
  expect(reportQuery.get('size')).toBe('3')
  expect(reportQuery.has('status')).toBe(false)

  expect(requests.workLogs).toHaveLength(1)
  const workLogQuery = requests.workLogs[0].url.searchParams
  expect(workLogQuery.get('date')).toBe('2026-09-03')
  expect(workLogQuery.get('page')).toBe('0')
  expect(workLogQuery.get('size')).toBe('3')
})

test('S8: 재사용 API 응답을 카드에 표시한다', async ({ page }) => {
  await mockDashboardApi(page, {
    data: {
      workReports: [
        {
          id: 7,
          taskId: 70,
          name: '이승현',
          title: '9월 정기 안전점검',
          status: 'APPROVED',
          priority: 'HIGH',
          finishDate: '2026-09-05',
        },
      ],
      workLogs: [
        {
          workLogId: 9,
          writer: '박도윤',
          writeAt: '2026-09-03',
          templateTitle: '사육장점검일지',
        },
      ],
      closeDays: [
        {
          id: 1,
          title: '추석 휴관',
          startCloseTime: '2026-09-24',
          endCloseTime: '2026-09-26',
        },
        {
          id: 2,
          title: '지난달 휴관',
          startCloseTime: '2026-08-10',
          endCloseTime: '2026-08-10',
        },
      ],
    },
  })
  await page.goto('/')

  const report = section(page, '업무보고').getByRole('listitem')
  await expect(report).toHaveCount(1)
  await expect(report.first()).toContainText('9월 정기 안전점검')
  await expect(report.first()).toContainText('완료')

  const workLog = section(page, '업무일지관리').getByRole('listitem')
  await expect(workLog).toHaveCount(1)
  await expect(workLog.first()).toContainText('사육장점검일지')
  await expect(workLog.first()).toContainText('박도윤')

  const holidays = section(page, '휴관일 관리').getByRole('listitem')
  await expect(holidays).toHaveCount(1)
  await expect(holidays.first()).toContainText('9월 24일 ~ 9월 26일')
  await expect(holidays.first()).toContainText('추석 휴관')
})

for (const endpoint of ['closeDays', 'workReports', 'workLogs'] as const) {
  test(`S9: 재사용 API(${endpoint}) 500 → 대시보드 오류 상태`, async ({
    page,
  }) => {
    await mockDashboardApi(page, { status: { [endpoint]: 500 } })
    await page.goto('/')

    await expect(
      page.getByText('대시보드를 불러오지 못했습니다.'),
    ).toBeVisible()
  })
}

const detailData = {
  closeDays: [
    {
      id: 1,
      title: '추석 휴관',
      startCloseTime: '2026-09-24',
      endCloseTime: '2026-09-26',
    },
  ],
  workReports: [
    {
      id: 7,
      taskId: 70,
      name: '이승현',
      title: '9월 정기 안전점검',
      status: 'APPROVED' as const,
      priority: 'HIGH' as const,
      finishDate: '2026-09-05',
    },
  ],
  workLogs: [
    {
      workLogId: 9,
      writer: '박도윤',
      writeAt: '2026-09-03',
      templateTitle: '사육장점검일지',
    },
  ],
}

for (const { title, text, url } of [
  { title: '휴관일 관리', text: '추석 휴관', url: /\/notices\/guide\/1$/ },
  {
    title: '업무보고',
    text: '9월 정기 안전점검',
    url: /\/task-reports\/7$/,
  },
  { title: '업무일지관리', text: '사육장점검일지', url: /\/work-logs\/9$/ },
]) {
  test(`S10: ${title} 행을 누르면 상세로 이동한다`, async ({ page }) => {
    await mockDashboardApi(page, { data: detailData })
    await page.goto('/')

    await section(page, title).getByText(text, { exact: true }).click()
    await expect(page).toHaveURL(url)
  })
}

test('S11: 먹이 급여·개체관리 행은 링크다', async ({ page }) => {
  await mockDashboardApi(page)
  await page.goto('/')

  await expect(
    section(page, '먹이 급여 관리').getByRole('link', { name: /레오/ }),
  ).toHaveAttribute('href', '/feeds/1')
  await expect(
    section(page, '개체관리').getByRole('link', { name: /콧잔등/ }),
  ).toHaveAttribute('href', '/individuals/5/observations/1')
})
