import { test, expect } from '@playwright/test'

// 승인된 시나리오(notice-edit.approved.json: S1~S12)를 변환한 것.
// 승인 후에는 시나리오를 재도출하지 않고 실패 시 프로덕션 코드를 수정한다.

test('S1: 공지 행 클릭 → 수정 URL 이동', async ({ page }) => {
  await page.goto('/notices/list')
  await page.getByTestId('notice-row').first().click()
  await expect(page).toHaveURL(/\/notices\/list\/1$/)
})

test('S2: 기존 제목·내용·첨부 복원', async ({ page }) => {
  await page.goto('/notices/list/1')

  await expect(page.getByLabel('제목')).toHaveValue('7월 13일 휴관안내')
  await expect(page.getByLabel('내용')).toContainText('그냥 더미 텍스트')
  await expect(page.getByRole('radio', { name: '전체' })).toBeChecked()
  await expect(page.getByRole('radio')).toHaveCount(1)
  await expect(page.getByRole('button', { name: '팀 추가' })).toBeVisible()
  await expect(page.getByText('당일 지침.pdf')).toBeVisible()
  await expect(page.getByText('휴관안내.png')).toBeVisible()
  await expect(page.getByText('휴관안내.jpg')).toBeVisible()
})

test('S3: 수정 저장 → 목록에 같은 ID 수정값 반영', async ({ page }) => {
  await page.goto('/notices/list/1')
  await page.getByLabel('제목').fill('수정된 휴관 안내')
  await page.getByLabel('내용').fill('수정된 공지 내용입니다.')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/notices\/list$/)
  await expect(page.getByText('수정된 휴관 안내', { exact: true })).toHaveCount(
    1,
  )
})

test('S4: 빈 제목 → 오류 확인 후 제목 포커스', async ({ page }) => {
  await page.goto('/notices/list/1')
  const title = page.getByLabel('제목')
  await title.fill('   ')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(
    page.getByRole('alertdialog', { name: '제목을 입력해 주세요' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '확인' }).click()
  await expect(title).toBeFocused()
})

test('S5: 빈 내용 → 오류 확인 후 내용 포커스', async ({ page }) => {
  await page.goto('/notices/list/1')
  const content = page.getByLabel('내용')
  await content.fill('   ')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(
    page.getByRole('alertdialog', { name: '내용을 입력해 주세요' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '확인' }).click()
  await expect(content).toBeFocused()
})

test('S6: 기존 첨부 제거와 새 파일 추가', async ({ page }) => {
  await page.goto('/notices/list/1')
  const removeButton = page.getByRole('button', {
    name: '당일 지침.pdf 삭제',
  })
  await removeButton.focus()
  await removeButton.press('Enter')
  await expect(page.getByText('당일 지침.pdf')).toHaveCount(0)

  await page.getByLabel('첨부파일 선택').setInputFiles({
    name: '새 안내.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('notice'),
  })
  await expect(page.getByText('새 안내.pdf')).toBeVisible()
})

test('S7: 삭제 취소 → 화면 유지와 포커스 복귀', async ({ page }) => {
  await page.goto('/notices/list/1')
  const deleteButton = page.getByRole('button', { name: '삭제하기' })
  await deleteButton.click()
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page).toHaveURL(/\/notices\/list\/1$/)
  await expect(deleteButton).toBeFocused()
})

test('S8: 삭제 확인 → 목록에서 제거', async ({ page }) => {
  await page.goto('/notices/list/1')
  await page.getByRole('button', { name: '삭제하기' }).click()
  await page.getByRole('button', { name: '확인', exact: true }).click()

  await expect(page).toHaveURL(/\/notices\/list$/)
  await expect(
    page.getByText('7월 13일 휴관안내', { exact: true }),
  ).toHaveCount(0)
})

test('S9: 존재하지 않는 공지 → 복구 UI', async ({ page }) => {
  await page.goto('/notices/list/missing')
  await expect(
    page.getByRole('heading', { name: '공지사항을 찾을 수 없습니다.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: '공지사항 목록으로 돌아가기' }),
  ).toHaveAttribute('href', '/notices/list')
})

test('S10: 수정 중 사이드바 이동 → 이탈 확인', async ({ page }) => {
  await page.goto('/notices/list/1')
  await page.getByLabel('제목').fill('저장 전 제목')
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  // `/notices/list/*` 는 `공지사항` 대분류라 사이드바를 열면 이미 펼쳐져 있다.
  await page.getByRole('link', { name: '자료실', exact: true }).click()

  await expect(
    page.getByRole('alertdialog', { name: '정말 나가시겠습니까?' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/list\/1$/)
})

test('S11: 저장 더블클릭 → 동일 ID 한 건만 저장', async ({ page }) => {
  await page.goto('/notices/list/1')
  await page.getByLabel('제목').fill('중복 없는 수정')
  await page.getByRole('button', { name: '저장하기' }).dblclick()
  await expect(page).toHaveURL(/\/notices\/list$/)

  const savedCount = await page.evaluate(() => {
    const raw = localStorage.getItem('toyvillage:notices')
    if (!raw) return 0
    const notices = JSON.parse(raw) as Array<{ id?: string }>
    return notices.filter((notice) => notice.id === '1').length
  })
  expect(savedCount).toBe(1)
})

test('S12: 키보드로 편집과 삭제 취소', async ({ page }) => {
  await page.goto('/notices/list/1')
  const title = page.getByLabel('제목')
  await title.focus()
  await title.fill('키보드 수정 공지')
  await page.getByRole('button', { name: '삭제하기' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: '취소' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '삭제하기' })).toBeFocused()
})

test('수정에서도 팀을 추가하면 전체가 사라지고 여러 팀을 유지한다', async ({
  page,
}) => {
  await page.goto('/notices/list/1')

  await addTeam(page, '기획팀')
  await expect(page.getByRole('radio', { name: '전체' })).toHaveCount(0)
  await expect(page.getByRole('radio', { name: '기획팀' })).toBeChecked()

  await addTeam(page, '운영팀')
  await expect(page.getByRole('radio', { name: '기획팀' })).toBeVisible()
  await expect(page.getByRole('radio', { name: '운영팀' })).toBeChecked()

  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page).toHaveURL(/\/notices\/list$/)
})

test('수정에서 마지막 팀을 삭제하면 전체 분류로 돌아간다', async ({ page }) => {
  await page.goto('/notices/list/2')

  await expect(page.getByRole('radio', { name: '팀 이름1' })).toBeChecked()
  await expect(page.getByRole('radio')).toHaveCount(1)
  const removeButton = page.getByRole('button', { name: '팀 이름1 삭제' })
  await removeButton.locator('..').hover()
  await removeButton.click()

  await expect(page.getByRole('radio', { name: '전체' })).toBeChecked()
  await expect(page.getByRole('radio')).toHaveCount(1)
})

async function addTeam(
  page: import('@playwright/test').Page,
  teamName: string,
) {
  await page.getByRole('button', { name: '팀 추가' }).click()
  const dialog = page.getByRole('dialog', { name: '팀 추가하기' })
  await dialog.getByRole('textbox', { name: '팀 이름' }).fill(teamName)
  await dialog.getByRole('button', { name: '다음' }).click()
}
