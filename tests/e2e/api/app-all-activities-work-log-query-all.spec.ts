import { expect, test, type Page } from '@playwright/test'
import {
  activityMockDate,
  mockActivityApi,
  workLog,
} from '../support/activity-api'

// 대상: APP_ALL_ACTIVITIES_WORK_LOG_QUERY_ALL (GET /all-activities/work-log).
// 승인 시나리오: harness/api/approvals/app-all-activities-work-log-query-all.test-scenarios.md

const ENTRY = `/activity?tab=work-log&date=${activityMockDate}`
const ERROR_TEXT = '업무일지를 불러오지 못했어요. 다시 시도해 주세요.'
const EMPTY_TEXT = '이 날짜에 올라온 업무일지가 없어요'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-27T10:00:00'))
})

const rows = (page: Page) => page.getByTestId('activity-row')

function cells(page: Page, index: number) {
  return rows(page)
    .nth(index)
    .evaluate((row) =>
      [...row.children].map((cell) => cell.textContent?.trim() ?? ''),
    )
}

test('S1: date 만 Bearer 토큰으로 1회 요청하고 다른 전체 활동 API 는 부르지 않는다', async ({
  page,
}) => {
  const requests = await mockActivityApi(page)
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(5)

  expect(requests.workLog).toHaveLength(1)
  const { url, authorization } = requests.workLog[0]
  expect(url.pathname).toBe('/all-activities/work-log')
  expect([...url.searchParams.keys()]).toEqual(['date'])
  expect(url.searchParams.get('date')).toBe(activityMockDate)
  expect(authorization).toBe('Bearer test-access-token')
  expect(requests.floorFour).toHaveLength(0)
  expect(requests.floorFive).toHaveLength(0)
  expect(requests.observation).toHaveLength(0)
})

test('S2: 응답 필드를 열에 매핑한다', async ({ page }) => {
  await mockActivityApi(page, {
    workLog: {
      itemsByDate: {
        [activityMockDate]: [
          workLog({
            workLogId: 7,
            writeAt: `${activityMockDate}T12:40:00`,
            templateTitle: '사육장 청소일지',
            title: '파충류관 사육장 청소',
            authorName: '이서준',
            fileCount: 2,
          }),
          workLog({
            workLogId: 8,
            writeAt: `${activityMockDate}T13:00:00`,
            fileCount: 0,
          }),
        ],
      },
    },
  })
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(2)

  expect(await cells(page, 0)).toEqual([
    '12:40',
    '사육장 청소일지',
    '파충류관 사육장 청소',
    '이서준',
    '2개',
  ])
  expect((await cells(page, 1))[4]).toBe('-')
})

test('S3: 작성시간 오름차순으로 정렬하고 00:00 도 그대로 보여준다', async ({
  page,
}) => {
  await mockActivityApi(page, {
    workLog: {
      itemsByDate: {
        [activityMockDate]: ['15:00', '00:00', '08:30'].map((time, index) =>
          workLog({
            workLogId: index + 1,
            writeAt: `${activityMockDate}T${time}:00`,
          }),
        ),
      },
    },
  })
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(3)

  const times = await rows(page).evaluateAll((elements) =>
    elements.map((element) => element.children[0]?.textContent ?? ''),
  )
  expect(times).toEqual(['00:00', '08:30', '15:00'])
})

test('S4: 기록이 없는 날은 빈 상태를 보여준다', async ({ page }) => {
  const requests = await mockActivityApi(page)
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(5)

  await page.getByRole('button', { name: '다음 날짜' }).click()
  await expect(page.getByText(EMPTY_TEXT)).toBeVisible()
  expect(
    requests.workLog.filter(
      ({ url }) => url.searchParams.get('date') === '2026-10-21',
    ),
  ).toHaveLength(1)
})

for (const [label, mock] of [
  ['500', { status: 500 }],
  ['응답 형식 오류', { rawBody: {} }],
] as const) {
  test(`S5: ${label} 이면 빈 상태 대신 실패 문구를 보여준다`, async ({
    page,
  }) => {
    await mockActivityApi(page, { workLog: mock })
    await page.goto(ENTRY)

    await expect(page.getByRole('alert')).toHaveText(ERROR_TEXT)
    await expect(page.getByTestId('activity-table-header')).toBeVisible()
    await expect(rows(page)).toHaveCount(0)
    await expect(page.getByText(EMPTY_TEXT)).toHaveCount(0)
  })
}
