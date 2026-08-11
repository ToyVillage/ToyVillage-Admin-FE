import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(task-edit.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 localStorage mock 만 사용한다.

const deletedTaskStorageKey = 'toyvillage:tasks:deleted'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

test('S1: 목록에서 수정 화면 진입', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByTestId('task-row').first().click()
  await expect(page).toHaveURL(/\/tasks\/1$/)
})

test('S2: 기존 값 표시', async ({ page }) => {
  await page.goto('/tasks/1')

  await expect(page.getByRole('radio', { name: '상' })).toBeChecked()
  await expect(page.getByLabel('완료기한')).toHaveValue('2026-07-03')
  await expect(visibilityTrigger(page)).toContainText('전체 공개')
  await expect(assigneeTrigger(page)).toContainText('이승현 사원')
  await expect(page.getByLabel(/제목/)).toHaveValue('업무 제목')
  await expect(page.getByLabel(/상세 업무 내용/)).toHaveValue(
    '상세 업무 내용이 입력되어있음',
  )
  for (const fileName of ['당일 지침.pdf', '휴관안내.png', '휴관안내.jpg']) {
    await expect(attachmentGroup(page).getByText(fileName)).toBeVisible()
  }
})

test('S3: 제목·상세 내용 수정 후 저장', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByLabel(/제목/).fill('수정한 업무 제목')
  await page.getByLabel(/상세 업무 내용/).fill('수정한 상세 내용')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByText('수정한 업무 제목')).toHaveCount(1)
})

test('S4: 우선순위 변경 후 저장', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByRole('radio', { name: '하' }).check()
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByTestId('task-row').first()).toContainText('하')
})

test('S5: 완료기한 변경 후 저장', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByLabel('완료기한').fill('2027-03-02')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByTestId('task-row').first()).toContainText('2027-03-02')
})

test('S6: 첨부 제거와 추가', async ({ page }) => {
  await page.goto('/tasks/1')

  const removeButton = page.locator('button[aria-label="휴관안내.png 삭제"]')
  await removeButton.locator('..').hover()
  await removeButton.click()
  await expect(attachmentGroup(page).getByText('휴관안내.png')).toHaveCount(0)

  await uploadInput(page).setInputFiles([
    { name: '추가 자료.pdf', mimeType: 'application/pdf', buffer: Buffer.from('fixture') },
  ])
  await expect(attachmentGroup(page).getByText('추가 자료.pdf')).toBeVisible()
})

test('S7: 삭제 취소', async ({ page }) => {
  await page.goto('/tasks/1')
  const deleteButton = page.getByRole('button', { name: '삭제하기' })
  await deleteButton.click()

  const dialog = page.getByRole('alertdialog', {
    name: '정말 삭제하시겠습니까?',
  })
  await expect(dialog).toContainText('삭제하신 뒤에는 영구삭제되며')
  await dialog.getByRole('button', { name: '취소' }).click()

  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/tasks\/1$/)
  await expect(deleteButton).toBeFocused()
})

test('S8: 삭제 확인', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByRole('button', { name: '삭제하기' }).click()
  await page
    .getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByTestId('task-row').first()).not.toContainText(
    '2026-07-03',
  )
})

test('S9: 변경 없이 저장', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByTestId('task-row')).toHaveCount(4)
})

test('S10: 변경 없이 뒤로가기', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(
    page.getByRole('alertdialog', { name: '정말 나가시겠습니까?' }),
  ).toHaveCount(0)
})

