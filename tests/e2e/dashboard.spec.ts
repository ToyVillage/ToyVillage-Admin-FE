import { expect, test, type Page } from '@playwright/test'
import {
  mockDashboardApi,
  type DashboardApiOptions,
} from './support/dashboard-api'

// 승인된 시나리오(dashboard.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 대시보드 조회는 page.route() 가짜 서버(`support/dashboard-api`)로 막는다(API 연동 #107).

const NOW = new Date('2026-09-03T12:30:00')

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
})

async function open(page: Page, options?: DashboardApiOptions) {
  await mockDashboardApi(page, options)
  await page.goto('/')
}

const section = (page: Page, title: string) =>
  page.getByRole('region', { name: title, exact: true })

const kpiCards = [
  { label: '먹이 급여 기록', value: '3', url: /\/feeds$/ },
  { label: '관찰 및 특이사항', value: '12', url: /\/species$/ },
  { label: '업무보고', value: '3', url: /\/task-reports$/ },
  { label: '작성된 일지', value: '9', url: /\/work-logs$/ },
]

const sections = [
  { title: '휴관일 관리', url: /\/notices\/guide$/ },
  { title: '전체 업무', url: /\/tasks$/ },
  { title: '먹이 급여 관리', url: /\/feeds$/ },
  { title: '관찰 및 특이사항', url: /\/species$/ },
  { title: '업무보고', url: /\/task-reports$/ },
  { title: '업무일지관리', url: /\/work-logs$/ },
]

test('S1: 대시보드 기본 렌더', async ({ page }) => {
  await open(page)

  await expect(
    page.getByRole('heading', { level: 1, name: '대시보드' }),
  ).toBeVisible()
  for (const { label, value } of kpiCards) {
    await expect(
      page.getByRole('link', { name: `${value} ${label}`, exact: true }),
    ).toBeVisible()
  }
  for (const { title } of sections) {
    await expect(section(page, title)).toBeVisible()
  }
})

test('S2: 이번주 chip', async ({ page }) => {
  await open(page)
  await expect(page.getByText('이번주 · 2026.08.30 ~ 09.05')).toBeVisible()
})

for (const { label, value, url } of kpiCards) {
  test(`S3: KPI 카드 이동 — ${label}`, async ({ page }) => {
    await open(page)
    await page
      .getByRole('link', { name: `${value} ${label}`, exact: true })
      .click()
    await expect(page).toHaveURL(url)
  })
}

for (const { title, url } of sections) {
  test(`S4: 섹션 카드 이동 — ${title}`, async ({ page }) => {
    await open(page)
    await page
      .getByRole('link', { name: `${title} 자세히 보기`, exact: true })
      .click()
    await expect(page).toHaveURL(url)
  })
}

test('S5: 키보드로 카드 이동', async ({ page }) => {
  await open(page)
  const card = page.getByRole('link', {
    name: '12 관찰 및 특이사항',
    exact: true,
  })
  await card.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/species$/)
})

test('S6: 전체 업무 집계', async ({ page }) => {
  await open(page)
  const card = section(page, '전체 업무')

  await expect(
    card.getByRole('img', {
      name: '전체 업무 30건: 완료 15, 진행중 9, 지연 6',
    }),
  ).toBeVisible()
  await expect(card.getByText('30', { exact: true })).toBeVisible()
  const rows = card.getByRole('listitem')
  await expect(rows.nth(0)).toHaveText('완료15')
  await expect(rows.nth(1)).toHaveText('진행중9')
  await expect(rows.nth(2)).toHaveText('지연6')
})

test('S7: 휴관일 표시', async ({ page }) => {
  await open(page)
  const card = section(page, '휴관일 관리')

  await expect(card.getByRole('table', { name: '2026년 09월' })).toBeVisible()
  for (const day of [9, 14, 15]) {
    await expect(
      card.getByLabel(`${day}일 휴관일`, { exact: true }),
    ).toBeVisible()
  }
  await expect(card.getByLabel('10일 휴관일', { exact: true })).toHaveCount(0)

  const rows = card.getByRole('listitem')
  await expect(rows).toHaveCount(3)
  await expect(rows.nth(0)).toContainText('9월 9일')
  await expect(rows.nth(0)).toContainText('김정욱 생일')
  await expect(rows.nth(1)).toContainText('9월 14일 ~ 9월 15일')
  await expect(rows.nth(1)).toContainText('토이빌리지 동물 정기검진')
  await expect(rows.nth(2)).toContainText('9월 14일')
  await expect(rows.nth(2)).toContainText('이승현 생일')
})

