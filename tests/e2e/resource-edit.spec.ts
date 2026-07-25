import { test, expect } from '@playwright/test'

// 승인된 시나리오(resource-edit.approved.json: S1~S11)를 변환한 것.
// 승인 후에는 시나리오를 재도출하지 않고 실패 시 프로덕션 코드를 수정한다.

test('S1: 자료 행 클릭 → 수정 URL 이동', async ({ page }) => {
  await page.goto('/notices/resources')
  await page
    .getByTestId('resource-row')
    .filter({ hasText: '근무지침요령 1' })
    .first()
    .click()
  await expect(page).toHaveURL(/\/notices\/resources\/1$/)
})

test('S2: 기존 제목·분류·첨부 복원', async ({ page }) => {
  await page.goto('/notices/resources/1')

  await expect(page.getByLabel(/제목/)).toHaveValue('근무지침요령 1')
  await expect(page.getByRole('radio', { name: 'pdf' })).toBeChecked()
  await expect(page.getByText('당일 지침.pdf')).toBeVisible()
  await expect(page.getByText('휴관안내.png')).toBeVisible()
  await expect(page.getByText('휴관안내.jpg')).toBeVisible()
})

test('S3: 수정 저장 → 목록에 같은 ID 수정값 반영', async ({ page }) => {
  await page.goto('/notices/resources/1')
  await page.getByLabel(/제목/).fill('수정된 근무지침')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/notices\/resources$/)
  await expect(
    page.getByTestId('resource-row').filter({ hasText: '수정된 근무지침' }),
  ).toHaveCount(1)
})

test('S4: 빈 제목 → 오류 확인 후 제목 포커스', async ({ page }) => {
  await page.goto('/notices/resources/1')
  const title = page.getByLabel(/제목/)
  await title.fill('   ')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(
    page.getByRole('alertdialog', { name: '제목을 입력해 주세요' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '확인' }).click()
  await expect(title).toBeFocused()
})

test('S5: 기존 첨부 제거와 새 파일 추가', async ({ page }) => {
  await page.goto('/notices/resources/1')
  await page.getByText('당일 지침.pdf').hover()
  await page.getByRole('button', { name: '당일 지침.pdf 삭제' }).click()
  await expect(page.getByText('당일 지침.pdf')).toHaveCount(0)

  await page.setInputFiles('#resource-files', {
    name: '새 자료.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('resource'),
  })
  await expect(page.getByText('새 자료.pdf')).toBeVisible()
})

test('S6: 삭제 취소 → 화면 유지와 포커스 복귀', async ({ page }) => {
  await page.goto('/notices/resources/1')
  const deleteButton = page.getByRole('button', { name: '삭제하기' })
  await deleteButton.click()
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page).toHaveURL(/\/notices\/resources\/1$/)
  await expect(deleteButton).toBeFocused()
})

test('S7: 삭제 확인 → 목록에서 제거', async ({ page }) => {
  await page.goto('/notices/resources/1')
  await page.getByRole('button', { name: '삭제하기' }).click()
  await page.getByRole('button', { name: '확인', exact: true }).click()

  await expect(page).toHaveURL(/\/notices\/resources$/)
  await expect(
    page.getByTestId('resource-row').filter({ hasText: '근무지침요령 1' }),
  ).toHaveCount(0)
})

test('S8: 존재하지 않는 자료 → 복구 UI', async ({ page }) => {
  await page.goto('/notices/resources/missing')
  await expect(
    page.getByRole('heading', { name: '자료를 찾을 수 없습니다.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: '자료실 목록으로 돌아가기' }),
  ).toHaveAttribute('href', '/notices/resources')
})

test('S9: 수정 중 사이드바 이동 → 이탈 확인', async ({ page }) => {
  await page.goto('/notices/resources/1')
  await page.getByLabel(/제목/).fill('저장 전 제목')
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await page.getByRole('link', { name: '공지사항 바로가기' }).click()

  await expect(
    page.getByRole('alertdialog', { name: '정말 나가시겠습니까?' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/resources\/1$/)
})

test('S10: 저장 더블클릭 → 동일 ID 한 건만 저장', async ({ page }) => {
  await page.goto('/notices/resources/1')
  await page.getByLabel(/제목/).fill('중복 없는 수정')
  await page.getByRole('button', { name: '저장하기' }).dblclick()
  await expect(page).toHaveURL(/\/notices\/resources$/)

  const savedCount = await page.evaluate(() => {
    const raw = localStorage.getItem('toyvillage:resources')
    if (!raw) return 0
    const resources = JSON.parse(raw) as Array<{ id?: string }>
    return resources.filter((resource) => resource.id === '1').length
  })
  expect(savedCount).toBe(1)
})

test('S11: 저장 실패 → 예외 모달 표시 후 화면 유지', async ({ page }) => {
  await page.goto('/notices/resources/1')
  await page.evaluate(() =>
    localStorage.setItem('toyvillage:resources:fail', 'update'),
  )
  await page.getByLabel(/제목/).fill('실패할 수정')
  await page.getByRole('button', { name: '저장하기' }).click()

  const dialog = page.getByRole('alertdialog', {
    name: '저장하지 못했습니다.',
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/notices\/resources\/1$/)
  await expect(page.getByLabel(/제목/)).toHaveValue('실패할 수정')
})