test('S11: 제목 누락 검증과 포커스 복귀', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByLabel(/제목/).fill('')
  await page.getByRole('button', { name: '저장하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('제목을 입력해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()

  await expect(page.getByLabel(/제목/)).toBeFocused()
  await expect(page).toHaveURL(/\/tasks\/1$/)
})

test('S12: 상세 업무 내용 누락 검증', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByLabel(/상세 업무 내용/).fill('   ')
  await page.getByRole('button', { name: '저장하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('상세 업무 내용을 입력해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()

  await expect(page.getByLabel(/상세 업무 내용/)).toBeFocused()
})

test('S13: 삭제 모달 Esc 로 닫기', async ({ page }) => {
  await page.goto('/tasks/1')
  const deleteButton = page.getByRole('button', { name: '삭제하기' })
  await deleteButton.click()

  const dialog = page.getByRole('alertdialog', {
    name: '정말 삭제하시겠습니까?',
  })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')

  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/tasks\/1$/)
  await expect(deleteButton).toBeFocused()
})

test('S14: 삭제 실패 토스트', async ({ page }) => {
  await page.goto('/tasks/1')
  await expect(page.getByLabel(/제목/)).toHaveValue('업무 제목')

  await breakTask(page, '1')
  await page.getByRole('button', { name: '삭제하기' }).click()
  await page
    .getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page.getByRole('alert')).toContainText(
    '데이터 삭제에 실패했습니다',
  )
  await expect(page).toHaveURL(/\/tasks\/1$/)
})

test('S15: 저장 실패 시 입력 보존', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByLabel(/제목/).fill('보존할 업무 제목')

  await breakTask(page, '1')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks\/1$/)
  await expect(page.getByLabel(/제목/)).toHaveValue('보존할 업무 제목')
  await expect(
    page.getByText('저장하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
})

test('S16: 존재하지 않는 ID', async ({ page }) => {
  await page.goto('/tasks/does-not-exist')

  await expect(page.getByText('업무를 찾을 수 없습니다.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: '목록으로 돌아가기' }),
  ).toBeVisible()
  await expect(page.getByLabel(/제목/)).toHaveCount(0)
})

test('S17: 수정 후 이탈 보호', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByLabel(/제목/).fill('이탈을 막을 제목')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  const dialog = page.getByRole('alertdialog', {
    name: '정말 나가시겠습니까?',
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '취소' }).click()

  await expect(page).toHaveURL(/\/tasks\/1$/)
  await expect(page.getByLabel(/제목/)).toHaveValue('이탈을 막을 제목')
})

test('S18: 이탈 확인 후 이동', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByLabel(/제목/).fill('나갈 제목')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await page
    .getByRole('alertdialog', { name: '정말 나가시겠습니까?' })
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page).toHaveURL(/\/tasks$/)
})

test('S19: 저장·삭제 중 중복 제출 방지', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByLabel(/제목/).fill('한 번만 저장할 업무')

  await page.getByRole('button', { name: '저장하기' }).evaluate((button) => {
    const form = button.closest('form')
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByText('한 번만 저장할 업무')).toHaveCount(1)
  await expect(page.getByTestId('task-row')).toHaveCount(4)
})

test('S20: 키보드 전용 조작', async ({ page }) => {
  await page.goto('/tasks/1')

  const title = page.getByLabel(/제목/)
  await title.focus()
  await page.keyboard.press('Control+a')
  await page.keyboard.type('키보드로 수정한 제목')

  await page.keyboard.press('Tab')
  await expect(page.getByLabel(/상세 업무 내용/)).toBeFocused()

  const deleteButton = page.getByRole('button', { name: '삭제하기' })
  await deleteButton.focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Escape')
  await expect(deleteButton).toBeFocused()

  await page.getByRole('button', { name: '저장하기' }).focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByText('키보드로 수정한 제목')).toHaveCount(1)
})

test('S21: 업무 보고 상세조회 버튼 비활성', async ({ page }) => {
  await page.goto('/tasks/1')

  const reportButton = page.getByRole('button', { name: '업무 보고 상세조회' })
  await expect(reportButton).toBeVisible()
  await expect(reportButton).toBeDisabled()
  await expect(page).toHaveURL(/\/tasks\/1$/)
})

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

// 저장·삭제 실패를 재현한다. mock 은 대상 업무를 찾지 못하면 실패한다.
async function breakTask(page: Page, id: string) {
  await page.evaluate(
    ([key, value]) => {
      localStorage.setItem(key as string, value as string)
    },
    [deletedTaskStorageKey, JSON.stringify([id])],
  )
}
