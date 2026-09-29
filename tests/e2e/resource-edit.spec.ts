import { test, expect } from '@playwright/test'
import { mockDocumentApi, type DocumentApiHandle } from './support/document-api'

// 승인된 시나리오(resource-edit.approved.json: S1~S11)를 변환한 것.
// 승인 후에는 시나리오를 재도출하지 않고 실패 시 프로덕션 코드를 수정한다.
// 자료실 API 는 page.route mock(`support/document-api`)을 쓴다. 실제 서버는 호출하지 않는다.

let api: DocumentApiHandle

test.beforeEach(async ({ page }) => {
  api = await mockDocumentApi(page)
})

test('S1: 목록 케밥 `수정` → 수정 URL 이동', async ({ page }) => {
  await page.goto('/notices/resources')
  await page
    .getByRole('button', { name: '근무지침요령 1 관리 메뉴' })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/notices\/resources\/1\/edit$/)
})

test('S2: 기존 제목·분류·첨부 복원', async ({ page }) => {
  await page.goto('/notices/resources/1/edit')

  await expect(page.getByLabel(/제목/)).toHaveValue('근무지침요령 1')
  await expect(page.getByRole('radio', { name: 'pdf' })).toBeChecked()
  await expect(page.getByText('당일 지침.pdf')).toBeVisible()
  await expect(page.getByText('휴관안내.png')).toBeVisible()
  await expect(page.getByText('휴관안내.jpg')).toBeVisible()
})

test('S3: 수정 저장 → 목록에 같은 ID 수정값 반영', async ({ page }) => {
  await page.goto('/notices/resources/1/edit')
  await page.getByLabel(/제목/).fill('수정된 근무지침')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/notices\/resources$/)
  await expect(
    page.getByTestId('resource-row').filter({ hasText: '수정된 근무지침' }),
  ).toHaveCount(1)
  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
})

test('S4: 빈 제목 → 오류 확인 후 제목 포커스', async ({ page }) => {
  await page.goto('/notices/resources/1/edit')
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
  await page.goto('/notices/resources/1/edit')
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

test('S6: 목록 케밥 삭제 취소 → 목록 유지와 포커스 복귀', async ({ page }) => {
  await page.goto('/notices/resources')
  const kebab = page.getByRole('button', { name: '근무지침요령 1 관리 메뉴' })
  await kebab.click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page).toHaveURL(/\/notices\/resources$/)
  await expect(kebab).toBeFocused()
})

test('S7: 목록 케밥 삭제 확인 → 행 제거와 성공 토스트', async ({ page }) => {
  await page.goto('/notices/resources')
  await page.getByRole('button', { name: '근무지침요령 1 관리 메뉴' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByRole('button', { name: '확인', exact: true }).click()

  await expect(
    page.getByTestId('resource-row').filter({ hasText: '근무지침요령 1' }),
  ).toHaveCount(0)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()

  // 지워진 자료의 상세로 직접 들어가면 안내 화면 없이 목록으로 되돌린다.
  await page.goto('/notices/resources/1')
  await expect(page).toHaveURL(/\/notices\/resources$/)
  expect(api.deleteRequests).toEqual([1])
})

test('S8: 존재하지 않는 자료 → 목록으로 복귀', async ({ page }) => {
  await page.goto('/notices/resources/missing')
  await expect(page).toHaveURL(/\/notices\/resources$/)
  await expect(
    page.getByRole('heading', { name: '자료실', exact: true }),
  ).toBeVisible()
})

test('S9: 수정 중 사이드바 이동 → 이탈 확인', async ({ page }) => {
  await page.goto('/notices/resources/1/edit')
  await page.getByLabel(/제목/).fill('저장 전 제목')
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  // `/notices/resources/*` 는 `공지사항` 대분류라 사이드바를 열면 이미 펼쳐져 있다.
  await page.getByRole('link', { name: '공지사항', exact: true }).click()

  await expect(
    page.getByRole('alertdialog', { name: '정말 나가시겠습니까?' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/resources\/1\/edit$/)
})

test('S10: 저장 더블클릭 → 동일 ID 한 건만 저장', async ({ page }) => {
  await page.goto('/notices/resources/1/edit')
  await page.getByLabel(/제목/).fill('중복 없는 수정')
  await page.getByRole('button', { name: '저장하기' }).dblclick()
  await expect(page).toHaveURL(/\/notices\/resources$/)

  expect(api.updateRequests.map(({ id }) => id)).toEqual([1])
})

test('S11: 저장 실패는 예외 모달로 알리고 화면과 입력을 유지한다', async ({ page }) => {
  // 저장·삭제 실패 주입. 나중에 등록한 route 가 먼저 매칭된다.
  await mockDocumentApi(page, { updateStatus: 500, deleteStatus: 500 })
  await page.goto('/notices/resources/1/edit')

  await page.getByLabel(/제목/).fill('실패할 수정')
  await page.getByRole('button', { name: '저장하기' }).click()

  const saveDialog = page.getByRole('alertdialog', {
    name: '저장에 실패하였습니다',
  })
  await expect(saveDialog).toBeVisible()
  await saveDialog.getByRole('button', { name: '확인' }).click()
  await expect(saveDialog).toBeHidden()
  await expect(page).toHaveURL(/\/notices\/resources\/1\/edit$/)
  await expect(page.getByLabel(/제목/)).toHaveValue('실패할 수정')

})

test('S12: 목록 삭제 실패는 토스트로 알리고 목록을 유지한다', async ({
  page,
}) => {
  await mockDocumentApi(page, { deleteStatus: 500 })
  await page.goto('/notices/resources')
  await page.getByRole('button', { name: '근무지침요령 1 관리 메뉴' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByRole('button', { name: '확인', exact: true }).click()

  // 삭제 실패는 토스트로 알린다(Figma `자료실 · 토스트` 1:7192).
  await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/resources$/)
  await expect(
    page.getByTestId('resource-row').filter({ hasText: '근무지침요령 1' }),
  ).toHaveCount(1)
})
