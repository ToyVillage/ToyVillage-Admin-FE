import { expect, test, type Locator, type Page } from '@playwright/test'

// 승인된 시나리오(individual-form.approved.json: S1~S29, S25 삭제)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 개체 mock 은 localStorage(`toyvillage:individuals`, 실패 주입 `toyvillage:individuals:fail`)를 쓴다.
// 사진 업로드는 드롭존의 숨긴 file input 에 파일을 넣는다(파일 선택 창 대체 — 승인 메모 S29).

// 공통 fixture — 종 1 카피바라, 개체 1 동식이(수컷, 2019, 사진 `동식이_2026.jpg`).
const createUrl = '/species/1/individuals/create'
const editUrl = '/species/1/individuals/1/edit'
const individualStorageKey = 'toyvillage:individuals'
const sexes = ['암컷', '수컷', '미상']

type SkippableField = 'name' | 'sex' | 'birthYear' | 'photo'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    // clear() 는 인증 가드가 보는 세션 토큰까지 지운다. mock 상태만 비우고
    // 보호 경로에 들어갈 수 있도록 토큰을 다시 심는다.
    localStorage.setItem('accessToken', 'individual-form-test-token')
  })
})

test('S1: 등록 화면 진입과 빈 폼', async ({ page }) => {
  await page.goto(createUrl)

  await expect(page.getByRole('heading', { name: '개체 등록' })).toBeVisible()
  await expect(
    page.getByText('카피바라에 개체를 한 마리씩 등록합니다', { exact: true }),
  ).toBeVisible()
  await expect(nameInput(page)).toHaveValue('')
  for (const sex of sexes) {
    await expect(sexRadio(page, sex)).not.toBeChecked()
  }
  await expect(birthYearInput(page)).toHaveValue('')
  await expect(birthYearInput(page)).toHaveAttribute('placeholder', '0000')
  await expect(page.getByText('년', { exact: true })).toBeVisible()
  await expect(photoDownloadButtons(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: '생성하기' })).toBeVisible()
})

test('S2: 성별 단일 선택', async ({ page }) => {
  await page.goto(createUrl)

  await sexRadio(page, '암컷').click()
  await expectOnlySexChecked(page, '암컷')

  await sexRadio(page, '미상').click()
  await expectOnlySexChecked(page, '미상')
})

test('S3: 출생연도 숫자 4자리 입력', async ({ page }) => {
  await page.goto(createUrl)
  await birthYearInput(page).pressSequentially('2019a7')

  await expect(birthYearInput(page)).toHaveValue('2019')
})

test('S4: 사진 등록', async ({ page }) => {
  await page.goto(createUrl)
  await uploadPhoto(page, imageFile('dongsik-new.jpg', 'image/jpeg'))

  await expect(photoDownloadButtons(page)).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'dongsik-new.jpg 다운로드' }),
  ).toBeVisible()
  await expect(page.getByText('dongsik-new.jpg', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /삭제$/ })).toHaveCount(0)
})

test('S5: 사진 교체', async ({ page }) => {
  await page.goto(createUrl)
  await uploadPhoto(page, imageFile('first-photo.jpg', 'image/jpeg'))
  await expect(page.getByText('first-photo.jpg', { exact: true })).toBeVisible()

  await uploadPhoto(page, imageFile('second-photo.png', 'image/png'))

  await expect(photoDownloadButtons(page)).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'second-photo.png 다운로드' }),
  ).toBeVisible()
  await expect(page.getByText('first-photo.jpg', { exact: true })).toHaveCount(
    0,
  )
})

test('S6: 개체 생성 성공', async ({ page }) => {
  await page.goto(createUrl)
  await fillValidIndividual(page, { name: '새싹이', birthYear: '2022' })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByText('데이터 생성에 성공했습니다')).toBeVisible()
  await expect(page.getByTestId('individual-row').first()).toContainText(
    '새싹이',
  )
})

test('S7: 기타정보 없이 생성', async ({ page }) => {
  await page.goto(createUrl)
  await fillValidIndividual(page, { name: '기타없음' })
  await expect(noteInput(page)).toHaveValue('')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/species\/1$/)
})

