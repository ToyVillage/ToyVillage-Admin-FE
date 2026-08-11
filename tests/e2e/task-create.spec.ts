import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(task-create.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 localStorage mock 만 사용한다.

const mutationDelayStorageKey = 'toyvillage:tasks:mutation-delay'
const mutationLogStorageKey = 'toyvillage:tasks:mutation-log'

type SkippableField =
  | 'priority'
  | 'dueDate'
  | 'visibility'
  | 'assignee'
  | 'title'
  | 'content'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
  await page.goto('/tasks/create')
})

test('S1: 생성 화면 진입 기본 상태', async ({ page }) => {
  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(page.getByRole('radio', { name: '상' })).not.toBeChecked()
  await expect(page.getByRole('radio', { name: '중' })).not.toBeChecked()
  await expect(page.getByRole('radio', { name: '하' })).not.toBeChecked()
  await expect(page.getByLabel('완료기한')).toHaveValue('')
  await expect(visibilityTrigger(page)).toContainText('전체 직원')
  await expect(assigneeTrigger(page)).toContainText('직원 목록에서 선택')
  await expect(page.getByLabel(/제목/)).toHaveValue('')
  await expect(page.getByLabel(/상세 업무 내용/)).toHaveValue('')
  await expect(page.getByRole('button', { name: '생성하기' })).toBeVisible()
  await expect(page.getByRole('button', { name: '삭제하기' })).toHaveCount(0)
})

test('S2: 우선순위 단일 선택', async ({ page }) => {
  await page.getByRole('radio', { name: '중' }).check()

  await expect(page.getByRole('radio', { name: '중' })).toBeChecked()
  await expect(page.getByRole('radio', { name: '상' })).not.toBeChecked()
  await expect(page.getByRole('radio', { name: '하' })).not.toBeChecked()
})

test('S3: 완료기한 선택', async ({ page }) => {
  await page.getByLabel('완료기한').fill('2026-12-31')
  await expect(page.getByLabel('완료기한')).toHaveValue('2026-12-31')

  // 포커스가 있는 동안에는 네이티브 입력이 보이므로, 포커스를 옮긴 뒤 표기를 확인한다.
  await page.getByLabel(/제목/).focus()
  await expect(page.getByText('2026. 12. 31')).toBeVisible()
})

test('S4: 공개범위 선택', async ({ page }) => {
  await visibilityTrigger(page).click()
  await page.getByRole('option', { name: '팀이름 1' }).click()

  await expect(page.getByRole('listbox')).toHaveCount(0)
  await expect(visibilityTrigger(page)).toContainText('팀이름 1')
})

test('S5: 담당자 선택', async ({ page }) => {
  await assigneeTrigger(page).click()
  await page.getByRole('option', { name: '김수인 사원' }).click()

  await expect(page.getByRole('listbox')).toHaveCount(0)
  await expect(assigneeTrigger(page)).toContainText('김수인 사원')
})

test('S6: 제목·상세 내용 입력', async ({ page }) => {
  await page.getByLabel(/제목/).fill('업무 제목 입력')
  await page.getByLabel(/상세 업무 내용/).fill('상세 업무 내용 입력')

  await expect(page.getByLabel(/제목/)).toHaveValue('업무 제목 입력')
  await expect(page.getByLabel(/상세 업무 내용/)).toHaveValue(
    '상세 업무 내용 입력',
  )
})

test('S7: 첨부 추가', async ({ page }) => {
  await uploadInput(page).setInputFiles([
    filePayload('업무 지침.pdf', 'application/pdf'),
  ])

  await expect(attachmentGroup(page).getByText('업무 지침.pdf')).toBeVisible()
  await expect(page.getByRole('status')).toContainText(
    '첨부파일 등록에 성공했습니다',
  )
})

test('S8: 첨부 제거', async ({ page }) => {
  await uploadInput(page).setInputFiles([
    filePayload('삭제할 파일.txt', 'text/plain'),
  ])

  const removeButton = page.locator('button[aria-label="삭제할 파일.txt 삭제"]')
  await removeButton.locator('..').hover()
  await removeButton.click()

  await expect(attachmentGroup(page).getByText('삭제할 파일.txt')).toHaveCount(
    0,
  )
})

test('S9: 정상 생성', async ({ page }) => {
  await fillValidTask(page, { title: '새로 등록한 업무' })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByTestId('task-row').first()).toContainText(
    '새로 등록한 업무',
  )
})

test('S10: 뒤로가기 (변경 없음)', async ({ page }) => {
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(
    page.getByRole('alertdialog', { name: '정말 나가시겠습니까?' }),
  ).toHaveCount(0)
})

