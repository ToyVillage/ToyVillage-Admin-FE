import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(work-log-list.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 localStorage mock 만 사용한다.

const deletedWorkLogFormStorageKey = 'toyvillage:work-log-forms:deleted'
const allMockFormIds = Array.from({ length: 9 }, (_, i) => `wlf-${i + 1}`)

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    // clear() 는 인증 가드가 보는 세션 토큰까지 지운다. mock 상태만 비우고
    // 보호 경로에 들어갈 수 있도록 토큰을 다시 심는다.
    localStorage.setItem('accessToken', 'test-access-token')
  })
})

test('S1: 목록 진입 기본 표시', async ({ page }) => {
  await page.goto('/work-logs')

  await expect(
    page.getByRole('heading', { name: '업무일지관리' }),
  ).toBeVisible()
  await expect(page.getByText('토이빌리지의 업무일지관리')).toBeVisible()
  await expect(page.getByRole('link', { name: '양식 생성하기' })).toBeVisible()
  await expect(page.getByRole('button', { name: '조회 연도' })).toBeVisible()
  await expect(page.getByRole('button', { name: '조회 월' })).toBeVisible()
  await expect(page.getByRole('button', { name: '조회 일' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: '작성된 일지' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(logRows(page)).toHaveCount(4)
})

test('S2: 탭 전환이 URL에 반영된다', async ({ page }) => {
  await page.goto('/work-logs')

  await page.getByRole('button', { name: '양식 관리' }).click()
  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
  await expect(formRows(page)).toHaveCount(4)
  await expect(formRows(page).first()).toContainText('관리자')

  await page.getByRole('button', { name: '작성된 일지' }).click()
  await expect(page).toHaveURL(/\/work-logs\?tab=logs$/)
  await expect(logRows(page)).toHaveCount(4)
})

test('S3: 탭 상태로 새로고침 진입', async ({ page }) => {
  await page.goto('/work-logs?tab=forms')

  await expect(page.getByRole('button', { name: '양식 관리' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(formRows(page)).toHaveCount(4)
})

test('S4: 조회날짜 드롭다운 선택', async ({ page }) => {
  await page.goto('/work-logs')
  await page.getByRole('button', { name: '2 페이지' }).click()

  const lastYear = String(new Date().getFullYear() - 1)
  await page.getByRole('button', { name: '조회 연도' }).click()
  await page.getByRole('option', { name: `${lastYear}년` }).click()

  await expect(page.getByRole('listbox', { name: '조회 연도' })).toBeHidden()
  await expect(page.getByRole('button', { name: '조회 연도' })).toContainText(
    `${lastYear}년`,
  )
  // 다른 날짜에는 mock 일지가 없어 1페이지 빈 상태로 리셋된다.
  await expect(logRows(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: '2 페이지' })).toBeHidden()
})

test('S5: 드롭다운 바깥 클릭으로 닫기', async ({ page }) => {
  await page.goto('/work-logs')

  const yearTrigger = page.getByRole('button', { name: '조회 연도' })
  const label = await yearTrigger.textContent()
  await yearTrigger.click()
  await expect(page.getByRole('listbox', { name: '조회 연도' })).toBeVisible()

  await page.getByRole('heading', { name: '업무일지관리' }).click()

  await expect(page.getByRole('listbox', { name: '조회 연도' })).toBeHidden()
  await expect(yearTrigger).toHaveText(String(label))
})

test('S6: 작성된 일지 행 클릭 → 상세 이동', async ({ page }) => {
  await page.goto('/work-logs')
  await logRows(page).first().click()

  await expect(page).toHaveURL(/\/work-logs\/wl-1$/)
})

test('S7: 케밥 버튼 클릭은 행 이동을 일으키지 않는다', async ({ page }) => {
  await page.goto('/work-logs')
  await kebab(logRows(page).first()).click()

  await expect(page).toHaveURL(/\/work-logs$/)
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem')).toHaveCount(1)
  await expect(menu.getByRole('menuitem', { name: '삭제' })).toBeVisible()
})

test('S8: 작성된 일지 삭제', async ({ page }) => {
  await page.goto('/work-logs')
  await expect(page.getByRole('button', { name: '3 페이지' })).toBeVisible()

  await kebab(logRows(page).first()).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
    .getByRole('button', { name: '확인' })
    .click()

  await expect(
    page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' }),
  ).toBeHidden()
  await expect(page.getByRole('status')).toContainText(
    '데이터 삭제에 성공했습니다',
  )
  // 9건 → 8건이라 3페이지가 사라진다.
  await expect(page.getByRole('button', { name: '3 페이지' })).toBeHidden()
})

test('S9: 삭제 취소', async ({ page }) => {
  await page.goto('/work-logs')

  await kebab(logRows(page).first()).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
    .getByRole('button', { name: '취소' })
    .click()

  await expect(
    page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' }),
  ).toBeHidden()
  await expect(logRows(page)).toHaveCount(4)
  await expect(page.getByRole('button', { name: '3 페이지' })).toBeVisible()
})

test('S10: 양식 관리 케밥 · 수정 이동', async ({ page }) => {
  await page.goto('/work-logs?tab=forms')

  await kebab(formRows(page).first()).click()
  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitem')).toHaveCount(2)
  await menu.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(/\/work-logs\/forms\/wlf-1\/edit$/)
})

test('S11: 양식 생성하기 이동', async ({ page }) => {
  await page.goto('/work-logs')
  await page.getByRole('link', { name: '양식 생성하기' }).click()

  await expect(page).toHaveURL(/\/work-logs\/forms\/create$/)
})

test('S12: 페이지네이션', async ({ page }) => {
  await page.goto('/work-logs')

  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeDisabled()
  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(logRows(page)).toHaveCount(4)
  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeEnabled()

  await page.getByRole('button', { name: '3 페이지' }).click()
  await expect(logRows(page)).toHaveCount(1)
  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeDisabled()
})

test('S13: 사이드바에서 진입', async ({ page }) => {
  await page.goto('/notices/list')
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await page.getByRole('link', { name: '업무일지관리 바로가기' }).click()

  await expect(page).toHaveURL(/\/work-logs$/)
  await expect(
    page.getByRole('heading', { name: '업무일지관리' }),
  ).toBeVisible()
  await expect(page.getByRole('dialog', { name: '사이드바' })).toBeHidden()
})

test('S14: 해당 날짜에 일지가 없는 빈 상태', async ({ page }) => {
  await page.goto('/work-logs')

  const lastYear = String(new Date().getFullYear() - 1)
  await page.getByRole('button', { name: '조회 연도' }).click()
  await page.getByRole('option', { name: `${lastYear}년` }).click()

  await expect(logRows(page)).toHaveCount(0)
  await expect(
    page.getByText('해당 날짜에 작성된 업무일지가 없습니다.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '1 페이지' })).toBeHidden()
})

test('S15: 등록된 양식이 없는 빈 상태', async ({ page }) => {
  await page.addInitScript(
    ([storageKey, ids]) => {
      localStorage.setItem(storageKey as string, JSON.stringify(ids))
    },
    [deletedWorkLogFormStorageKey, allMockFormIds] as const,
  )
  await page.goto('/work-logs?tab=forms')

  await expect(formRows(page)).toHaveCount(0)
  await expect(page.getByText('등록된 양식이 없습니다.')).toBeVisible()
  await expect(page.getByRole('button', { name: '1 페이지' })).toBeHidden()
})

test('S16: 말일 보정', async ({ page }) => {
  await page.goto('/work-logs')

  await page.getByRole('button', { name: '조회 월' }).click()
  await page.getByRole('option', { name: '01월' }).click()
  await page.getByRole('button', { name: '조회 일' }).click()
  await page.getByRole('option', { name: '31일' }).click()
  await expect(page.getByRole('button', { name: '조회 일' })).toContainText(
    '31일',
  )

  await page.getByRole('button', { name: '조회 월' }).click()
  await page.getByRole('option', { name: '02월' }).click()

  // 2월에는 31일이 없으므로 그 달의 마지막 날로 보정된다.
  await expect(page.getByRole('button', { name: '조회 일' })).toHaveText(
    /2[89]일/,
  )
})

test('S17: 탭을 바꿔도 조회날짜는 유지된다', async ({ page }) => {
  await page.goto('/work-logs')

  const lastYear = String(new Date().getFullYear() - 1)
  await page.getByRole('button', { name: '조회 연도' }).click()
  await page.getByRole('option', { name: `${lastYear}년` }).click()

  await page.getByRole('button', { name: '양식 관리' }).click()
  await page.getByRole('button', { name: '작성된 일지' }).click()

  await expect(page.getByRole('button', { name: '조회 연도' })).toContainText(
    `${lastYear}년`,
  )
})

test('S18: 삭제로 마지막 페이지가 비면 직전 페이지로', async ({ page }) => {
  await page.goto('/work-logs')
  await page.getByRole('button', { name: '3 페이지' }).click()
  await expect(logRows(page)).toHaveCount(1)

  await kebab(logRows(page).first()).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page.getByRole('button', { name: '3 페이지' })).toBeHidden()
  await expect(logRows(page)).toHaveCount(4)
  await expect(page.getByRole('button', { name: '2 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('S19: 양식 관리 행 클릭 → 양식 상세 이동', async ({ page }) => {
  await page.goto('/work-logs?tab=forms')
  await formRows(page).first().click()

  await expect(page).toHaveURL(/\/work-logs\/forms\/wlf-1$/)
})

function logRows(page: Page) {
  return page.getByTestId('work-log-row')
}

function formRows(page: Page) {
  return page.getByTestId('work-log-form-row')
}

function kebab(row: ReturnType<Page['getByTestId']>) {
  return row.getByRole('button', { name: /관리 메뉴$/ })
}