test('S8: 수정 화면 진입과 값 복원', async ({ page }) => {
  await page.goto(editUrl)

  await expect(page.getByRole('heading', { name: '개체 수정' })).toBeVisible()
  await expect(
    page.getByText('카피바라 · 동식이의 정보를 수정합니다', { exact: true }),
  ).toBeVisible()
  await expect(nameInput(page)).toHaveValue('동식이')
  await expect(sexRadio(page, '수컷')).toBeChecked()
  await expect(birthYearInput(page)).toHaveValue('2019')
  await expect(noteInput(page)).toHaveValue('알락꼬리여우원숭이와 합사 중')
  await expect(
    page.getByRole('button', { name: '동식이_2026.jpg 다운로드' }),
  ).toBeVisible()
  await expect(page.getByText('동식이_2026.jpg', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
})

test('S9: 개체 수정 저장 성공', async ({ page }) => {
  await page.goto(editUrl)
  await nameInput(page).fill('동순이')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '동순이' })).toBeVisible()
})

test('S10: 변경 없는 수정 화면 뒤로가기', async ({ page }) => {
  await page.goto(editUrl)
  await expect(nameInput(page)).toHaveValue('동식이')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})

test('S11: 개체명 미입력 검증', async ({ page }) => {
  await page.goto(createUrl)
  await fillValidIndividual(page, { skip: 'name' })
  const submitButton = page.getByRole('button', { name: '생성하기' })
  await submitButton.click()

  await expectStackedInOrder(page, [
    nameInput(page),
    errorRow(page, '개체명을 입력해주세요!'),
    sexRadio(page, '암컷'),
  ])
  await expectNoCreateRequest(page)
  await expect(submitButton).toBeFocused()
})

test('S12: 개체명 공백만 입력', async ({ page }) => {
  await page.goto(createUrl)
  await fillValidIndividual(page, { name: '   ' })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectStackedInOrder(page, [
    nameInput(page),
    errorRow(page, '개체명을 입력해주세요!'),
    sexRadio(page, '암컷'),
  ])
  await expectNoCreateRequest(page)
})

test('S13: 성별 미선택 검증', async ({ page }) => {
  await page.goto(createUrl)
  await fillValidIndividual(page, { skip: 'sex' })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectStackedInOrder(page, [
    sexRadio(page, '암컷'),
    errorRow(page, '성별을 선택해주세요!'),
    birthYearInput(page),
  ])
})

test('S14: 출생연도 미입력 검증', async ({ page }) => {
  await page.goto(createUrl)
  await fillValidIndividual(page, { skip: 'birthYear' })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectStackedInOrder(page, [
    birthYearInput(page),
    errorRow(page, '출생연도를 입력해주세요!'),
    noteInput(page),
  ])
})

test('S15: 출생연도 4자리 미만', async ({ page }) => {
  await page.goto(createUrl)
  await fillValidIndividual(page, { birthYear: '201' })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectStackedInOrder(page, [
    birthYearInput(page),
    errorRow(page, '올바른 출생연도를 입력해주세요!'),
    noteInput(page),
  ])
})

test('S16: 출생연도 범위 밖', async ({ page }) => {
  await page.goto(createUrl)
  await fillValidIndividual(page, { birthYear: '1899' })
  const submitButton = page.getByRole('button', { name: '생성하기' })
  await submitButton.click()

  await expect(errorRow(page, '올바른 출생연도를 입력해주세요!')).toBeVisible()

  await birthYearInput(page).fill('9999')
  await submitButton.click()

  await expect(errorRow(page, '올바른 출생연도를 입력해주세요!')).toBeVisible()
})

test('S17: 사진 미등록 검증', async ({ page }) => {
  await page.goto(createUrl)
  await fillValidIndividual(page, { skip: 'photo' })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectStackedInOrder(page, [
    photoHint(page),
    errorRow(page, '사진을 등록해주세요!'),
    uploadButton(page),
  ])
})

test('S18: 여러 항목이 비었을 때 오류 줄 동시 표시', async ({ page }) => {
  await page.goto(createUrl)
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectStackedInOrder(page, [
    nameInput(page),
    errorRow(page, '개체명을 입력해주세요!'),
    sexRadio(page, '암컷'),
    errorRow(page, '성별을 선택해주세요!'),
    birthYearInput(page),
    errorRow(page, '출생연도를 입력해주세요!'),
    noteInput(page),
    photoHint(page),
    errorRow(page, '사진을 등록해주세요!'),
    uploadButton(page),
  ])
})

test('S19: 이미지가 아닌 파일 거부', async ({ page }) => {
  await page.goto(createUrl)
  await uploadPhoto(page, imageFile('health-report.pdf', 'application/pdf'))

  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: '이미지 파일만 등록할 수 있습니다.' }),
  ).toBeVisible()
  await expect(photoDownloadButtons(page)).toHaveCount(0)
})

