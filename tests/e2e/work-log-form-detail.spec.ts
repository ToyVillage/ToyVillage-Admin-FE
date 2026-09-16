import { expect, test as base, type Page } from '@playwright/test'

// 승인된 시나리오(work-log-form-detail.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.



import { mockWorkLogApi, type WorkLogApiHandle } from './support/work-log-api'

// 업무일지 API 연동 이후 localStorage mock 대신 `support/work-log-api` 의
// page.route mock 을 쓴다. 실제 서버는 호출하지 않는다.
const test = base.extend<{ workLogApi: WorkLogApiHandle }>({
  workLogApi: [
    async ({ page }, runTest) => {
      await runTest(await mockWorkLogApi(page))
    },
    { auto: true },
  ],
})

test('S1: 양식 상세 진입 기본 표시', async ({ page }) => {
  await page.goto('/work-logs/forms/1')

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(page.getByText('양식명')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(3)
})

test('S2: 목록 행 클릭 → 양식 상세 진입', async ({ page }) => {
  await page.goto('/work-logs?tab=forms')
  await page.getByTestId('work-log-form-row').first().click()

  await expect(page).toHaveURL(/\/work-logs\/forms\/1$/)
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
  // 양식은 수정 기능이 없어 케밥에 삭제 하나만 있다.
  await expect(menu.getByRole('menuitem')).toHaveCount(1)
})

test('S4: 뒤로가기 → 양식 관리 탭으로 복귀', async ({ page }) => {
  await page.goto('/work-logs/forms/1')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
  await expect(page.getByRole('button', { name: '양식 관리' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('S5: 객관식 질문 카드', async ({ page }) => {
  await page.goto('/work-logs/forms/1')

  const card = questionCard(page, '습도')
  await expect(card.getByText('객관식 질문')).toBeVisible()
  for (const option of ['30%', '1212%', '1%']) {
    await expect(card.getByText(option, { exact: true })).toBeVisible()
  }
})

test('S6: 체크박스 질문 카드', async ({ page }) => {
  await page.goto('/work-logs/forms/1')

  const card = questionCard(page, '청소여부')
  await expect(card.getByText('체크박스')).toBeVisible()
  for (const option of ['모르겟음', '함', '안함']) {
    await expect(card.getByText(option, { exact: true })).toBeVisible()
  }
})

test('S7: 주관식 질문 카드', async ({ page }) => {
  await page.goto('/work-logs/forms/1')

  const card = questionCard(page, '청소 방법이 뭔가요?')
  await expect(card.getByText('주관식')).toBeVisible()
  await expect(card.getByText('텍스트', { exact: true })).toBeVisible()
})

test('S8: 읽기 전용 — 조작되지 않는다', async ({ page }) => {
  await page.goto('/work-logs/forms/1')

  // 본문에는 입력 요소도, 조작 가능한 컨트롤도 없다(뒤로가기 링크만).
  // 사이드바 토글은 레이아웃이 소유하므로 본문(main)으로 범위를 좁힌다.
  const main = page.getByRole('main')
  await expect(main.locator('input')).toHaveCount(0)
  await expect(main.locator('textarea')).toHaveCount(0)
  await expect(main.getByRole('button')).toHaveCount(0)
  await expect(main.getByRole('link')).toHaveCount(1)
})

// 명세의 양식 상세 응답에 질문별 필수 여부가 없어 질문 카드에는 필수 표시가 없다.
// 양식명 라벨의 * 하나만 남는다.
test('S9: 필수 표시', async ({ page }) => {
  await page.goto('/work-logs/forms/1')

  await expect(
    page.getByRole('main').getByText('*', { exact: true }),
  ).toHaveCount(1)
})

test('S10: 없는 양식으로 진입', async ({ page }) => {
  await page.goto('/work-logs/forms/999')

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
  await expect(page.getByRole('heading', { name: '업무일지관리' })).toBeVisible()
})

// 질문 카드는 h2(질문명)를 품은 section 이다.
function questionCard(page: Page, questionLabel: string) {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: questionLabel, exact: true }) })
}