test('S8: 최근 목록 카드 내용', async ({ page }) => {
  await open(page)

  const feeds = section(page, '먹이 급여 관리').getByRole('listitem')
  await expect(feeds.nth(0)).toContainText('표범 · 레오')
  await expect(feeds.nth(0)).toContainText('2026.09.03 09:30')

  const observations = section(page, '관찰 및 특이사항').getByRole('listitem')
  await expect(observations.nth(0)).toContainText('3시간 전')
  await expect(observations.nth(1)).toContainText('2026.09.02')

  const reports = section(page, '업무보고').getByRole('listitem')
  await expect(reports.nth(0)).toContainText('업무 제목')
  await expect(reports.nth(0)).toContainText('심사대기')
  await expect(reports.nth(1)).toContainText('완료')
  await expect(reports.nth(2)).toContainText('반려')

  const workLogs = section(page, '업무일지관리').getByRole('listitem')
  await expect(workLogs.nth(0)).toContainText('마감일지')
  await expect(workLogs.nth(0)).toContainText('김수인')
})

test('S9: 로딩', async ({ page }) => {
  await open(page, { delayMs: { count: 3000 } })
  const skeleton = page.getByRole('status', { name: '불러오는 중' })
  await expect(skeleton).toBeVisible()
  await expect(skeleton).toHaveAttribute('aria-busy', 'true')
  await expect(page.getByText('대시보드를 불러오는 중입니다.')).toHaveCount(0)
})

test('S10: 조회 실패', async ({ page }) => {
  await open(page, { status: { count: 500 } })
  await expect(page.getByText('대시보드를 불러오지 못했습니다.')).toBeVisible()
})

test('S11: 빈 데이터', async ({ page }) => {
  await open(page, {
    data: {
      closeDays: [],
      overallOperations: { TOTAL: 0, IN_PROGRESS: 0, COMPLETED: 0, EXPIRED: 0 },
      feedLogs: [],
      animalObservations: [],
      workReports: [],
      workLogs: [],
    },
  })

  for (const text of [
    '이번 달 휴관일이 없습니다.',
    '최근 먹이 급여 기록이 없습니다.',
    '최근 관찰 기록이 없습니다.',
    '최근 업무보고가 없습니다.',
    '최근 업무일지가 없습니다.',
  ]) {
    await expect(page.getByText(text, { exact: true })).toBeVisible()
  }
  await expect(
    section(page, '전체 업무').getByText('0', { exact: true }).first(),
  ).toBeVisible()
  await expect(
    section(page, '전체 업무').getByRole('img', { name: /^전체 업무 0건/ }),
  ).toBeVisible()
})

test('S12: 긴 텍스트 말줄임', async ({ page }) => {
  const longTitle = '아주 긴 업무보고 제목 '.repeat(12).trim()
  await open(page, {
    data: {
      workReports: [
        {
          id: 1,
          taskId: 101,
          name: '김수인',
          title: longTitle,
          status: 'PENDING',
          priority: 'MEDIUM',
          finishDate: '2026-09-10',
        },
      ],
    },
  })

  const card = section(page, '업무보고')
  const row = card.getByRole('listitem').first()
  const title = row.getByText(longTitle, { exact: true })
  const badge = row.getByText('심사대기', { exact: true })

  await expect(badge).toBeVisible()
  const [titleBox, cardBox, badgeBox] = await Promise.all([
    title.boundingBox(),
    card.boundingBox(),
    badge.boundingBox(),
  ])
  expect(titleBox && cardBox && badgeBox).toBeTruthy()
  if (!titleBox || !cardBox || !badgeBox) return
  expect(titleBox.height).toBeLessThan(40)
  expect(badgeBox.x + badgeBox.width).toBeLessThanOrEqual(
    cardBox.x + cardBox.width,
  )
  const truncated = await title.evaluate(
    (element) => element.scrollWidth > element.clientWidth,
  )
  expect(truncated).toBe(true)
})