test('S20: 50MB 초과 이미지 거부', async ({ page }) => {
  await page.goto(createUrl)
  await photoInput(page).evaluate((input: HTMLInputElement) => {
    const oversizedFile = new File(['oversized'], 'huge-dongsik.jpg', {
      type: 'image/jpeg',
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
    page.getByRole('alert').filter({
      hasText: 'huge-dongsik.jpg은 50MB를 초과해 첨부할 수 없습니다.',
    }),
  ).toBeVisible()
  await expect(photoDownloadButtons(page)).toHaveCount(0)
})

test('S21: 여러 이미지 동시 드롭 거부', async ({ page }) => {
  await page.goto(createUrl)
  const dataTransfer = await page.evaluateHandle(() => {
    const files = new DataTransfer()
    files.items.add(new File(['a'], 'first.jpg', { type: 'image/jpeg' }))
    files.items.add(new File(['b'], 'second.png', { type: 'image/png' }))
    return files
  })
  await uploadButton(page).dispatchEvent('dragenter', { dataTransfer })
  await uploadButton(page).dispatchEvent('dragover', { dataTransfer })
  await uploadButton(page).dispatchEvent('drop', { dataTransfer })

  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: '대표 사진은 1장만 등록할 수 있습니다.' }),
  ).toBeVisible()
  await expect(photoDownloadButtons(page)).toHaveCount(0)
})

test('S22: 입력 후 등록 화면 이탈 확인', async ({ page }) => {
  await page.goto(createUrl)
  await nameInput(page).fill('작성 중인 개체')
  const backLink = page.getByRole('link', { name: '뒤로가기' })
  const dialog = page.getByRole('alertdialog', {
    name: '정말 나가시겠습니까?',
  })

  await backLink.click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '취소' }).click()

  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/species\/1\/individuals\/create$/)
  await expect(page.getByRole('heading', { name: '개체 등록' })).toBeVisible()
  await expect(nameInput(page)).toHaveValue('작성 중인 개체')

  await backLink.click()
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/species\/1$/)
})

test('S23: 빈 등록 화면 뒤로가기', async ({ page }) => {
  await page.goto(createUrl)
  await expect(page.getByRole('heading', { name: '개체 등록' })).toBeVisible()
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})

test('S24: 수정 중 사이드바 이동 이탈 확인', async ({ page }) => {
  await page.goto(editUrl)
  await expect(sexRadio(page, '수컷')).toBeChecked()
  await sexRadio(page, '암컷').click()
  await expect(sexRadio(page, '암컷')).toBeChecked()

  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await page.getByRole('link', { name: '개체관리 바로가기' }).click()

  const dialog = page.getByRole('alertdialog', {
    name: '정말 나가시겠습니까?',
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '취소' }).click()

  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1\/edit$/)
  await expect(page.getByRole('heading', { name: '개체 수정' })).toBeVisible()
  await expect(sexRadio(page, '암컷')).toBeChecked()
})

test('S26: 저장 실패 시 입력 보존', async ({ page }) => {
  await page.goto(editUrl)
  await expect(nameInput(page)).toHaveValue('동식이')
  await page.evaluate(() =>
    localStorage.setItem('toyvillage:individuals:fail', 'update'),
  )
  await nameInput(page).fill('동식이(실패)')
  const submitButton = page.getByRole('button', { name: '저장하기' })
  await submitButton.click()

  await expect(
    page
      .getByRole('status')
      .filter({ hasText: '저장하지 못했습니다. 다시 시도해 주세요.' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1\/edit$/)
  await expect(nameInput(page)).toHaveValue('동식이(실패)')
  await expect(submitButton).toBeEnabled()
})

test('S27: 없는 종으로 등록 진입', async ({ page }) => {
  await page.goto('/species/999/individuals/create')

  await expect(page.getByText('종을 찾을 수 없습니다.')).toBeVisible()
  const backToList = page.getByRole('link', { name: '목록으로 돌아가기' })
  await expect(backToList).toBeVisible()
  await expect(backToList).toHaveAttribute('href', '/species')
  await expect(nameInput(page)).toHaveCount(0)
})

test('S28: 없는 개체로 수정 진입', async ({ page }) => {
  await page.goto('/species/1/individuals/999/edit')

  await expect(page.getByText('개체를 찾을 수 없습니다.')).toBeVisible()
  const backToSpecies = page.getByRole('link', { name: '종 상세로 돌아가기' })
  await expect(backToSpecies).toBeVisible()
  await expect(backToSpecies).toHaveAttribute('href', '/species/1')
  await expect(nameInput(page)).toHaveCount(0)
})

test('S29: 키보드만으로 등록', async ({ page }) => {
  await page.goto(createUrl)
  await page.getByRole('link', { name: '뒤로가기' }).focus()

  await page.keyboard.press('Tab')
  await expect(nameInput(page)).toBeFocused()
  await page.keyboard.type('키보드')

  // 선택된 성별이 없으면 첫 radio 로 들어가고, 방향키로 선택한다.
  await page.keyboard.press('Tab')
  await expect(sexRadio(page, '암컷')).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(sexRadio(page, '수컷')).toBeFocused()
  await expectOnlySexChecked(page, '수컷')

  await page.keyboard.press('Tab')
  await expect(birthYearInput(page)).toBeFocused()
  await page.keyboard.type('2020')

  await page.keyboard.press('Tab')
  await expect(noteInput(page)).toBeFocused()
  await page.keyboard.type('키보드로 입력한 기타정보')

  await page.keyboard.press('Tab')
  await expect(uploadButton(page)).toBeFocused()
  // 파일 선택 창은 file input 으로 대체한다(승인 메모).
  await uploadPhoto(page, imageFile('keyboard.jpg', 'image/jpeg'))
  await expect(page.getByText('keyboard.jpg', { exact: true })).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '생성하기' })).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/species\/1$/)
})

