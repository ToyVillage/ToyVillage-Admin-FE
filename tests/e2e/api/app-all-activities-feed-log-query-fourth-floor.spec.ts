import { expect, test, type Page } from '@playwright/test'
import {
  activityMockDate,
  floorFourFeedLog,
  mockActivityApi,
} from '../support/activity-api'

// 대상: APP_ALL_ACTIVITIES_FEED_LOG_QUERY_FOURTH_FLOOR (GET /all-activities/feed-log/fourth-floor).
// 승인 시나리오: harness/api/approvals/app-all-activities-feed-log-query-fourth-floor.test-scenarios.md

const ENTRY = `/activity?tab=feed&date=${activityMockDate}&floor=4`
const ERROR_TEXT = '먹이 급여 기록을 불러오지 못했어요. 다시 시도해 주세요.'

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

test('S1: date 만 Bearer 토큰으로 1회 요청하고 다른 급여 API 는 부르지 않는다', async ({
  page,
}) => {
  const requests = await mockActivityApi(page)
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(22)

  expect(requests.floorFour).toHaveLength(1)
  const { url, authorization } = requests.floorFour[0]
  expect(url.pathname).toBe('/all-activities/feed-log/fourth-floor')
  expect([...url.searchParams.keys()]).toEqual(['date'])
  expect(url.searchParams.get('date')).toBe(activityMockDate)
  expect(authorization).toBe('Bearer test-access-token')
  expect(requests.floorFive).toHaveLength(0)
})

test('S2: 응답 필드를 열에 매핑하고 단위를 붙인다', async ({ page }) => {
  await mockActivityApi(page, {
    floorFour: {
      itemsByDate: {
        [activityMockDate]: [
          floorFourFeedLog({
            feedLogId: 1,
            animalKind: '물범',
            animalName: '바다',
            feedDateTime: `${activityMockDate}T16:22:00`,
            feedType: '고등어',
            feedAmount: 2.5,
            remainingAmount: 0.3,
            feedUnit: 'KGL',
            significant: '콧잔등 상처',
            staffName: '김유영',
          }),
          floorFourFeedLog({ feedLogId: 2 }),
        ],
      },
    },
  })
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(2)

  expect(await cells(page, 1)).toEqual([
    '물범',
    '바다',
    '16:22',
    '고등어',
    '2.5 kg/l',
    '0.3 kg/l',
    '콧잔등 상처',
    '김유영',
  ])
  expect(await cells(page, 0)).toEqual([
    '이구아나',
    '초록',
    '08:40',
    '청경채',
    '150 g/ml',
    '20 g/ml',
    '탈피 진행 중',
    '이승현',
  ])
})

test('S3: 특이사항이 없거나 null 이면, 잔량이 null 이면 - 를 보여준다', async ({
  page,
}) => {
  const withoutSignificant = floorFourFeedLog({
    feedLogId: 1,
    feedDateTime: `${activityMockDate}T08:00:00`,
  })
  delete (withoutSignificant as Record<string, unknown>).significant
  await mockActivityApi(page, {
    floorFour: {
      itemsByDate: {
        [activityMockDate]: [
          withoutSignificant,
          floorFourFeedLog({
            feedLogId: 2,
            feedDateTime: `${activityMockDate}T09:00:00`,
            significant: null,
          }),
          floorFourFeedLog({
            feedLogId: 3,
            feedDateTime: `${activityMockDate}T10:00:00`,
            remainingAmount: null,
          }),
        ],
      },
    },
  })
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(3)

  expect((await cells(page, 0))[6]).toBe('-')
  expect((await cells(page, 1))[6]).toBe('-')
  expect((await cells(page, 2))[5]).toBe('-')
  expect((await cells(page, 2))[6]).toBe('탈피 진행 중')
})

test('S4: 급여시간 오름차순으로 정렬한다', async ({ page }) => {
  await mockActivityApi(page, {
    floorFour: {
      itemsByDate: {
        [activityMockDate]: ['13:30', '07:05', '10:45'].map((time, index) =>
          floorFourFeedLog({
            feedLogId: index + 1,
            feedDateTime: `${activityMockDate}T${time}:00`,
          }),
        ),
      },
    },
  })
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(3)

  const times = await rows(page).evaluateAll((elements) =>
    elements.map((element) => element.children[2]?.textContent ?? ''),
  )
  expect(times).toEqual(['07:05', '10:45', '13:30'])
})

test('S5: 기록이 없는 날은 빈 상태를 보여준다', async ({ page }) => {
  const requests = await mockActivityApi(page)
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(22)

  await page.getByRole('button', { name: '다음 날짜' }).click()
  await expect(
    page.getByText('이 날짜에 올라온 먹이 급여 기록이 없어요'),
  ).toBeVisible()
  expect(
    requests.floorFour.filter(
      ({ url }) => url.searchParams.get('date') === '2026-10-21',
    ),
  ).toHaveLength(1)
})

for (const [label, mock] of [
  ['500', { status: 500 }],
  ['응답 형식 오류', { rawBody: {} }],
] as const) {
  test(`S6: ${label} 이면 빈 상태 대신 실패 문구를 보여준다`, async ({
    page,
  }) => {
    await mockActivityApi(page, { floorFour: mock })
    await page.goto(ENTRY)

    await expect(page.getByRole('alert')).toHaveText(ERROR_TEXT)
    await expect(page.getByTestId('activity-table-header')).toBeVisible()
    await expect(rows(page)).toHaveCount(0)
    await expect(
      page.getByText('이 날짜에 올라온 먹이 급여 기록이 없어요'),
    ).toHaveCount(0)
  })
}

test('S7: 삭제된 개체의 기록도 같은 모양으로 보여준다', async ({ page }) => {
  await mockActivityApi(page, {
    floorFour: {
      itemsByDate: {
        [activityMockDate]: [
          floorFourFeedLog({ feedLogId: 1, animalDeleted: true }),
        ],
      },
    },
  })
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(1)

  expect(await cells(page, 0)).toEqual([
    '이구아나',
    '초록',
    '08:40',
    '청경채',
    '150 g/ml',
    '20 g/ml',
    '탈피 진행 중',
    '이승현',
  ])
})
