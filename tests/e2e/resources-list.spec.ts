import { test, expect } from '@playwright/test'
import { mockDocumentApi } from './support/document-api'

// 승인된 시나리오(resources-list.approved.json: S1~S9)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 자료실 API 는 page.route mock(`support/document-api`)을 쓴다. 실제 서버는 호출하지 않는다.

test.beforeEach(async ({ page }) => {
  await mockDocumentApi(page)
})

test('S1: "자료 추가하기" 클릭 → /notices/resources/create 이동', async ({ page }) => {
  await page.goto('/notices/resources')
  await page.getByRole('link', { name: '자료 추가하기' }).click()
  await expect(page).toHaveURL(/\/notices\/resources\/create$/)
})

test('S2: 파일 유형 탭(pdf) 클릭 → 활성화', async ({ page }) => {
  await page.goto('/notices/resources')
  const tab = page.getByRole('button', { name: 'pdf', exact: true })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-pressed', 'true')
})

test('S3: 자료 행 클릭 → /notices/resources/:id 이동', async ({ page }) => {
  await page.goto('/notices/resources')
  await page.getByTestId('resource-row').first().click()
  await expect(page).toHaveURL(/\/notices\/resources\/[^/]+$/)
})

test('S4: 제목 검색 → 목록 필터', async ({ page }) => {
  await page.goto('/notices/resources')
  await page.getByRole('searchbox', { name: '자료 검색' }).fill('시설')
  await expect(page.getByTestId('resource-row')).toHaveCount(1)
  await expect(page.getByTestId('resource-row').first()).toContainText('시설 안내도')
})

test('S5: 검색 결과 없음 → 빈 상태', async ({ page }) => {
  await page.goto('/notices/resources')
  await page.getByRole('searchbox', { name: '자료 검색' }).fill('존재하지않는자료명')
  await expect(page.getByTestId('resource-row')).toHaveCount(0)
  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
})

test('S6: 페이지네이션 2페이지 이동', async ({ page }) => {
  await page.goto('/notices/resources')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(page.getByTestId('resource-row')).toHaveCount(1)
  await expect(page.getByTestId('resource-row').first()).toContainText(
    '기타 참고자료.zip',
  )
})

test('S7: 검색 시 1페이지로 리셋', async ({ page }) => {
  await page.goto('/notices/resources')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(page.getByTestId('resource-row').first()).toContainText(
    '기타 참고자료.zip',
  )
  await page.getByRole('searchbox', { name: '자료 검색' }).fill('근무')
  await expect(page.getByTestId('resource-row')).toHaveCount(3)
  await expect(page.getByTestId('resource-row').first()).toContainText(
    '근무지침요령 1',
  )
})

test('S8: 행 케밥에 수정·삭제가 있고 수정으로 이동한다', async ({ page }) => {
  await page.goto('/notices/resources')
  await page.getByRole('button', { name: '근무지침요령 1 관리 메뉴' }).click()

  await expect(page.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '삭제' })).toBeVisible()

  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/notices\/resources\/1\/edit$/)
})

test('S9: 오래된순 정렬 → ASC 로 다시 조회한다', async ({ page }) => {
  const orders: (string | null)[] = []
  await page.route(/\/documents(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    orders.push(new URL(route.request().url()).searchParams.get('orderDirection'))
    await route.fallback()
  })

  await page.goto('/notices/resources')
  await expect(page.getByTestId('resource-row').first()).toBeVisible()

  await page.getByRole('button', { name: '자료 날짜 정렬' }).click()
  await page.getByRole('menuitemradio', { name: '오래된순' }).click()

  await expect.poll(() => orders.at(-1)).toBe('ASC')
  await expect(page).toHaveURL(/sort=oldest/)
})