test('S11: 우선순위 미선택 검증', async ({ page }) => {
  await fillValidTask(page, { skip: 'priority' })
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('우선순위를 선택해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/tasks\/create$/)
})

test('S12: 완료기한 미선택 검증', async ({ page }) => {
  await fillValidTask(page, { skip: 'dueDate' })
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('완료기한을 선택해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/tasks\/create$/)
})

test('S13: 공개범위 미선택 검증', async ({ page }) => {
  await fillValidTask(page, { skip: 'visibility' })
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('공개범위를 선택해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(visibilityTrigger(page)).toBeFocused()
})

test('S14: 담당자 미선택 검증', async ({ page }) => {
  await fillValidTask(page, { skip: 'assignee' })
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('담당자를 선택해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(assigneeTrigger(page)).toBeFocused()
})

test('S15: 제목 누락 검증과 포커스 복귀', async ({ page }) => {
  await fillValidTask(page, { skip: 'title' })
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('제목을 입력해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page.getByLabel(/제목/)).toBeFocused()
  await expect(page).toHaveURL(/\/tasks\/create$/)
})

test('S16: 상세 업무 내용 누락 검증', async ({ page }) => {
  await fillValidTask(page, { skip: 'content' })
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('상세 업무 내용을 입력해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page.getByLabel(/상세 업무 내용/)).toBeFocused()
})

test('S17: 드롭다운 Esc 로 닫기', async ({ page }) => {
  await visibilityTrigger(page).click()
  await expect(page.getByRole('listbox')).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(page.getByRole('listbox')).toHaveCount(0)
  await expect(visibilityTrigger(page)).toContainText('전체 직원')
  await expect(visibilityTrigger(page)).toBeFocused()
})

test('S18: 드롭다운 바깥 클릭으로 닫기', async ({ page }) => {
  await assigneeTrigger(page).click()
  await expect(page.getByRole('listbox')).toBeVisible()

  await page.locator('body').click({ position: { x: 5, y: 5 } })

  await expect(page.getByRole('listbox')).toHaveCount(0)
  await expect(assigneeTrigger(page)).toContainText('직원 목록에서 선택')
})

test('S19: 50MB 초과 파일 거부', async ({ page }) => {
  await uploadInput(page).evaluate((input) => {
    const oversizedFile = new File(['oversized'], '초과 파일.zip', {
      type: 'application/zip',
    })
    Object.defineProperty(oversizedFile, 'size', {
      value: 50 * 1024 * 1024 + 1,
    })

    const files = new DataTransfer()
    files.items.add(oversizedFile)
    input.files = files.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })

  await expect(
    page.getByRole('button', { name: '초과 파일.zip 삭제' }),
  ).toHaveCount(0)
  await expect(
    page.getByText('초과 파일.zip은 50MB를 초과해 첨부할 수 없습니다.'),
  ).toBeVisible()
})

test('S20: 입력 후 이탈 보호', async ({ page }) => {
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

test('S21: 이탈 확인 후 이동', async ({ page }) => {
  await page.getByLabel(/제목/).fill('나갈 업무')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await page
    .getByRole('alertdialog', { name: '정말 나가시겠습니까?' })
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page).toHaveURL(/\/tasks$/)
})

test('S22: 생성 중 중복 제출 방지', async ({ page }) => {
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

test('S23: 키보드 전용 조작', async ({ page }) => {
  await page.getByRole('link', { name: '뒤로가기' }).focus()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('radio', { name: '상' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: '중' })).toBeChecked()

  await page.keyboard.press('Tab')
  await expect(page.getByLabel('완료기한')).toBeFocused()
  await page.getByLabel('완료기한').fill('2026-12-31')

  await page.getByLabel('완료기한').focus()
  await page.keyboard.press('Tab')
  await expect(visibilityTrigger(page)).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(visibilityTrigger(page)).toContainText('전체 직원')
  await expect(visibilityTrigger(page)).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(assigneeTrigger(page)).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(assigneeTrigger(page)).toContainText('이승현 사원')
  await expect(assigneeTrigger(page)).toBeFocused()

  await page.keyboard.press('Tab')
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
  options: { skip?: SkippableField; title?: string } = {},
) {
  const { skip, title = '유효한 업무' } = options

  if (skip !== 'priority') {
    await page.getByRole('radio', { name: '상' }).check()
  }
  if (skip !== 'dueDate') {
    await page.getByLabel('완료기한').fill('2026-12-31')
  }
  if (skip !== 'visibility') {
    await visibilityTrigger(page).click()
    await page.getByRole('option', { name: '전체 직원' }).click()
  }
  if (skip !== 'assignee') {
    await assigneeTrigger(page).click()
    await page.getByRole('option', { name: '이승현 사원' }).click()
  }
  if (skip !== 'title') {
    await page.getByLabel(/제목/).fill(title)
  }
  if (skip !== 'content') {
    await page.getByLabel(/상세 업무 내용/).fill('상세 업무 내용입니다.')
  }
}

function visibilityTrigger(page: Page) {
  return page.getByRole('button', { name: '공개범위를 선택해주세요' })
}

function assigneeTrigger(page: Page) {
  return page.getByRole('button', { name: '담당자를 선택해주세요' })
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

// mock 이 기록한 요청 횟수. 저장·삭제는 두 번 실행돼도 결과가 같아 횟수로 확인한다.
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
