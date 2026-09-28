import { expect, test, type Page } from '@playwright/test'
import { mockFeedApi, type FeedApiOptions } from '../support/feed-api'

// 승인된 시나리오(app-feed-log-delete-admin.test-scenarios.md)를 변환한 것.
// 대상: DELETE /feed-log/admin/{feedLogId}. 실제 서버는 호출하지 않는다.

const rows = (page: Page) => page.getByTestId('feed-row')
const kebab = (page: Page, label: string) =>
  page.getByRole('button', { name: `${label} 급여 기록 메뉴` })
const confirmDialog = (page: Page) => page.getByRole('alertdialog')

async function openList(page: Page, options?: FeedApiOptions, path = '/feeds') {
  const api = await mockFeedApi(page, options)
  await page.goto(path)
  await expect(rows(page).first()).toBeVisible()
  return api
}

async function requestDelete(page: Page, label: string) {
  await kebab(page, label).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(confirmDialog(page)).toBeVisible()
}

test('S1: 삭제 성공', async ({ page }) => {
  const api = await openList(page)
  await expect(rows(page).first()).toContainText('표범')

  await requestDelete(page, '표범 · 레오')
  await confirmDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(confirmDialog(page)).toBeHidden()
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  expect(api.deletes).toHaveLength(1)
  expect(api.deletes[0].feedLogId).toBe(1)
  expect(api.deletes[0].authorization).toMatch(/^Bearer /)
  await expect(rows(page).filter({ hasText: '표범' })).toHaveCount(0)
})

test('S2: 취소하면 요청하지 않는다', async ({ page }) => {
  const api = await openList(page)

  await requestDelete(page, '표범 · 레오')
  await confirmDialog(page).getByRole('button', { name: '취소' }).click()

  await expect(confirmDialog(page)).toBeHidden()
  expect(api.deletes).toHaveLength(0)
  await expect(rows(page).first()).toContainText('표범')
})

for (const status of [404, 500]) {
  test(`S3: ${status} 이면 실패 토스트를 띄우고 행을 남긴다`, async ({
    page,
  }) => {
    await openList(page, { deleteStatus: status })

    await requestDelete(page, '표범 · 레오')
    await confirmDialog(page).getByRole('button', { name: '확인' }).click()

    await expect(confirmDialog(page)).toBeHidden()
    await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
    await expect(rows(page).first()).toContainText('표범')
    await expect(kebab(page, '표범 · 레오')).toBeFocused()
  })
}

test('S4: 중복 삭제 방지', async ({ page }) => {
  const api = await openList(page, { deleteDelayMs: 800 })

  await requestDelete(page, '표범 · 레오')
  const confirm = confirmDialog(page).getByRole('button', {
    name: /확인|삭제 중/,
  })
  await confirm.click()
  await expect(confirm).toHaveText('삭제 중')
  await expect(confirm).toBeDisabled()
  await confirm.click({ force: true })

  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  expect(api.deletes).toHaveLength(1)
})

test('S5: 마지막 페이지를 비우면 앞 페이지로 간다', async ({ page }) => {
  const api = await openList(page)
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page)).toHaveCount(2)

  for (const label of ['거북 · 바위', '올빼미 · 밤']) {
    await requestDelete(page, label)
    await confirmDialog(page).getByRole('button', { name: '확인' }).click()
    await expect(confirmDialog(page)).toBeHidden()
  }

  expect(api.deletes).toHaveLength(2)
  await expect(page).not.toHaveURL(/[?&]page=2/)
  await expect(rows(page)).toHaveCount(10)
})

test('S6: 삭제한 기록의 상세는 캐시를 쓰지 않는다', async ({ page }) => {
  const api = await openList(page)
  await rows(page).first().click()
  await expect(page).toHaveURL(/\/feeds\/1$/)
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(rows(page).first()).toContainText('표범')

  await requestDelete(page, '표범 · 레오')
  await confirmDialog(page).getByRole('button', { name: '확인' }).click()
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  const detailRequests = api.requests.adminDetail

  // 문서를 새로 불러오면 QueryClient 도 새로 생겨 캐시 제거를 검증할 수 없다.
  // 같은 SPA 안에서 라우터 이동(popstate)으로 상세에 들어간다.
  await page.evaluate(() => {
    window.history.pushState({}, '', '/feeds/1')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })

  await expect
    .poll(() => api.requests.adminDetail)
    .toBeGreaterThan(detailRequests)
  await expect(page).toHaveURL(/\/feeds$/)
})
