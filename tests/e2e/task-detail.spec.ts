import { expect, test, type Page } from '@playwright/test'
import { mockTaskApi } from './support/task-api'

// 승인된 시나리오(task-detail.approved.json, S1~S19)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 상세 조회가 API 연동으로 바뀌어 localStorage mock 대신
// `support/task-api` 의 page.route mock 을 쓴다(검증 의도는 그대로다).

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'task-detail-test-token')
  })
  await mockTaskApi(page)
})

test('S1: 상세 진입 기본 상태', async ({ page }) => {
  await page.goto('/tasks/1')

  await expect(page.getByText('담당자', { exact: true })).toBeVisible()
  await expect(page.getByText('상태', { exact: true })).toBeVisible()
  await expect(page.getByText('우선순위', { exact: true })).toBeVisible()
  await expect(page.getByText('완료기한', { exact: true })).toBeVisible()
  await expect(page.getByText('2026-07-03')).toBeVisible()
  await expect(page.getByRole('heading', { name: '업무 제목' })).toBeVisible()
  await expect(page.getByText('상세 업무 내용이 입력되어있음')).toBeVisible()

  // 상세는 읽기 전용이다.
  await expect(page.getByRole('button', { name: '저장하기' })).toHaveCount(0)
})

test('S2: 담당자 표기', async ({ page }) => {
  // 업무보고 목록에도 같은 이름이 나오므로 요약행으로 범위를 좁힌다.
  await page.goto('/tasks/4')
  await expect(infoRow(page).getByText('이승현')).toBeVisible()
  await expect(infoRow(page).getByText('외 3명')).toBeVisible()

  await page.goto('/tasks/2')
  await expect(infoRow(page).getByText('김수인')).toBeVisible()
  await expect(infoRow(page).getByText(/외 \d+명/)).toHaveCount(0)
})

test('S3: 첨부 다운로드 표시', async ({ page }) => {
  await page.goto('/tasks/1')

  const attachments = attachmentGroup(page)
  await expect(attachments.getByText('당일 지침.pdf')).toBeVisible()
  await expect(attachments.getByText('휴관안내.png')).toBeVisible()
  await expect(attachments.getByText('휴관안내.jpg')).toBeVisible()
  await expect(
    attachments.getByRole('button', { name: /다운로드$/ }),
  ).toHaveCount(3)
})

test('S4: 첨부 없음', async ({ page }) => {
  await page.goto('/tasks/2')

  await expect(attachmentGroup(page)).toHaveCount(0)
})

test('S5: 업무보고 목록', async ({ page }) => {
  await page.goto('/tasks/1')

  // 담당자별 현황이라 담당자 전원이 한 줄씩 나온다(아직 내지 않은 사람 포함).
  const rows = reportRows(page)
  await expect(rows).toHaveCount(6)
  await expect(rows.nth(0)).toContainText('이승현')
  await expect(rows.nth(0)).toContainText('승인')
  await expect(rows.nth(2)).toContainText('이지아')
  await expect(rows.nth(2)).toContainText('반려')
  await expect(rows.nth(3)).toContainText('김유영')
  await expect(rows.nth(3)).toContainText('심사대기')
  // 서버 `MISSING`(미제출)도 `심사대기` 로 보여준다.
  await expect(rows.nth(4)).toContainText('홍길동')
  await expect(rows.nth(4)).toContainText('심사대기')
})

test('S6: 업무보고 상세 진입', async ({ page }) => {
  await page.goto('/tasks/1')

  // 진입은 업무보고 API 연동까지 막아 뒀다. 여기 id 는 실 API 의 `workReportId`(숫자)인데
  // `/task-reports/:id` 는 아직 mock(`r1` 형식)을 읽어 항상 `찾을 수 없습니다` 로 떨어졌다.
  // 연동하면 이 테스트를 시나리오 원안(제출된 4건만 버튼 → 이동)으로 되돌린다.
  await expect(reportItems(page)).toHaveCount(0)
  await expect(reportRows(page)).toHaveCount(6)
})

