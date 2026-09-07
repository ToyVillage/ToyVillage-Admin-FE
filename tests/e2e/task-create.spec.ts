import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(task-create.approved.json, S1~S20)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 localStorage mock 만 사용한다.

const mutationDelayStorageKey = 'toyvillage:tasks:mutation-delay'
const mutationLogStorageKey = 'toyvillage:tasks:mutation-log'

type SkippableField =
  | 'priority'
  | 'dueDate'
  | 'assignee'
  | 'title'
  | 'content'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

test('S1: 빈 폼 진입', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('link', { name: '업무 등록하기' }).click()

  await expect(page).toHaveURL(/\/tasks\/create$/)
  await expect(page.getByRole('radio', { name: '상' })).not.toBeChecked()
  await expect(page.getByRole('radio', { name: '중' })).not.toBeChecked()
  await expect(page.getByRole('radio', { name: '하' })).not.toBeChecked()
  await expect(page.getByLabel('완료기한')).toHaveValue('')
  await expect(allEmployees(page)).not.toBeChecked()
  await expect(page.getByText('0/18명')).toBeVisible()
  await expect(page.getByLabel(/제목/)).toHaveValue('')
  await expect(page.getByLabel(/상세 업무 내용/)).toHaveValue('')
  await expect(page.getByRole('button', { name: '생성하기' })).toBeVisible()

  // 공개범위 필드는 yot 에서 사라졌다.
  await expect(page.getByText('공개범위')).toHaveCount(0)
})

test('S2: 우선순위 단일 선택', async ({ page }) => {
  await page.goto('/tasks/create')
  await page.getByRole('radio', { name: '중' }).check()

  await expect(page.getByRole('radio', { name: '중' })).toBeChecked()
  await expect(page.getByRole('radio', { name: '상' })).not.toBeChecked()
  await expect(page.getByRole('radio', { name: '하' })).not.toBeChecked()
})

test('S3: 완료기한 선택', async ({ page }) => {
  await page.goto('/tasks/create')
  await page.getByLabel('완료기한').fill('2026-12-31')
  await expect(page.getByLabel('완료기한')).toHaveValue('2026-12-31')

  // 포커스가 있는 동안에는 네이티브 입력이 보이므로, 포커스를 옮긴 뒤 표기를 확인한다.
  await page.getByLabel(/제목/).focus()
  await expect(page.getByText('2026. 12. 31')).toBeVisible()
})

test('S4: 팀 펼침·접힘', async ({ page }) => {
  await page.goto('/tasks/create')
  await expect(page.getByRole('checkbox', { name: '이승현 사원' })).toHaveCount(
    0,
  )

  await page.getByRole('button', { name: '사육팀 펼치기' }).click()
  await expect(page.getByRole('checkbox', { name: '이승현 사원' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: '홍길동 과장' })).toBeVisible()

  await page.getByRole('button', { name: '사육팀 접기' }).click()
  await expect(page.getByRole('checkbox', { name: '이승현 사원' })).toHaveCount(
    0,
  )
})

test('S5: 팀 전체 선택', async ({ page }) => {
  await page.goto('/tasks/create')
  await teamCheckbox(page, '동물 관리팀').check()

  await expect(teamCheckbox(page, '동물 관리팀')).toBeChecked()
  await expect(page.getByText('5/5명')).toBeVisible()
})

test('S6: 팀 부분 선택', async ({ page }) => {
  await page.goto('/tasks/create')
  await page.getByRole('button', { name: '동물 관리팀 펼치기' }).click()
  await teamCheckbox(page, '동물 관리팀').check()
  await page.getByRole('checkbox', { name: '김수인 사원' }).uncheck()

  await expect(teamRow(page, '동물 관리팀')).toHaveAttribute(
    'aria-checked',
    'mixed',
  )
  await expect(page.getByText('4/5명')).toBeVisible()
})

test('S7: 전체 직원 토글', async ({ page }) => {
  await page.goto('/tasks/create')
  await allEmployees(page).check()

  await expect(page.getByText('18/18명')).toBeVisible()
  await expect(teamCheckbox(page, '사육팀')).toBeChecked()
  await expect(page.getByText('6/6명')).toBeVisible()

  await allEmployees(page).uncheck()
  await expect(page.getByText('0/18명')).toBeVisible()
  await expect(teamCheckbox(page, '사육팀')).not.toBeChecked()
})

