import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(task-list.approved.json, S1~S23)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 목록 조회는 localStorage mock 이고,
// 삭제(S19·S20)만 이미 연동된 TASK_DELETE 를 page.route() 로 mock 한다.

const deletedTaskStorageKey = 'toyvillage:tasks:deleted'
const allMockTaskIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const deleteApiPattern = /\/api\/tasks\/[^/?]+(?:\?.*)?$/

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

test('S5: 행 본문 클릭 → 상세 이동', async ({ page }) => {
  await page.goto('/tasks')
  await rows(page).first().getByText('업무 제목').click()

  await expect(page).toHaveURL(/\/tasks\/1$/)
})

test('S6: 페이지네이션 이동', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(rows(page)).toHaveCount(4)
  await expect(rows(page).first()).toContainText('여름 프로그램 준비')
})

test('S7: 페이지네이션 경계 비활성', async ({ page }) => {
  await page.goto('/tasks')

  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeEnabled()

  await page.getByRole('button', { name: '3 페이지' }).click()

  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeDisabled()
  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeEnabled()
})

test('S8: 탭 전환 시 1페이지로 리셋', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page).first()).toContainText('여름 프로그램 준비')

  await page.getByRole('button', { name: '진행중', exact: true }).click()
  await page.getByRole('button', { name: '전체 업무' }).click()

  await expect(rows(page).first()).toContainText('이승현')
  await expect(rows(page).first()).toContainText('2026-07-03')
})

test('S9: 결과 없음 → 빈 상태', async ({ page }) => {
  await seedDeletedTasks(page, allMockTaskIds)
  await page.goto('/tasks')

  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByText('등록된 업무가 없습니다.')).toBeVisible()
  await expect(page.getByRole('button', { name: '2 페이지' })).toHaveCount(0)
})

test('S10: 완료기한 초과 표시', async ({ page }) => {
  await page.goto('/tasks')

  // 2번 행은 상태가 `완료`지만 완료기한이 지났으므로 위험색으로 표시한다.
  const overdueCell = rows(page).nth(1).locator('[data-overdue]')
  await expect(overdueCell).toHaveAttribute('data-overdue', 'true')
  await expect(overdueCell).toHaveCSS('color', 'rgb(255, 49, 49)')
})

test('S11: 컬럼 구성 확인', async ({ page }) => {
  await page.goto('/tasks')

  for (const header of ['담당자', '제목', '상태', '우선순위', '완료기한']) {
    await expect(page.getByText(header, { exact: true }).first()).toBeVisible()
  }
  await expect(page.getByText('공개범위', { exact: true })).toHaveCount(0)
})

test('S12: 담당자 다중 표기', async ({ page }) => {
  await page.goto('/tasks')

  await expect(rows(page).first()).toContainText('이승현')
  await expect(rows(page).first()).toContainText('외 5명')
  await expect(rows(page).nth(1)).toContainText('김수인')
  await expect(rows(page).nth(1)).not.toContainText('외 ')
})

test('S13: 케밥 메뉴 열기', async ({ page }) => {
  await page.goto('/tasks')
  const trigger = menuTrigger(page, 0)
  await trigger.click()

  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '삭제' })).toBeVisible()
  // 케밥 클릭은 행 클릭 이동을 발생시키지 않는다.
  await expect(page).toHaveURL(/\/tasks$/)
})

test('S14: 케밥 메뉴는 하나만 열린다', async ({ page }) => {
  await page.goto('/tasks')
  await menuTrigger(page, 0).click()
  await menuTrigger(page, 1).click()

  await expect(menuTrigger(page, 0)).toHaveAttribute('aria-expanded', 'false')
  await expect(menuTrigger(page, 1)).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('menu')).toHaveCount(1)
})

