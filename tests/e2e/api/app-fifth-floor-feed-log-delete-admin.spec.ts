import { expect, test, type Page } from '@playwright/test'
import { mockAnimalManageApi } from '../support/animal-manage-api'
import { mockFeedApi } from '../support/feed-api'

// 대상: APP_FIFTH_FLOOR_FEED_LOG_DELETE_ADMIN (DELETE /feed-log/fifth-floor/admin/{feedLogId}).
// 승인 시나리오: harness/api/approvals/app-fifth-floor-feed-log-delete-admin.test-scenarios.md

const listRows = (page: Page) => page.getByTestId('feed-row')
const historyRows = (page: Page) => page.getByTestId('feed-history-row')

async function confirmDelete(page: Page) {
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()
}

test('S1: 목록에서 삭제하면 1회 요청하고 행이 사라진다', async ({ page }) => {
  const api = await mockFeedApi(page)
  await page.goto('/feeds?floor=5')
  await expect(listRows(page).filter({ hasText: '아로와나' })).toHaveCount(1)
  const listRequests = api.fifthFloor.requests.list

  await page
    .getByRole('button', { name: '아로와나 · 아로 급여 기록 메뉴' })
    .click()
  await confirmDelete(page)

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(listRows(page).filter({ hasText: '아로와나' })).toHaveCount(0)
  expect(api.fifthFloor.deletes).toEqual([
    { feedLogId: 1, authorization: 'Bearer test-access-token' },
  ])
  expect(api.fifthFloor.requests.list).toBeGreaterThan(listRequests)
  expect(api.deletes).toHaveLength(0)
})

test('S2: 기록 상세에서 삭제하면 그 개체의 5층 이력으로 간다', async ({
  page,
}) => {
  await mockAnimalManageApi(page)
  const api = await mockFeedApi(page)
  await page.goto('/feeds/fifth-floor/10')

  await page
    .getByRole('button', { name: '급여 기록 메뉴', exact: true })
    .click()
  await confirmDelete(page)

  await expect(page).toHaveURL(/\/feeds\/fifth-floor\/animals\/10$/)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(historyRows(page)).toHaveCount(1)
  expect(api.fifthFloor.deletes.map(({ feedLogId }) => feedLogId)).toEqual([10])
})

test('S3: 개체 이력에서 삭제하면 행과 건수가 준다', async ({ page }) => {
  await mockAnimalManageApi(page)
  const api = await mockFeedApi(page)
  await page.goto('/feeds/fifth-floor/animals/10')
  await expect(historyRows(page)).toHaveCount(2)

  await historyRows(page)
    .first()
    .getByRole('button', { name: /급여 기록 메뉴/ })
    .click()
  await confirmDelete(page)

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(historyRows(page)).toHaveCount(1)
  await expect(page.getByText('1건')).toBeVisible()
  expect(api.fifthFloor.deletes).toHaveLength(1)
})

for (const status of [404, 500]) {
  test(`S4: ${status} 이면 실패를 알리고 행을 둔다`, async ({ page }) => {
    const api = await mockFeedApi(page, { deleteStatus: status })
    await page.goto('/feeds?floor=5')

    await page
      .getByRole('button', { name: '아로와나 · 아로 급여 기록 메뉴' })
      .click()
    await confirmDelete(page)

    await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
    await expect(listRows(page).filter({ hasText: '아로와나' })).toHaveCount(1)
    expect(api.fifthFloor.deletes).toHaveLength(1)
  })
}

test('S5: 취소하면 요청하지 않는다', async ({ page }) => {
  const api = await mockFeedApi(page)
  await page.goto('/feeds?floor=5')

  await page
    .getByRole('button', { name: '아로와나 · 아로 급여 기록 메뉴' })
    .click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '취소' })
    .click()

  await expect(page.getByRole('alertdialog')).toBeHidden()
  expect(api.fifthFloor.deletes).toHaveLength(0)
})