test('S8: 전체 직원 부분 선택 표시', async ({ page }) => {
  await page.goto('/tasks/create')
  await teamCheckbox(page, '창고팀').check()

  await expect(allEmployeesRow(page)).toHaveAttribute('aria-checked', 'mixed')
  await expect(page.getByText('3/18명')).toBeVisible()
})

test('S9: 접어도 선택 유지', async ({ page }) => {
  await page.goto('/tasks/create')
  await page.getByRole('button', { name: '사육팀 펼치기' }).click()
  await page.getByRole('checkbox', { name: '이승현 사원' }).check()
  await expect(page.getByText('1/6명')).toBeVisible()

  await page.getByRole('button', { name: '사육팀 접기' }).click()
  await expect(page.getByText('1/6명')).toBeVisible()

  await page.getByRole('button', { name: '사육팀 펼치기' }).click()
  await expect(page.getByRole('checkbox', { name: '이승현 사원' })).toBeChecked()
})

test('S10: 필수값 입력 후 생성', async ({ page }) => {
  await page.goto('/tasks/create')
  await fillValidTask(page, { title: '새로 등록한 업무' })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByTestId('task-row').first()).toContainText(
    '새로 등록한 업무',
  )
})

test('S11: 우선순위 미선택 검증', async ({ page }) => {
  await page.goto('/tasks/create')
  await fillValidTask(page, { skip: 'priority' })
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('우선순위를 선택해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/tasks\/create$/)
  expect(await mutationCount(page, 'create')).toBe(0)
})

test('S12: 완료기한 미선택 검증', async ({ page }) => {
  await page.goto('/tasks/create')
  await fillValidTask(page, { skip: 'dueDate' })
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('완료기한을 선택해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/tasks\/create$/)
})

test('S13: 담당자 미선택 검증', async ({ page }) => {
  await page.goto('/tasks/create')
  await fillValidTask(page, { skip: 'assignee' })
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('담당자를 선택해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(allEmployees(page)).toBeFocused()
})

test('S14: 제목 미입력 검증', async ({ page }) => {
  await page.goto('/tasks/create')
  await fillValidTask(page, { skip: 'title' })
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('제목을 입력해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page.getByLabel(/제목/)).toBeFocused()
  await expect(page).toHaveURL(/\/tasks\/create$/)
})

test('S15: 상세 내용 미입력 검증', async ({ page }) => {
  await page.goto('/tasks/create')
  await fillValidTask(page, { skip: 'content' })
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('상세 업무 내용을 입력해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page.getByLabel(/상세 업무 내용/)).toBeFocused()
})

test('S16: 첨부 추가·제거', async ({ page }) => {
  await page.goto('/tasks/create')
  await uploadInput(page).setInputFiles([
    filePayload('업무 지침.pdf', 'application/pdf'),
  ])

  await expect(attachmentGroup(page).getByText('업무 지침.pdf')).toBeVisible()
  await expect(page.getByRole('status')).toContainText(
    '첨부파일 등록에 성공했습니다',
  )

  const removeButton = page.locator('button[aria-label="업무 지침.pdf 삭제"]')
  await removeButton.locator('..').hover()
  await removeButton.click()

  await expect(attachmentGroup(page).getByText('업무 지침.pdf')).toHaveCount(0)
})

test('S17: 이탈 보호', async ({ page }) => {
  await page.goto('/tasks/create')
  await page.getByLabel(/제목/).fill('작성 중인 업무')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  const dialog = page.getByRole('alertdialog', {
    name: '정말 나가시겠습니까?',
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '취소' }).click()

  await expect(page).toHaveURL(/\/tasks\/create$/)
  await expect(page.getByLabel(/제목/)).toHaveValue('작성 중인 업무')
})

test('S18: 생성 중복 제출 방지', async ({ page }) => {
  await page.goto('/tasks/create')
  await delayTaskMutation(page)
  await fillValidTask(page, { title: '한 번만 등록할 업무' })

  await page.getByRole('button', { name: '생성하기' }).click()

  // 생성 중에는 버튼이 비활성이라 사용자가 다시 눌러도 제출되지 않는다.
  const pendingButton = page.getByRole('button', { name: '생성 중' })
  await expect(pendingButton).toBeDisabled()
  await pendingButton.click({ force: true })

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByText('한 번만 등록할 업무')).toHaveCount(1)
  expect(await mutationCount(page, 'create')).toBe(1)
})

test('S19: 담당자 다중 선택 결과', async ({ page }) => {
  await page.goto('/tasks/create')
  await fillValidTask(page, { team: '창고팀', title: '다중 담당자 업무' })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  const row = page.getByTestId('task-row').first()
  await expect(row).toContainText('다중 담당자 업무')
  await expect(row).toContainText('이지아')
  await expect(row).toContainText('외 2명')
})

test('S20: 키보드 조작', async ({ page }) => {
  await page.goto('/tasks/create')
  await page.getByRole('link', { name: '뒤로가기' }).focus()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('radio', { name: '상' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: '중' })).toBeChecked()

  await page.keyboard.press('Tab')
  await expect(page.getByLabel('완료기한')).toBeFocused()
  await page.getByLabel('완료기한').fill('2026-12-31')
  await page.getByLabel('완료기한').focus()

  // 완료기한에서 Tab 하면 담당자 트리의 첫 행으로 넘어간다.
  await page.keyboard.press('Tab')
  await expect(allEmployees(page)).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.getByText('18/18명')).toBeVisible()

  // 팀 행 4개(체크박스 + 펼침 버튼 = 8개)를 지나면 제목 입력이다.
  for (let index = 0; index < 9; index += 1) {
    await page.keyboard.press('Tab')
  }
  await expect(page.getByLabel(/제목/)).toBeFocused()
  await page.keyboard.type('키보드로 등록한 업무')

  await page.keyboard.press('Tab')
  await expect(page.getByLabel(/상세 업무 내용/)).toBeFocused()
  await page.keyboard.type('키보드로 입력한 상세 내용')

  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '파일 업로드' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '생성하기' })).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByTestId('task-row').first()).toContainText(
    '키보드로 등록한 업무',
  )
})