test('S15: 케밥 메뉴 닫기', async ({ page }) => {
  await page.goto('/tasks')
  const trigger = menuTrigger(page, 0)

  await trigger.click()
  await page.getByRole('heading', { name: '업무관리' }).click()
  await expect(page.getByRole('menu')).toHaveCount(0)

  await trigger.click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('S16: 케밥 수정 → 수정 폼 이동', async ({ page }) => {
  await page.goto('/tasks')
  await menuTrigger(page, 0).click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(page).toHaveURL(/\/tasks\/1\/edit$/)
})

test('S17: 케밥 삭제 → 확인 모달', async ({ page }) => {
  await page.goto('/tasks')
  await menuTrigger(page, 0).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()

  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(
    page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' }),
  ).toBeVisible()
})

test('S18: 삭제 취소', async ({ page }) => {
  await page.goto('/tasks')
  await openDeleteDialog(page, 0)
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(rows(page)).toHaveCount(4)
  await expect(rows(page).first()).toContainText('이승현')
  await expect(rows(page).first()).toContainText('2026-07-03')
})

test('S19: 삭제 확인 → 성공 토스트', async ({ page }) => {
  await page.route(deleteApiPattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: '업무지시가 삭제되었습니다.' }),
    })
  })
  await page.goto('/tasks')
  await openDeleteDialog(page, 0)
  await page.getByRole('button', { name: '확인' }).click()

  const toast = page.getByText('데이터 삭제에 성공했습니다')
  await expect(toast).toBeVisible()
  await expect(rows(page).first()).toContainText('김수인')
  await expect(rows(page)).toHaveCount(4)
  await expect(toast).toBeHidden({ timeout: 6000 })
})

test('S20: 삭제 실패 토스트', async ({ page }) => {
  await page.route(deleteApiPattern, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: '삭제에 실패했습니다.' }),
    })
  })
  await page.goto('/tasks')
  await openDeleteDialog(page, 0)
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('alert')).toContainText(
    '데이터 삭제에 실패했습니다',
  )
  await expect(rows(page)).toHaveCount(4)
  await expect(rows(page).first()).toContainText('2026-07-03')
})

test('S21: 생성 성공 토스트', async ({ page }) => {
  await page.goto('/tasks/create')
  await page.getByRole('radio', { name: '상' }).check()
  await page.getByLabel('완료기한').fill('2027-03-02')
  await page.getByRole('button', { name: '사육팀 펼치기' }).click()
  await page.getByRole('checkbox', { name: '이승현 사원' }).check()
  await page.getByLabel(/제목/).fill('신규 업무 지시')
  await page.getByLabel(/상세 업무 내용/).fill('상세 업무 내용이 입력되어있음')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  const toast = page.getByText('데이터 생성에 성공했습니다')
  await expect(toast).toBeVisible()
  await expect(toast).toBeHidden({ timeout: 6000 })
})

test('S22: 키보드 조작', async ({ page }) => {
  await page.goto('/tasks')

  const tab = page.getByRole('button', { name: '진행중', exact: true })
  await tab.focus()
  await page.keyboard.press('Enter')
  await expect(tab).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: '전체 업무' }).click()
  const secondPage = page.getByRole('button', { name: '2 페이지' })
  await secondPage.focus()
  await page.keyboard.press('Enter')
  await expect(rows(page).first()).toContainText('여름 프로그램 준비')

  // 케밥 메뉴도 키보드만으로 열고 항목을 실행할 수 있다.
  const trigger = menuTrigger(page, 0)
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menu')).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('menuitem', { name: '수정' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()

  const firstRow = rows(page).first()
  await firstRow.focus()
  await expect(firstRow).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/tasks\/5$/)
})

test('S23: 사이드바 업무관리 메뉴 이동', async ({ page }) => {
  await page.goto('/notices/list')
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await page.getByRole('link', { name: '업무 관리 바로가기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByRole('heading', { name: '업무관리' })).toBeVisible()

  // 메뉴로 이동하면 사이드바도 함께 닫힌다.
  await expect(page.getByRole('dialog', { name: '사이드바' })).toBeHidden()
  await expect(
    page.getByRole('button', { name: '사이드바 열기' }),
  ).toHaveAttribute('aria-expanded', 'false')
})

function rows(page: Page) {
  return page.getByTestId('task-row')
}

function menuTrigger(page: Page, rowIndex: number) {
  return rows(page).nth(rowIndex).getByRole('button', { name: /업무 메뉴 열기/ })
}

async function openDeleteDialog(page: Page, rowIndex: number) {
  await menuTrigger(page, rowIndex).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(
    page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' }),
  ).toBeVisible()
}

async function seedDeletedTasks(page: Page, ids: string[]) {
  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key as string, value as string)
    },
    [deletedTaskStorageKey, JSON.stringify(ids)],
  )
}