function nameInput(page: Page) {
  return page.getByRole('textbox', { name: '개체명', exact: true })
}

function sexRadio(page: Page, name: string) {
  return page.getByRole('radio', { name, exact: true })
}

function birthYearInput(page: Page) {
  return page.getByRole('textbox', { name: '출생연도', exact: true })
}

function noteInput(page: Page) {
  return page.getByRole('textbox', { name: '기타정보', exact: true })
}

async function expectOnlySexChecked(page: Page, checkedName: string) {
  for (const sex of sexes) {
    if (sex === checkedName) await expect(sexRadio(page, sex)).toBeChecked()
    else await expect(sexRadio(page, sex)).not.toBeChecked()
  }
}

function photoInput(page: Page) {
  return page.getByLabel('사진 파일 선택')
}

function uploadButton(page: Page) {
  return page.getByRole('button', { name: '사진 업로드' })
}

function photoHint(page: Page) {
  return page.getByText('대표 사진 1장만 등록할 수 있습니다.', { exact: true })
}

function photoDownloadButtons(page: Page) {
  return page.getByRole('button', { name: /다운로드$/ })
}

function imageFile(name: string, mimeType: string) {
  return { name, mimeType, buffer: Buffer.from(`${name} content`) }
}

async function uploadPhoto(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
) {
  await photoInput(page).setInputFiles(file)
}

async function fillValidIndividual(
  page: Page,
  {
    skip,
    name = '테스트 개체',
    birthYear = '2021',
  }: { skip?: SkippableField; name?: string; birthYear?: string } = {},
) {
  if (skip !== 'name') await nameInput(page).fill(name)
  if (skip !== 'sex') await sexRadio(page, '수컷').click()
  if (skip !== 'birthYear') await birthYearInput(page).fill(birthYear)
  if (skip !== 'photo') {
    await uploadPhoto(page, imageFile('individual.jpg', 'image/jpeg'))
  }
}

function errorRow(page: Page, message: string) {
  return page.getByRole('alert').filter({ hasText: message })
}

// 생성 요청이 가지 않았다 — mock 저장소가 비어 있고 화면에 머문다.
async function expectNoCreateRequest(page: Page) {
  await expect(page).toHaveURL(/\/species\/1\/individuals\/create$/)
  const stored = await page.evaluate(
    (key) => localStorage.getItem(key),
    individualStorageKey,
  )
  expect(stored).toBeNull()
}

// 카드 아래 오류 줄 위치를 확인한다. 첫 오류로 부드럽게 스크롤하는 중에도
// 비교가 맞도록 위치를 한 번에 읽는다.
async function expectStackedInOrder(page: Page, locators: Locator[]) {
  for (const locator of locators) await expect(locator).toBeVisible()
  const handles = await Promise.all(
    locators.map((locator) => locator.elementHandle()),
  )
  const tops = await page.evaluate(
    (elements) =>
      elements.map((element) => element?.getBoundingClientRect().top ?? NaN),
    handles,
  )
  for (let index = 1; index < tops.length; index += 1) {
    expect(tops[index]).toBeGreaterThan(tops[index - 1])
  }
}
