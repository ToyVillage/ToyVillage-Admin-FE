import { expect, type Page } from '@playwright/test'
import type { MockLegalStatus } from './animal-manage-api'

// 종 등록·수정 화면 API 시나리오가 함께 쓰는 조작·locator.

// 법정지정분류 API 시나리오의 기본 공용 목록(기본 선택지 `천연기념물` + 직접 추가 `국제보호종`).
export function legalStatusFixture(): MockLegalStatus[] {
  return [
    { id: 1, kind: '천연기념물' },
    { id: 5, kind: '국제보호종' },
  ]
}

export function textbox(page: Page, name: string) {
  return page.getByRole('textbox', { name, exact: true })
}

export function legalGroup(page: Page) {
  return page.getByRole('group', { name: '법정지정분류' })
}

export function legalPill(page: Page, name: string) {
  return legalGroup(page).getByRole('button', { name, exact: true })
}

export function legalRemoveButton(page: Page, name: string) {
  return page.getByRole('button', { name: `${name} 삭제`, exact: true })
}

export function addLegalButton(page: Page) {
  return page.getByRole('button', { name: '법정분류 추가', exact: true })
}

export function addLegalDialog(page: Page) {
  return page.getByRole('dialog', { name: '법정분류 추가' })
}

export function deleteDialog(page: Page) {
  return page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
}

export async function uploadPhoto(page: Page, name = 'new.png') {
  await page.getByLabel('사진 파일 선택').setInputFiles({
    name,
    mimeType: 'image/png',
    buffer: Buffer.from(`${name} content`),
  })
}

// 필수값(국명·영문명·학명·사진)을 채운다. 분류군은 기본 `포유류` 다.
export async function fillRequired(page: Page) {
  await textbox(page, '국명').fill('카피바라')
  await textbox(page, '영문명').fill('Capybara')
  await textbox(page, '학명').fill('Hydrochoerus hydrochaeris')
  await uploadPhoto(page)
}

export function submitButton(page: Page, label = '생성하기') {
  return page.getByRole('button', { name: label })
}

export async function expectSubmitFailure(page: Page, message: string) {
  await expect(
    page.getByRole('status').filter({ hasText: message }),
  ).toBeVisible()
}
