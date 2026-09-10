import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(work-log-form-detail.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 localStorage mock 만 사용한다.

const deletedWorkLogFormStorageKey = 'toyvillage:work-log-forms:deleted'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

test('S1: 양식 상세 진입 기본 표시', async ({ page }) => {
  await page.goto('/work-logs/forms/wlf-1')

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(page.getByText('양식명')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(3)
})

test('S2: 목록 행 클릭 → 양식 상세 진입', async ({ page }) => {
  await page.goto('/work-logs?tab=forms')
  await page.getByTestId('work-log-form-row').first().click()

  await expect(page).toHaveURL(/\/work-logs\/forms\/wlf-1$/)
})

test('S3: 케밥 클릭은 행 이동을 일으키지 않는다', async ({ page }) => {
  await page.goto('/work-logs?tab=forms')
  await page
    .getByTestId('work-log-form-row')
    .first()
    .getByRole('button', { name: /관리 메뉴$/ })
    .click()

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitem')).toHaveCount(2)
})

test('S4: 뒤로가기 → 양식 관리 탭으로 복귀', async ({ page }) => {
  await page.goto('/work-logs/forms/wlf-1')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
  await expect(page.getByRole('button', { name: '양식 관리' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('S5: 객관식 질문 카드', async ({ page }) => {
  await page.goto('/work-logs/forms/wlf-1')

  const card = questionCard(page, '습도')
  await expect(card.getByText('객관식 질문')).toBeVisible()
  for (const option of ['30%', '1212%', '1%']) {
    await expect(card.getByText(option, { exact: true })).toBeVisible()
  }
})

test('S6: 체크박스 질문 카드', async ({ page }) => {
  await page.goto('/work-logs/forms/wlf-1')

  const card = questionCard(page, '청소여부')
  await expect(card.getByText('체크박스')).toBeVisible()
  for (const option of ['모르겟음', '함', '안함']) {
    await expect(card.getByText(option, { exact: true })).toBeVisible()
  }
})

test('S7: 주관식 질문 카드', async ({ page }) => {
  await page.goto('/work-logs/forms/wlf-1')

  const card = questionCard(page, '청소 방법이 뭔가요?')
  await expect(card.getByText('주관식')).toBeVisible()
  await expect(card.getByText('텍스트', { exact: true })).toBeVisible()
})

test('S8: 읽기 전용 — 조작되지 않는다', async ({ page }) => {
  await page.goto('/work-logs/forms/wlf-1')

  // 본문에는 입력 요소도, 조작 가능한 컨트롤도 없다(뒤로가기 링크만).
  // 사이드바 토글은 레이아웃이 소유하므로 본문(main)으로 범위를 좁힌다.
  const main = page.getByRole('main')
  await expect(main.locator('input')).toHaveCount(0)
  await expect(main.locator('textarea')).toHaveCount(0)
  await expect(main.getByRole('button')).toHaveCount(0)
  await expect(main.getByRole('link')).toHaveCount(1)
})

test('S9: 필수 표시', async ({ page }) => {
  await page.goto('/work-logs/forms/wlf-1')

  // 양식명 1개 + 필수 질문 3개 = 4개의 필수 표시.
  await expect(page.getByRole('main').getByText('*', { exact: true })).toHaveCount(4)
  await expect(page.getByText(/객관식 질문\s*\*/)).toBeVisible()
  await expect(page.getByText(/체크박스\s*\*/)).toBeVisible()
  await expect(page.getByText(/주관식\s*\*/)).toBeVisible()
})

test('S10: 없는 양식으로 진입', async ({ page }) => {
  await page.addInitScript(
    ([storageKey, ids]) => {
      localStorage.setItem(storageKey as string, JSON.stringify(ids))
    },
    [deletedWorkLogFormStorageKey, ['wlf-1']] as const,
  )
  await page.goto('/work-logs/forms/wlf-1')

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
  await expect(page.getByRole('heading', { name: '업무일지관리' })).toBeVisible()
})

// 질문 카드는 h2(질문명)를 품은 section 이다.
function questionCard(page: Page, questionLabel: string) {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: questionLabel, exact: true }) })
}
