import { expect, test, type Page } from '@playwright/test'
import {
  mockFeedApi,
  mockFifthFloorFeedLog,
  todayIsoDate,
  type FeedApiOptions,
} from '../support/feed-api'

// 대상: APP_FIFTH_FLOOR_FEED_LOG_UPDATE_ADMIN (PUT /feed-log/fifth-floor/admin/{feedLogId}).
// 승인 시나리오: harness/api/approvals/app-fifth-floor-feed-log-update-admin.test-scenarios.md

const ENTRY = '/feeds/fifth-floor/10/edit'

const field = (page: Page, label: string) =>
  page.getByLabel(label, { exact: true })
const saveButton = (page: Page) =>
  page.getByRole('button', { name: /저장하기|저장 중/ })

async function openEdit(page: Page, options: FeedApiOptions = {}) {
  const api = await mockFeedApi(page, options)
  await page.goto(ENTRY)
  await expect(field(page, '먹이 종류')).toHaveValue(
    options.fifthFloorFeedLogs?.[0]?.feedType ?? '펠렛',
  )
  return api
}

test('S1: 수정 저장', async ({ page }) => {
  const api = await openEdit(page)
  const detailRequests = api.fifthFloor.requests.adminDetail

  await field(page, '먹이 종류').fill('냉동새우')
  await field(page, '급여량').fill('20')
  await saveButton(page).click()

  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/10$/)
  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
  expect(api.fifthFloor.updates).toHaveLength(1)
  expect(api.fifthFloor.updates[0]).toMatchObject({
    feedLogId: 10,
    authorization: 'Bearer test-access-token',
    body: {
      feedDate: todayIsoDate(),
      feedType: '냉동새우',
      feedAmount: 20,
      feedUnit: 'GML',
    },
  })
  expect(Object.keys(api.fifthFloor.updates[0].body as object).sort()).toEqual([
    'feedAmount',
    'feedDate',
    'feedType',
    'feedUnit',
  ])
  // 저장 뒤 상세는 다시 조회한 새 값을 보여준다.
  await expect
    .poll(() => api.fifthFloor.requests.adminDetail)
    .toBeGreaterThan(detailRequests)
  await expect(page.getByText('냉동새우')).toBeVisible()
  await expect(page.getByText('20 g/ml')).toBeVisible()
  expect(api.updates).toHaveLength(0)
})

test('S2: 원본 단위·날짜를 그대로 보내고 먹이 종류 공백을 지운다', async ({
  page,
}) => {
  const api = await openEdit(page, {
    fifthFloorFeedLogs: [
      mockFifthFloorFeedLog({
        feedAmount: 1.2,
        feedUnit: 'KGL',
        feedDate: '2026-10-01',
      }),
    ],
  })

  await field(page, '먹이 종류').fill('  펠렛 ')
  await saveButton(page).click()

  await expect.poll(() => api.fifthFloor.updates.length).toBe(1)
  expect(api.fifthFloor.updates[0].body).toEqual({
    feedDate: '2026-10-01',
    feedType: '펠렛',
    feedAmount: 1.2,
    feedUnit: 'KGL',
  })
})

test('S3: 검증에 걸리면 요청하지 않는다', async ({ page }) => {
  const api = await openEdit(page)

  await field(page, '먹이 종류').fill('')
  await saveButton(page).click()

  await expect(page.getByText('먹이 종류를 입력해주세요!')).toBeVisible()
  expect(api.fifthFloor.updates).toHaveLength(0)
})

for (const [label, options] of [
  ['404', { updateStatus: 404 }],
  ['500', { updateStatus: 500 }],
  ['응답 형식 오류', { updateBody: {} }],
] as const) {
  test(`S4: ${label} 이면 폼에 머물고 실패를 알린다`, async ({ page }) => {
    const api = await openEdit(page, options)

    await field(page, '먹이 종류').fill('냉동새우')
    await saveButton(page).click()

    await expect(
      page.getByText('저장하지 못했습니다. 다시 시도해 주세요.'),
    ).toBeVisible()
    expect(api.fifthFloor.updates).toHaveLength(1)
    await expect(field(page, '먹이 종류')).toHaveValue('냉동새우')
    await expect(page).toHaveURL(/\/feeds\/fifth-floor\/10\/edit$/)
  })
}

test('S5: 응답 전에는 다시 제출하지 않는다', async ({ page }) => {
  const api = await openEdit(page, { updateDelayMs: 800 })

  await field(page, '먹이 종류').fill('냉동새우')
  await saveButton(page).click()
  await expect(page.getByRole('button', { name: '저장 중' })).toBeDisabled()
  await saveButton(page).click({ force: true })

  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
  expect(api.fifthFloor.updates).toHaveLength(1)
})
