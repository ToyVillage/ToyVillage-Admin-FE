import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(task-list.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 localStorage mock 만 사용한다.

const deletedTaskStorageKey = 'toyvillage:tasks:deleted'
const allMockTaskIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

test('S1: 목록 진입 기본 상태', async ({ page }) => {
  await page.goto('/tasks')

  await expect(page.getByRole('heading', { name: '업무관리' })).toBeVisible()
  await expect(page.getByText('토이빌리지 업무 지시')).toBeVisible()
  await expect(page.getByRole('button', { name: '전체 업무' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(rows(page)).toHaveCount(4)
})

test('S2: 업무 등록하기 이동', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('link', { name: '업무 등록하기' }).click()
  await expect(page).toHaveURL(/\/tasks\/create$/)
})

test('S3: 진행중 탭 필터', async ({ page }) => {
  await page.goto('/tasks')
  const tab = page.getByRole('button', { name: '진행중', exact: true })
  await tab.click()

  await expect(tab).toHaveAttribute('aria-pressed', 'true')
  await expect(rows(page)).toHaveCount(4)
  for (const row of await rows(page).all()) {
    await expect(row).toContainText('진행중')
  }
})

test('S4: 완료 탭 필터', async ({ page }) => {
  await page.goto('/tasks')
  const tab = page.getByRole('button', { name: '완료', exact: true })
  await tab.click()

  await expect(tab).toHaveAttribute('aria-pressed', 'true')
  await expect(rows(page)).toHaveCount(4)
  for (const row of await rows(page).all()) {
    await expect(row).toContainText('완료')
  }
})

test('S5: 전체 업무 탭으로 복귀', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('button', { name: '완료', exact: true }).click()
  await page.getByRole('button', { name: '전체 업무' }).click()

  await expect(rows(page)).toHaveCount(4)
  await expect(rows(page).nth(3)).toContainText('반려')
})

test('S6: 행 클릭 → 수정 화면 이동', async ({ page }) => {
  await page.goto('/tasks')
  await rows(page).first().click()
  await expect(page).toHaveURL(/\/tasks\/1$/)
})

test('S7: 페이지네이션 이동', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(rows(page)).toHaveCount(4)
  await expect(rows(page).first()).toContainText('여름 프로그램 준비')
})

test('S8: 컬럼 표시 확인', async ({ page }) => {
  await page.goto('/tasks')

  for (const header of [
    '담당자',
    '제목',
    '상태',
    '우선순위',
    '완료기한',
    '공개범위',
  ]) {
    await expect(page.getByText(header, { exact: true }).first()).toBeVisible()
  }
})

test('S9: 상태·우선순위 배지 표시', async ({ page }) => {
  await page.goto('/tasks')
  const firstRow = rows(page).first()

  await expect(firstRow).toContainText('이승현')
  await expect(firstRow).toContainText('진행중')
  await expect(firstRow).toContainText('상')
  await expect(firstRow).toContainText('전체 공개')
})

test('S10: 결과 없음 → 빈 상태', async ({ page }) => {
  await seedDeletedTasks(page, allMockTaskIds)
  await page.goto('/tasks')

  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByText('등록된 업무가 없습니다.')).toBeVisible()
  await expect(page.getByRole('button', { name: '2 페이지' })).toHaveCount(0)
})

test('S11: 탭 전환 시 1페이지로 리셋', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page).first()).toContainText('여름 프로그램 준비')

  await page.getByRole('button', { name: '진행중', exact: true }).click()
  await page.getByRole('button', { name: '전체 업무' }).click()

  await expect(rows(page).first()).toContainText('이승현')
  await expect(rows(page).first()).toContainText('2026-07-03')
})

test('S12: 페이지네이션 경계 비활성', async ({ page }) => {
  await page.goto('/tasks')

  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeEnabled()

  await page.getByRole('button', { name: '3 페이지' }).click()

  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeEnabled()
})

test('S13: 완료기한 초과 표시', async ({ page }) => {
  await page.goto('/tasks')

  // 2번 행은 상태가 `완료`지만 완료기한이 지났으므로 위험색으로 표시한다.
  const overdueCell = rows(page).nth(1).locator('[data-overdue]')
  await expect(overdueCell).toHaveAttribute('data-overdue', 'true')
  await expect(overdueCell).toHaveCSS('color', 'rgb(255, 49, 49)')
})

test('S14: 삭제 성공 토스트 표시', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByRole('button', { name: '삭제하기' }).click()
  await page
    .getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByRole('status')).toContainText(
    '데이터 삭제에 성공했습니다',
  )
  await expect(page.getByRole('status')).toBeHidden({ timeout: 6000 })
})

test('S16: 키보드 조작', async ({ page }) => {
  await page.goto('/tasks')

  const tab = page.getByRole('button', { name: '진행중', exact: true })
  await tab.focus()
  await page.keyboard.press('Enter')
  await expect(tab).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: '전체 업무' }).click()
  const nextPage = page.getByRole('button', { name: '2 페이지' })
  await nextPage.focus()
  await page.keyboard.press('Enter')
  await expect(rows(page).first()).toContainText('여름 프로그램 준비')

  const firstRow = rows(page).first()
  await firstRow.focus()
  await expect(firstRow).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/tasks\/5$/)
})

test('S17: 사이드바 업무관리 메뉴 이동', async ({ page }) => {
  await page.goto('/notices/list')
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await page.getByRole('link', { name: '업무관리' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByRole('heading', { name: '업무관리' })).toBeVisible()
})

function rows(page: Page) {
  return page.getByTestId('task-row')
}

async function seedDeletedTasks(page: Page, ids: string[]) {
  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key as string, value as string)
    },
    [deletedTaskStorageKey, JSON.stringify(ids)],
  )
}