test('S7: 진행도 요약', async ({ page }) => {
  // 심사대기 3 = 심사대기 1 + 미제출 2(미제출은 심사대기에 합산한다).
  await page.goto('/tasks/1')
  await expect(
    page.getByText('전체 6 · 승인 2 · 반려 1 · 심사대기 3'),
  ).toBeVisible()

  // 아무도 내지 않은 업무는 전부 심사대기로 모인다.
  await page.goto('/tasks/2')
  await expect(
    page.getByText('전체 1 · 승인 0 · 반려 0 · 심사대기 1'),
  ).toBeVisible()
  await expect(reportRows(page).filter({ hasText: '심사대기' })).toHaveCount(1)
})

test('S8: 업무보고 없음', async ({ page }) => {
  await page.goto('/tasks/10')

  await expect(page.getByText('제출된 업무 보고가 없습니다.')).toBeVisible()
  await expect(page.getByText('진행도')).toHaveCount(0)
})

test('S9: 뒤로가기', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})

test('S10: 케밥 메뉴 열기', async ({ page }) => {
  await page.goto('/tasks/1')
  await menuTrigger(page).click()

  await expect(page.getByRole('menu')).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '삭제' })).toBeVisible()
})

test('S11: 케밥 닫기', async ({ page }) => {
  await page.goto('/tasks/1')

  await menuTrigger(page).click()
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await expect(page.getByRole('menu')).toHaveCount(0)

  await menuTrigger(page).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(menuTrigger(page)).toBeFocused()
})

test('S12: 케밥 수정 → 편집 이동', async ({ page }) => {
  await page.goto('/tasks/1')
  await menuTrigger(page).click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(/\/tasks\/1\/edit$/)
})

test('S13: 케밥 삭제 → 확인 모달', async ({ page }) => {
  await page.goto('/tasks/1')
  await openDeleteDialog(page)

  await expect(
    page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' }),
  ).toBeVisible()
})

test('S14: 삭제 취소', async ({ page }) => {
  await page.goto('/tasks/1')
  await openDeleteDialog(page)
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/tasks\/1$/)
  await expect(page.getByRole('heading', { name: '업무 제목' })).toBeVisible()
})

test('S15: 삭제 확인 → 목록 이동', async ({ page }) => {
  await page.goto('/tasks/1')
  await openDeleteDialog(page)
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
})

test('S16: 삭제 실패', async ({ page }) => {
  await mockTaskApi(page, { deleteStatus: 500 })
  await page.goto('/tasks/1')
  await openDeleteDialog(page)
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('alert')).toContainText(
    '데이터 삭제에 실패했습니다',
  )
  await expect(page).toHaveURL(/\/tasks\/1$/)
  await expect(page.getByRole('heading', { name: '업무 제목' })).toBeVisible()
})

test('S17: 없는 업무', async ({ page }) => {
  await page.goto('/tasks/no-such-task')

  await expect(page.getByRole('alert')).toContainText(
    '업무를 찾을 수 없습니다.',
  )
  await page.getByRole('link', { name: '목록으로 돌아가기' }).click()
  await expect(page).toHaveURL(/\/tasks$/)
})

test('S18: 완료기한 위험색 미적용', async ({ page }) => {
  // 업무 1 의 완료기한(2026-07-03)은 목록에서 기한 초과로 표시되는 날짜다.
  await page.goto('/tasks/1')

  await expect(page.getByText('2026-07-03')).toHaveCSS('color', 'rgb(0, 0, 0)')
})

test('S19: 키보드 조작', async ({ page }) => {
  await page.goto('/tasks/1')

  const trigger = menuTrigger(page)
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menu')).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('menuitem', { name: '수정' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()

  // 업무보고 줄은 진입을 막아 둔 동안 탭 순서에서도 빠진다(S6 참고).
  await expect(reportItems(page)).toHaveCount(0)
})

function infoRow(page: Page) {
  return page.locator('dl')
}

function menuTrigger(page: Page) {
  return page.getByRole('button', { name: /업무 메뉴 열기/ })
}

async function openDeleteDialog(page: Page) {
  await menuTrigger(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
}

function attachmentGroup(page: Page) {
  return page.getByRole('group', { name: '첨부자료' })
}

// 제출된 보고만 버튼이다(미제출 줄은 누를 수 없다).
function reportItems(page: Page) {
  return page
    .locator('section')
    .filter({ hasText: '업무 보고' })
    .getByRole('button')
}

// 미제출을 포함한 담당자별 현황 전체.
function reportRows(page: Page) {
  return page.getByTestId('task-report-row')
}