async function fillValidTask(
  page: Page,
  options: { skip?: SkippableField; title?: string; team?: string } = {},
) {
  const { skip, title = '유효한 업무', team = '사육팀' } = options

  if (skip !== 'priority') {
    await page.getByRole('radio', { name: '상' }).check()
  }
  if (skip !== 'dueDate') {
    await page.getByLabel('완료기한').fill('2026-12-31')
  }
  if (skip !== 'assignee') {
    await teamCheckbox(page, team).check()
  }
  if (skip !== 'title') {
    await page.getByLabel(/제목/).fill(title)
  }
  if (skip !== 'content') {
    await page.getByLabel(/상세 업무 내용/).fill('상세 업무 내용입니다.')
  }
}

function allEmployees(page: Page) {
  return page.getByRole('checkbox', { name: /^전체 직원/ })
}

function allEmployeesRow(page: Page) {
  return page.getByRole('treeitem').filter({ hasText: '전체 직원' })
}

function teamCheckbox(page: Page, teamName: string) {
  return page.getByRole('checkbox', { name: new RegExp(`^${teamName} `) })
}

function teamRow(page: Page, teamName: string) {
  return page
    .getByRole('treeitem')
    .filter({ has: page.getByRole('button', { name: new RegExp(teamName) }) })
}

function attachmentGroup(page: Page) {
  return page.getByRole('group', { name: '첨부파일' })
}

function uploadInput(page: Page) {
  return page.getByLabel('첨부파일 선택')
}

// mock mutation 완료를 늦춘다. 진행 중 상태가 유지돼야 재클릭을 시도할 수 있다.
async function delayTaskMutation(page: Page, ms = 1500) {
  await page.evaluate(
    ([key, value]) => {
      localStorage.setItem(key, value)
    },
    [mutationDelayStorageKey, String(ms)],
  )
}

// mock 이 기록한 요청 횟수. 저장은 두 번 실행돼도 결과가 같아 횟수로 확인한다.
async function mutationCount(page: Page, kind: 'create') {
  return page.evaluate(
    ([key, target]) => {
      const rawLog = localStorage.getItem(key)
      if (!rawLog) return 0

      const log: unknown = JSON.parse(rawLog)
      return Array.isArray(log)
        ? log.filter((entry) => entry === target).length
        : 0
    },
    [mutationLogStorageKey, kind],
  )
}

function filePayload(name: string, mimeType: string) {
  return {
    name,
    mimeType,
    buffer: Buffer.from(`fixture for ${name}`),
  }
}
