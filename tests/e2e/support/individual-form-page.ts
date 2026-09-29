import { expect, type Page } from '@playwright/test'
import { mockAnimals, type MockAnimal } from './animal-manage-api'

// 개체 등록·수정·삭제 API 시나리오가 함께 쓰는 fixture·조작.

// 개체 12 를 종 1 의 `무궁이`(암컷·2021·기타정보·사진 `animal/mugung.png`)로 바꾼 개체 목록.
export function animalFixture(): MockAnimal[] {
  return mockAnimals().map((animal) =>
    animal.id === 12
      ? {
          id: 12,
          kindId: 1,
          animalName: '무궁이',
          animalGender: 'WOMAN',
          birthYear: 2021,
          otherInfo: '온순한 성격',
          animalImage: { fileName: 'mugung.png', fileKey: 'animal/mugung.png' },
        }
      : animal,
  )
}

export function nameInput(page: Page) {
  return page.getByRole('textbox', { name: '개체명', exact: true })
}

export function birthYearInput(page: Page) {
  return page.getByRole('textbox', { name: '출생연도', exact: true })
}

export function noteInput(page: Page) {
  return page.getByRole('textbox', { name: '기타정보', exact: true })
}

export function sexRadio(page: Page, name: string) {
  return page.getByRole('radio', { name, exact: true })
}

export async function uploadPhoto(page: Page, name = 'mugung.png') {
  await page.getByLabel('사진 파일 선택').setInputFiles({
    name,
    mimeType: 'image/png',
    buffer: Buffer.from(`${name} content`),
  })
}

export function leaveDialog(page: Page) {
  return page.getByRole('alertdialog', { name: '정말 나가시겠습니까?' })
}

export async function expectFailure(page: Page, message: string) {
  await expect(
    page.getByRole('status').filter({ hasText: message }),
  ).toBeVisible()
}
