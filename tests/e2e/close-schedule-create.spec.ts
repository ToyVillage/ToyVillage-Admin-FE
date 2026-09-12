import { expect, test } from '@playwright/test'
import { closeScheduleStorageKey } from '../../src/entities/close-schedule/model/mock'

test.beforeEach(async ({ page }) => {
  await page.goto('/notices/guide/create')
  await page.evaluate(
    (storageKey) => localStorage.removeItem(storageKey),
    closeScheduleStorageKey,
  )
  await page.reload()
})

test('S1: 생성 폼 표시', async ({ page }) => {
  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(page.getByLabel('시작일')).toBeVisible()
  await expect(page.getByLabel('종료일')).toBeVisible()
  await expect(page.getByText('연도. 월. 일')).toHaveCount(2)
  await expect(page.getByLabel(/제목/)).toBeVisible()
  await expect(page.getByRole('button', { name: '생성하기' })).toBeVisible()
})

test('S2: 목록으로 돌아가기', async ({ page }) => {
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/notices\/guide$/)
})

test('S3: 날짜 필수 검증', async ({ page }) => {
  await page.getByRole('button', { name: '생성하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('휴관일을 입력해 주세요')
  await expect(dialog.getByRole('button', { name: '확인' })).toBeFocused()
})

test('S4: 제목 필수 검증', async ({ page }) => {
  await page.getByLabel('시작일').fill('2026-07-18')
  await page.getByLabel('종료일').fill('2026-07-19')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page.getByRole('alertdialog')).toContainText(
    '제목을 입력해 주세요',
  )
})

test('S5: 오류 확인 후 첫 오류 입력으로 포커스 복귀', async ({ page }) => {
  await page.getByRole('button', { name: '생성하기' }).click()
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(page.getByLabel('시작일')).toBeFocused()
})

test('S6: 종료일이 시작일보다 빠르면 생성하지 않는다', async ({ page }) => {
  await page.getByLabel('시작일').fill('2026-07-19')
  await page.getByLabel('종료일').fill('2026-07-18')
  await page.getByLabel(/제목/).fill('날짜 순서 오류')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/notices\/guide\/create$/)
  await expect(page.getByRole('alertdialog')).toContainText(
    '종료일은 시작일과 같거나 이후여야 합니다',
  )
  await expect
    .poll(() =>
      page.evaluate(
        (key) => localStorage.getItem(key),
        closeScheduleStorageKey,
      ),
    )
    .toBeNull()
})

test('S7: 유효한 값으로 생성하면 목록에서 확인할 수 있다', async ({ page }) => {
  const targetDate = currentMonthDate()
  await page.getByLabel('시작일').fill(targetDate)
  await page.getByLabel('종료일').fill(targetDate)
  await page.getByLabel(/제목/).fill('새 휴관 일정')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/notices\/guide$/)
  await expect(page.getByText('새 휴관 일정')).toHaveCount(1)
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const value = localStorage.getItem(key)
        return value ? JSON.parse(value).length : 0
      }, closeScheduleStorageKey),
    )
    .toBe(1)
})

test('S8: 저장 실패 시 입력을 보존하고 재시도할 수 있다', async ({ page }) => {
  await page.evaluate((storageKey) => {
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function setItem(key, value) {
      if (key === storageKey) throw new DOMException('저장 실패')
      originalSetItem.call(this, key, value)
    }
  }, closeScheduleStorageKey)

  await page.getByLabel('시작일').fill('2026-07-18')
  await page.getByLabel('종료일').fill('2026-07-19')
  await page.getByLabel(/제목/).fill('보존할 휴관 일정')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/notices\/guide\/create$/)
  await expect(page.getByLabel('시작일')).toHaveValue('2026-07-18')
  await expect(page.getByLabel('종료일')).toHaveValue('2026-07-19')
  await expect(page.getByLabel(/제목/)).toHaveValue('보존할 휴관 일정')
  await expect(page.getByRole('button', { name: '생성하기' })).toBeEnabled()
})

test('S9: 키보드로 주요 컨트롤과 오류 확인에 접근한다', async ({ page }) => {
  const backLink = page.getByRole('link', { name: '뒤로가기' })
  await backLink.focus()
  await expect(backLink).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(page.getByLabel('시작일')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('종료일')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel(/제목/)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '생성하기' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: '확인' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('시작일')).toBeFocused()
})

function currentMonthDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-18`
}
