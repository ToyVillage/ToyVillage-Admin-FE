import { expect, test, type Page } from '@playwright/test'
import {
  activityMockDate,
  mockActivityApi,
  observation,
} from '../support/activity-api'

// 대상: APP_ALL_ACTIVITIES_ANIMAL_OBSERVATION_QUERY_ALL (GET /all-activities/animal-observation).
// 승인 시나리오: harness/api/approvals/app-all-activities-animal-observation-query-all.test-scenarios.md

const ENTRY = `/activity?tab=observation&date=${activityMockDate}`
const ERROR_TEXT = '관찰일지를 불러오지 못했어요. 다시 시도해 주세요.'
const EMPTY_TEXT = '이 날짜에 올라온 관찰일지가 없어요'

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

test('S1: date 만 Bearer 토큰으로 1회 요청하고 먹이 급여 API 는 부르지 않는다', async ({
  page,
}) => {
  const requests = await mockActivityApi(page)
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(5)

  expect(requests.observation).toHaveLength(1)
  const { url, authorization } = requests.observation[0]
  expect(url.pathname).toBe('/all-activities/animal-observation')
  expect([...url.searchParams.keys()]).toEqual(['date'])
  expect(url.searchParams.get('date')).toBe(activityMockDate)
  expect(authorization).toBe('Bearer test-access-token')
  expect(requests.floorFour).toHaveLength(0)
  expect(requests.floorFive).toHaveLength(0)
})

test('S2: 응답 필드를 열에 매핑한다', async ({ page }) => {
  await mockActivityApi(page, {
    observation: {
      itemsByDate: {
        [activityMockDate]: [
          observation({
            animalObservationId: 7,
            animalManageId: 3,
            animalKind: '라쿤',
            animalName: '보미',
            createdAt: `${activityMockDate}T11:20:00`,
            title: '왼쪽 앞발 절뚝임',
            authorName: '이서준',
            fileCount: 2,
          }),
          observation({
            animalObservationId: 8,
            createdAt: `${activityMockDate}T12:00:00`,
            fileCount: 0,
          }),
        ],
      },
    },
  })
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(2)

  expect(await cells(page, 0)).toEqual([
    '11:20',
    '라쿤',
    '보미',
    '왼쪽 앞발 절뚝임',
    '이서준',
    '2개',
  ])
  expect((await cells(page, 1))[5]).toBe('-')
})

test('S3: 작성시간 오름차순으로 정렬한다', async ({ page }) => {
  await mockActivityApi(page, {
    observation: {
      itemsByDate: {
        [activityMockDate]: ['13:30', '07:05', '10:45'].map((time, index) =>
          observation({
            animalObservationId: index + 1,
            createdAt: `${activityMockDate}T${time}:00`,
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
  expect(times).toEqual(['07:05', '10:45', '13:30'])
})

test('S4: 기록이 없는 날은 빈 상태를 보여준다', async ({ page }) => {
  const requests = await mockActivityApi(page)
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(5)

  await page.getByRole('button', { name: '다음 날짜' }).click()
  await expect(page.getByText(EMPTY_TEXT)).toBeVisible()
  expect(
    requests.observation.filter(
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
    await mockActivityApi(page, { observation: mock })
    await page.goto(ENTRY)

    await expect(page.getByRole('alert')).toHaveText(ERROR_TEXT)
    await expect(page.getByTestId('activity-table-header')).toBeVisible()
    await expect(rows(page)).toHaveCount(0)
    await expect(page.getByText(EMPTY_TEXT)).toHaveCount(0)
  })
}
