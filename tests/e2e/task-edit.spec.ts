import { expect, test, type Page } from '@playwright/test'
import { mockTaskApi, type TaskApiHandle } from './support/task-api'

// 승인된 시나리오(task-edit.approved.json, S1~S16)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 상세 조회·수정·담당자 트리가 API 연동으로 바뀌어 localStorage mock 대신
// `support/task-api` 의 page.route mock 을 쓴다(검증 의도는 그대로다).

// mock 업무 1 — 담당자 6명(이승현 외 5명), 첨부 3건, 사육팀 3명 + 창고팀 1명 + 동물 관리팀 1명 선택.
const editUrl = '/tasks/1/edit'

let taskApi: TaskApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'task-edit-test-token')
  })
  taskApi = await mockTaskApi(page)
})

test('S1: 수정 화면 진입', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByRole('button', { name: /업무 메뉴 열기/ }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(/\/tasks\/1\/edit$/)
})

test('S2: 기존 값 복원', async ({ page }) => {
  await page.goto(editUrl)

  await expect(page.getByRole('radio', { name: '상' })).toBeChecked()
  await expect(page.getByLabel('완료기한')).toHaveValue('2026-07-03')
  await expect(page.getByLabel(/제목/)).toHaveValue('업무 제목')
  await expect(page.getByLabel(/상세 업무 내용/)).toHaveValue(
    '상세 업무 내용이 입력되어있음',
  )
})

test('S3: 담당자 복원과 접힌 트리', async ({ page }) => {
  await page.goto(editUrl)

  // 진입 시에는 모든 팀이 접혀 있다.
  for (const team of ['동물 관리팀', '창고팀', '사육장 청소팀', '사육팀']) {
    await expect(
      page.getByRole('button', { name: `${team} 펼치기` }),
    ).toBeVisible()
  }
  await expect(page.getByRole('checkbox', { name: '이승현 사원' })).toBeHidden()

  // 펼치면 저장된 직원이 체크돼 있다.
  await page.getByRole('button', { name: '사육팀 펼치기' }).click()
  await expect(page.getByRole('checkbox', { name: '이승현 사원' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: '홍길동 과장' })).toBeChecked()
  await page.getByRole('button', { name: '사육장 청소팀 펼치기' }).click()
  await expect(page.getByRole('checkbox', { name: '김유영 사원' })).toBeChecked()
})

test('S4: 부분 선택 복원', async ({ page }) => {
  await page.goto(editUrl)

  await expect(teamRow(page, '사육팀')).toHaveAttribute('aria-checked', 'mixed')
  await expect(page.getByText('3/6명')).toBeVisible()
  await expect(allEmployeesRow(page)).toHaveAttribute('aria-checked', 'mixed')
  await expect(page.getByText('6/18명')).toBeVisible()
})

test('S5: 기존 첨부 표시', async ({ page }) => {
  await page.goto(editUrl)

  const attachments = attachmentGroup(page)
  await expect(attachments.getByText('당일 지침.pdf')).toBeVisible()
  await expect(attachments.getByText('휴관안내.png')).toBeVisible()
  await expect(attachments.getByText('휴관안내.jpg')).toBeVisible()
  await expect(
    attachments.getByRole('button', { name: /다운로드$/ }),
  ).toHaveCount(3)
})

test('S6: 공개범위 부재', async ({ page }) => {
  await page.goto(editUrl)

  await expect(page.getByText('공개범위')).toHaveCount(0)
})

test('S7: 삭제 버튼 부재', async ({ page }) => {
  await page.goto(editUrl)

  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
  await expect(page.getByRole('button', { name: '삭제하기' })).toHaveCount(0)
})

test('S8: 제목 수정 저장', async ({ page }) => {
  await page.goto(editUrl)
  await page.getByLabel(/제목/).fill('수정한 업무 제목')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks\/1$/)
  await expect(
    page.getByRole('heading', { name: '수정한 업무 제목' }),
  ).toBeVisible()
})

test('S9: 담당자 추가 저장', async ({ page }) => {
  await page.goto(editUrl)
  // 사육팀에서 아직 담당자가 아닌 최유진을 추가한다(6명 → 7명).
  await page.getByRole('button', { name: '사육팀 펼치기' }).click()
  await page.getByRole('checkbox', { name: '최유진 사원' }).check()
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks\/1$/)
  await expect(page.getByText('외 6명')).toBeVisible()

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page.getByTestId('task-row').first()).toContainText('외 6명')
})

