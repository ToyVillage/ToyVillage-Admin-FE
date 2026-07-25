import { expect, test } from '@playwright/test'
import { resourceStorageKey } from '../../src/entities/resource/model/mock'

// 승인된 시나리오(resource-create.approved.json: S1~S8)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.

test.beforeEach(async ({ page }) => {
  await page.goto('/notices/resources/create')
  await page.evaluate(
    (storageKey) => localStorage.removeItem(storageKey),
    resourceStorageKey,
  )
  await page.reload()
})

test('S1: 생성 폼 표시', async ({ page }) => {
  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(page.getByLabel(/제목/)).toBeVisible()
  await expect(page.getByRole('group', { name: /분류/ })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'pdf' })).toBeChecked()
  await expect(page.getByRole('button', { name: '파일 업로드' })).toBeVisible()
  await expect(page.getByRole('button', { name: '생성하기' })).toBeVisible()
  await expect(page.getByText('첨부자료')).toHaveCount(0)
})

test('S2: 뒤로가기 → /notices/resources 이동', async ({ page }) => {
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/notices\/resources$/)
})

test('S3: 제목 미입력 생성 → 검증 모달', async ({ page }) => {
  await page.getByRole('button', { name: '생성하기' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('제목을 입력해 주세요')
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(dialog).toBeHidden()
})

test('S4: 자료 생성 후 목록 반영', async ({ page }) => {
  await page.getByLabel(/제목/).fill('테스트 자료 문서')
  await page.getByRole('radio', { name: 'png' }).check({ force: true })
  await page.setInputFiles('#resource-files', {
    name: '시설 안내도.png',
    mimeType: 'image/png',
    buffer: Buffer.from('png'),
  })
  await page.getByRole('button', { name: '생성하기' }).click()
  await expect(page).toHaveURL(/\/notices\/resources$/)
  const firstRow = page.getByTestId('resource-row').first()
  await expect(firstRow).toContainText('테스트 자료 문서')
  await expect(firstRow).toContainText('png')
})

test('S5: 다중 파일 업로드 → 첨부자료 칩', async ({ page }) => {
  await page.setInputFiles('#resource-files', [
    { name: '당일 지침.pdf', mimeType: 'application/pdf', buffer: Buffer.from('pdf') },
    { name: '휴관안내.png', mimeType: 'image/png', buffer: Buffer.from('png') },
  ])
  await expect(page.getByText('첨부자료')).toBeVisible()
  await expect(page.getByText('당일 지침.pdf')).toBeVisible()
  await expect(page.getByText('휴관안내.png')).toBeVisible()
})

test('S6: 첨부 파일 삭제 → 칩 제거', async ({ page }) => {
  await page.setInputFiles('#resource-files', [
    { name: '당일 지침.pdf', mimeType: 'application/pdf', buffer: Buffer.from('pdf') },
    { name: '휴관안내.png', mimeType: 'image/png', buffer: Buffer.from('png') },
  ])
  await page.getByText('당일 지침.pdf').hover()
  await page.getByRole('button', { name: '당일 지침.pdf 삭제' }).click()
  await expect(page.getByText('당일 지침.pdf')).toHaveCount(0)
  await expect(page.getByText('휴관안내.png')).toBeVisible()
})

test('S7: 작성 중 뒤로가기 → 이탈 확인 모달(취소)', async ({ page }) => {
  await page.getByLabel(/제목/).fill('작성 중인 자료')
  await page.getByRole('link', { name: '뒤로가기' }).click()
  const dialog = page.getByRole('alertdialog', { name: '정말 나가시겠습니까?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '취소' }).click()
  await expect(page).toHaveURL(/\/notices\/resources\/create$/)
})

test('S8: 첨부 미입력 생성 → 검증 모달', async ({ page }) => {
  await page.getByLabel(/제목/).fill('첨부 없는 자료')
  await page.getByRole('button', { name: '생성하기' }).click()
  const dialog = page.getByRole('alertdialog', {
    name: '이미지 또는 파일을 추가해주세요',
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('button', { name: '파일 업로드' })).toBeFocused()
})
