import { expect, test, type Page } from '@playwright/test'
import {
  activityMockDate,
  floorFiveFeedLog,
  mockActivityApi,
} from '../support/activity-api'

// 대상: APP_ALL_ACTIVITIES_FEED_LOG_QUERY_FIFTH_FLOOR (GET /all-activities/feed-log/fifth-floor).
// 승인 시나리오: harness/api/approvals/app-all-activities-feed-log-query-fifth-floor.test-scenarios.md

const ENTRY = `/activity?tab=feed&date=${activityMockDate}&floor=5`
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
  await expect(rows(page)).toHaveCount(24)

  expect(requests.floorFive).toHaveLength(1)
  const { url, authorization } = requests.floorFive[0]
  expect(url.pathname).toBe('/all-activities/feed-log/fifth-floor')
  expect([...url.searchParams.keys()]).toEqual(['date'])
  expect(url.searchParams.get('date')).toBe(activityMockDate)
  expect(authorization).toBe('Bearer test-access-token')
  expect(requests.floorFour).toHaveLength(0)
})

test('S2: 응답 필드를 열에 매핑하고 단위를 붙인다', async ({ page }) => {
  await mockActivityApi(page, {
    floorFive: {
      itemsByDate: {
        [activityMockDate]: [
          floorFiveFeedLog({ feedLogId: 1 }),
          floorFiveFeedLog({
            feedLogId: 2,
            animalKind: '아로와나',
            animalName: '아로',
            feedType: '냉동새우',
            feedAmount: 1.5,
            feedUnit: 'KGL',
            staffName: '박도현',
          }),
        ],
      },
    },
  })
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(2)

  expect(await cells(page, 0)).toEqual([
    '아로와나',
    '아로',
    '냉동새우',
    '30 g/ml',
    '박도현',
  ])
  expect(await cells(page, 1)).toEqual([
    '아로와나',
    '아로',
    '냉동새우',
    '1.5 kg/l',
    '박도현',
  ])
})

test('S3: 행 순서는 응답 순서를 따른다', async ({ page }) => {
  await mockActivityApi(page)
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(24)

  await expect(rows(page).first()).toContainText('아로와나')
  await expect(rows(page).last()).toContainText('징기스칸')
})

test('S4: 기록이 없는 날은 빈 상태를 보여준다', async ({ page }) => {
  await mockActivityApi(page)
  await page.goto(ENTRY)
  await expect(rows(page)).toHaveCount(24)

  await page.getByRole('button', { name: '다음 날짜' }).click()
  await expect(
    page.getByText('이 날짜에 올라온 먹이 급여 기록이 없어요'),
  ).toBeVisible()
})

test('S5: 500 이나 응답 형식 오류면 실패 문구를 보여준다', async ({ page }) => {
  await mockActivityApi(page, { floorFive: { status: 500 } })
  await page.goto(ENTRY)
  await expect(page.getByRole('alert')).toHaveText(ERROR_TEXT)
  await expect(rows(page)).toHaveCount(0)
  await expect(
    page.getByText('이 날짜에 올라온 먹이 급여 기록이 없어요'),
  ).toHaveCount(0)

  await page.unrouteAll({ behavior: 'ignoreErrors' })
  await mockActivityApi(page, { floorFive: { rawBody: {} } })
  await page.reload()
  await expect(page.getByRole('alert')).toHaveText(ERROR_TEXT)
  await expect(rows(page)).toHaveCount(0)
})