test('S10: 제목 미입력 검증', async ({ page }) => {
  await page.goto(editUrl)
  await page.getByLabel(/제목/).fill('')
  await page.getByRole('button', { name: '저장하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('제목을 입력해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page.getByLabel(/제목/)).toBeFocused()
  await expect(page).toHaveURL(/\/tasks\/1\/edit$/)
  expect(taskApi.requests.update).toBe(0)
})

test('S11: 담당자 전체 해제 검증', async ({ page }) => {
  await page.goto(editUrl)
  // 부분 선택 상태에서 `전체 직원` 을 누르면 전부 해제된다.
  await allEmployees(page).click()
  await expect(page.getByText('0/18명')).toBeVisible()

  await page.getByRole('button', { name: '저장하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('담당자를 선택해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/tasks\/1\/edit$/)
})

test('S12: 변경 후 이탈 보호', async ({ page }) => {
  await page.goto(editUrl)
  await page.getByLabel(/제목/).fill('작성 중인 수정')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  const dialog = page.getByRole('alertdialog', {
    name: '정말 나가시겠습니까?',
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '취소' }).click()

  await expect(page).toHaveURL(/\/tasks\/1\/edit$/)
  await expect(page.getByLabel(/제목/)).toHaveValue('작성 중인 수정')
})

test('S13: 무변경 이탈', async ({ page }) => {
  await page.goto(editUrl)
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/tasks\/1$/)
  await expect(
    page.getByRole('alertdialog', { name: '정말 나가시겠습니까?' }),
  ).toHaveCount(0)
})

test('S14: 저장 중복 제출 방지', async ({ page }) => {
  taskApi = await mockTaskApi(page, { mutationDelayMs: 1500 })
  await page.goto(editUrl)
  await page.getByLabel(/제목/).fill('한 번만 저장할 업무')

  await page.getByRole('button', { name: '저장하기' }).click()

  // 저장 중에는 버튼이 비활성이라 사용자가 다시 눌러도 제출되지 않는다.
  const pendingButton = page.getByRole('button', { name: '저장 중' })
  await expect(pendingButton).toBeDisabled()
  await pendingButton.click({ force: true })

  await expect(page).toHaveURL(/\/tasks\/1$/)
  expect(taskApi.requests.update).toBe(1)
})

test('S15: 없는 업무', async ({ page }) => {
  await page.goto('/tasks/no-such-task/edit')

  await expect(page.getByRole('alert')).toContainText(
    '업무를 찾을 수 없습니다.',
  )
  await page.getByRole('link', { name: '목록으로 돌아가기' }).click()
  await expect(page).toHaveURL(/\/tasks$/)
})

test('S16: 키보드 조작', async ({ page }) => {
  await page.goto(editUrl)
  await page.getByRole('link', { name: '뒤로가기' }).focus()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('radio', { name: '상' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: '중' })).toBeChecked()

  await page.keyboard.press('Tab')
  await expect(page.getByLabel('완료기한')).toBeFocused()

  // 완료기한 다음은 제목이다. Tab 진입은 값을 전체 선택하므로 End 로 캐럿을 끝에 둔다.
  await page.keyboard.press('Tab')
  await expect(page.getByLabel(/제목/)).toBeFocused()
  await page.keyboard.press('End')
  await page.keyboard.type(' (키보드 수정)')

  await page.keyboard.press('Tab')
  await expect(page.getByLabel(/상세 업무 내용/)).toBeFocused()

  // 상세 내용 다음이 담당자 트리다. 팀 행 4개 + 미배정 행 1개
  // (각 체크박스 + 펼침 버튼 = 10개)를 지나면 첨부 chip 이다.
  await page.keyboard.press('Tab')
  await expect(allEmployees(page)).toBeFocused()
  for (let index = 0; index < 11; index += 1) {
    await page.keyboard.press('Tab')
  }
  await expect(
    page.getByRole('button', { name: /다운로드$/ }).first(),
  ).toBeFocused()

  await page.getByRole('button', { name: '저장하기' }).focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/tasks\/1$/)
  await expect(
    page.getByRole('heading', { name: '업무 제목 (키보드 수정)' }),
  ).toBeVisible()
})

function allEmployees(page: Page) {
  return page.getByRole('checkbox', { name: /^전체 직원/ })
}

function allEmployeesRow(page: Page) {
  return page.getByRole('treeitem').filter({ hasText: '전체 직원' })
}

function teamRow(page: Page, teamName: string) {
  return page
    .getByRole('treeitem')
    .filter({ has: page.getByRole('button', { name: new RegExp(teamName) }) })
}

function attachmentGroup(page: Page) {
  return page.getByRole('group', { name: '첨부파일' })
}

