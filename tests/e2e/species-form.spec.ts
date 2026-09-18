import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  mockAnimalManageApi,
  type AnimalManageApiHandle,
} from './support/animal-manage-api'

// 승인된 시나리오(species-form.approved.json: S1~S32, S23·S29 삭제)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 실제 서버 대신 `page.route` 가짜 서버(`support/animal-manage-api`)를 쓰고, 실패는 `failNext` 로 주입한다.
// 사진 업로드는 드롭존의 숨긴 file input 에 파일을 넣는다(파일 선택 창 대체).

const createUrl = '/species/create'
const editUrl = '/species/1/edit'
const legalPresets = [
  '지정관리 야생동물',
  '멸종위기 야생생물 I급',
  '천연기념물',
]
const taxonGroups = ['포유류', '파충류', '조류', '어류']

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    // clear() 는 인증 가드가 보는 세션 토큰까지 지운다. 보호 경로에 들어갈 수 있도록 토큰을 다시 심는다.
    localStorage.setItem('accessToken', 'species-form-test-token')
  })
  api = await mockAnimalManageApi(page)
})

test('S1: 등록 화면 진입 기본 상태', async ({ page }) => {
  await page.goto(createUrl)

  await expect(page.getByRole('heading', { name: '종 등록' })).toBeVisible()
  for (const [input, placeholder] of [
    [koreanNameInput(page), '국명을 입력해주세요'],
    [englishNameInput(page), '영문명을 입력해주세요'],
    [scientificNameInput(page), '학명을 입력해주세요'],
    [subClassificationInput(page), '세부 분류를 입력해주세요'],
  ] as const) {
    await expect(input).toHaveValue('')
    await expect(input).toHaveAttribute('placeholder', placeholder)
  }

  await expect(page.getByRole('radio')).toHaveCount(taxonGroups.length)
  await expectOnlyTaxonGroupChecked(page, '포유류')

  await expect(legalGroup(page).locator('button[aria-pressed]')).toHaveCount(
    legalPresets.length,
  )
  for (const name of legalPresets) {
    await expect(legalPill(page, name)).toHaveAttribute('aria-pressed', 'false')
    await expect(removeButton(page, name)).toHaveCount(0)
  }
  await expect(addLegalButton(page)).toBeVisible()

  await expect(photoDownloadButtons(page)).toHaveCount(0)
  await expect(uploadButton(page)).toBeVisible()
  await expect(page.getByRole('button', { name: '생성하기' })).toBeVisible()
})

test('S2: 분류군 단일 선택', async ({ page }) => {
  await page.goto(createUrl)

  await page.getByRole('radio', { name: '조류' }).click()
  await expectOnlyTaxonGroupChecked(page, '조류')

  await page.getByRole('radio', { name: '어류' }).click()
  await expectOnlyTaxonGroupChecked(page, '어류')
})

test('S3: 법정지정분류 기본 선택지 토글', async ({ page }) => {
  await page.goto(createUrl)

  await legalPill(page, '지정관리 야생동물').click()
  await legalPill(page, '천연기념물').click()
  await expect(legalPill(page, '지정관리 야생동물')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(legalPill(page, '천연기념물')).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await legalPill(page, '천연기념물').click()
  await expect(legalPill(page, '천연기념물')).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(legalPill(page, '지정관리 야생동물')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('S4: 법정분류 추가 모달 열기', async ({ page }) => {
  await page.goto(createUrl)
  await addLegalButton(page).click()

  const dialog = addLegalDialog(page)
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('heading', { name: '법정분류 추가' }),
  ).toBeVisible()
  await expect(addLegalInput(page)).toHaveAttribute(
    'placeholder',
    '분류 이름을 입력해주세요',
  )
  await expect(dialog.getByRole('button', { name: '취소' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '추가하기' })).toBeDisabled()
  await expect(addLegalInput(page)).toBeFocused()
})

test('S5: 새 법정분류 추가', async ({ page }) => {
  await page.goto(createUrl)
  await addLegalButton(page).click()
  await addLegalInput(page).fill('해양보호생물')
  await addLegalDialog(page).getByRole('button', { name: '추가하기' }).click()

  await expect(addLegalDialog(page)).toBeHidden()
  await expect(legalPill(page, '해양보호생물')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(removeButton(page, '해양보호생물')).toBeVisible()

  // 새 pill(본문 → 삭제 버튼)이 `+ 법정분류 추가` 바로 앞에 놓인다.
  const buttons = legalGroup(page).getByRole('button')
  const count = await buttons.count()
  await expect(buttons.nth(count - 3)).toHaveAccessibleName('해양보호생물')
  await expect(buttons.nth(count - 2)).toHaveAccessibleName('해양보호생물 삭제')
  await expect(buttons.nth(count - 1)).toHaveAccessibleName('법정분류 추가')
})

test('S6: 사진 업로드', async ({ page }) => {
  await page.goto(createUrl)
  await uploadPhoto(page, imageFile('capybara.jpg', 'image/jpeg'))

  await expect(photoDownloadButtons(page)).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'capybara.jpg 다운로드' }),
  ).toBeVisible()
  await expect(page.getByText('capybara.jpg', { exact: true })).toBeVisible()
})

test('S7: 종 생성 성공', async ({ page }) => {
  await page.goto(createUrl)
  await koreanNameInput(page).fill('테스트 수달')
  await englishNameInput(page).fill('Test otter')
  await scientificNameInput(page).fill('Lutra testus')
  await uploadPhoto(page, imageFile('otter.jpg', 'image/jpeg'))
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/species$/)
  await expect(page.getByText('데이터 생성에 성공했습니다')).toBeVisible()
  await expect(page.getByTestId('species-row').first()).toContainText(
    '테스트 수달',
  )
})

test('S8: 수정 화면 진입 머리', async ({ page }) => {
  await page.goto(editUrl)

  await expect(page.getByRole('heading', { name: '종 수정' })).toBeVisible()
  await expect(
    page.getByText('카피바라의 종 정보를 수정합니다', { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
})

test('S9: 수정 화면 값 복원', async ({ page }) => {
  await page.goto(editUrl)

  await expect(koreanNameInput(page)).toHaveValue('카피바라')
  await expect(englishNameInput(page)).toHaveValue('Capybara')
  await expect(scientificNameInput(page)).toHaveValue(
    'Hydrochoerus hydrochaeris',
  )
  await expect(subClassificationInput(page)).toHaveValue('설치목 - 천축서과')

  await expectOnlyTaxonGroupChecked(page, '포유류')
  await expect(
    legalGroup(page).locator('button[aria-pressed="true"]'),
  ).toHaveCount(1)
  await expect(legalPill(page, '지정관리 야생동물')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(legalPill(page, '멸종위기 야생생물 I급')).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(legalPill(page, '천연기념물')).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(
    page.getByRole('button', { name: '카피바라_2026.jpg 다운로드' }),
  ).toBeVisible()
  await expect(
    page.getByText('카피바라_2026.jpg', { exact: true }),
  ).toBeVisible()
})

test('S10: 수정 저장 성공', async ({ page }) => {
  await page.goto(editUrl)
  await koreanNameInput(page).fill('카피바라(수정)')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(
    page.getByRole('heading', { name: '카피바라(수정)' }),
  ).toBeVisible()
})

test('S11: 전부 빈 채 생성 — 오류 줄 동시 표시', async ({ page }) => {
  await page.goto(createUrl)
  const submitButton = page.getByRole('button', { name: '생성하기' })
  await submitButton.click()

  await expect(errorRow(page, '국명을 입력해주세요!')).toBeVisible()
  await expect(
    errorRow(page, '영문명과 학명을 모두 입력해주세요!'),
  ).toBeVisible()
  await expect(errorRow(page, '사진을 등록해주세요!')).toBeVisible()
  await expectStackedInOrder(page, [
    koreanNameInput(page),
    errorRow(page, '국명을 입력해주세요!'),
    englishNameInput(page),
  ])
  await expectStackedInOrder(page, [
    scientificNameInput(page),
    errorRow(page, '영문명과 학명을 모두 입력해주세요!'),
    page.getByRole('radio', { name: '포유류' }),
  ])
  await expectStackedInOrder(page, [
    photoHint(page),
    errorRow(page, '사진을 등록해주세요!'),
    uploadButton(page),
  ])

  await expectNoCreateRequest(page)
  await expect(submitButton).toBeFocused()
})

test('S12: 국명만 입력', async ({ page }) => {
  await page.goto(createUrl)
  await koreanNameInput(page).fill('국명만')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(
    errorRow(page, '영문명과 학명을 모두 입력해주세요!'),
  ).toBeVisible()
  await expect(errorRow(page, '사진을 등록해주세요!')).toBeVisible()
  await expect(errorRow(page, '국명을 입력해주세요!')).toHaveCount(0)
})

test('S13: 학명만 빈 채 생성', async ({ page }) => {
  await page.goto(createUrl)
  await koreanNameInput(page).fill('학명 없는 종')
  await englishNameInput(page).fill('No scientific name')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(
    errorRow(page, '영문명과 학명을 모두 입력해주세요!'),
  ).toBeVisible()
  await expectStackedInOrder(page, [
    scientificNameInput(page),
    errorRow(page, '영문명과 학명을 모두 입력해주세요!'),
    page.getByRole('radio', { name: '포유류' }),
  ])
})

test('S14: 고친 뒤 다시 제출하면 오류 줄 갱신', async ({ page }) => {
  await page.goto(createUrl)
  const submitButton = page.getByRole('button', { name: '생성하기' })
  await submitButton.click()
  await expect(errorRow(page, '국명을 입력해주세요!')).toBeVisible()
  await expect(
    errorRow(page, '영문명과 학명을 모두 입력해주세요!'),
  ).toBeVisible()
  await expect(errorRow(page, '사진을 등록해주세요!')).toBeVisible()

  await koreanNameInput(page).fill('고친 국명')
  await expect(errorRow(page, '국명을 입력해주세요!')).toBeVisible()

  await submitButton.click()
  await expect(errorRow(page, '국명을 입력해주세요!')).toHaveCount(0)
  await expect(
    errorRow(page, '영문명과 학명을 모두 입력해주세요!'),
  ).toBeVisible()
  await expect(errorRow(page, '사진을 등록해주세요!')).toBeVisible()
})

test('S15: 사진 검증', async ({ page }) => {
  await page.goto(createUrl)
  await koreanNameInput(page).fill('사진 없는 종')
  await englishNameInput(page).fill('No photo')
  await scientificNameInput(page).fill('Photo nullus')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(errorRow(page, '사진을 등록해주세요!')).toBeVisible()
  await expectStackedInOrder(page, [
    photoHint(page),
    errorRow(page, '사진을 등록해주세요!'),
    uploadButton(page),
  ])
  await expect(errorRow(page, '국명을 입력해주세요!')).toHaveCount(0)
  await expect(
    errorRow(page, '영문명과 학명을 모두 입력해주세요!'),
  ).toHaveCount(0)
  await expectNoCreateRequest(page)
})

test('S16: 공백만 입력한 국명', async ({ page }) => {
  await page.goto(createUrl)
  await koreanNameInput(page).fill('   ')
  await englishNameInput(page).fill('Blank name')
  await scientificNameInput(page).fill('Nomen vacuum')
  await uploadPhoto(page, imageFile('blank.jpg', 'image/jpeg'))
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(errorRow(page, '국명을 입력해주세요!')).toBeVisible()
  await expectNoCreateRequest(page)
})

test('S17: 선택 항목 없이 생성', async ({ page }) => {
  await page.goto(createUrl)
  await koreanNameInput(page).fill('필수값만 종')
  await englishNameInput(page).fill('Required only')
  await scientificNameInput(page).fill('Requisitus solus')
  await uploadPhoto(page, imageFile('required.jpg', 'image/jpeg'))
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/species$/)
  await expect(page.getByText('데이터 생성에 성공했습니다')).toBeVisible()
})

test('S18: 모달 빈 이름', async ({ page }) => {
  await page.goto(createUrl)
  await addLegalButton(page).click()
  const dialog = addLegalDialog(page)
  const addButton = dialog.getByRole('button', { name: '추가하기' })

  // 입력이 빈 상태
  await expect(addButton).toBeDisabled()
  await addLegalInput(page).press('Enter')
  await expect(dialog).toBeVisible()

  // 공백만 있는 상태
  await addLegalInput(page).fill('   ')
  await expect(addButton).toBeDisabled()
  await addLegalInput(page).press('Enter')
  await expect(dialog).toBeVisible()

  // 모달이 열린 동안 폼은 aria-hidden 이라 숨은 요소까지 센다.
  await expect(
    page.getByRole('button', { name: /삭제$/, includeHidden: true }),
  ).toHaveCount(0)
  await expect(page.locator('button[aria-pressed]')).toHaveCount(
    legalPresets.length,
  )
})

test('S19: 모달 중복 이름', async ({ page }) => {
  await page.goto(createUrl)
  await addLegalButton(page).click()
  await addLegalInput(page).fill('천연기념물')
  await addLegalDialog(page).getByRole('button', { name: '추가하기' }).click()

  await expect(addLegalDialog(page)).toBeVisible()
  await expectStackedInOrder(page, [
    addLegalInput(page),
    addLegalDialog(page).getByRole('alert').filter({
      hasText: '이미 있는 분류입니다!',
    }),
  ])
  await expect(
    page.getByRole('button', {
      name: '천연기념물',
      exact: true,
      includeHidden: true,
    }),
  ).toHaveCount(1)
})

test('S20: 모달 취소', async ({ page }) => {
  await page.goto(createUrl)

  // `취소` 클릭
  await addLegalButton(page).click()
  await addLegalInput(page).fill('해양보호생물')
  await addLegalDialog(page).getByRole('button', { name: '취소' }).click()

  await expect(addLegalDialog(page)).toBeHidden()
  await expect(legalPill(page, '해양보호생물')).toHaveCount(0)
  await expect(addLegalButton(page)).toBeFocused()

  // `Esc`
  await addLegalButton(page).click()
  await addLegalInput(page).fill('해양보호생물')
  await addLegalInput(page).press('Escape')

  await expect(addLegalDialog(page)).toBeHidden()
  await expect(legalPill(page, '해양보호생물')).toHaveCount(0)
  await expect(addLegalButton(page)).toBeFocused()
})

test('S21: 직접 추가한 법정분류 제거', async ({ page }) => {
  await page.goto(createUrl)
  await addLegalButton(page).click()
  await addLegalInput(page).fill('해양보호생물')
  await addLegalDialog(page).getByRole('button', { name: '추가하기' }).click()
  await expect(legalPill(page, '해양보호생물')).toBeVisible()

  await removeButton(page, '해양보호생물').click()
  await legalDeleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(legalPill(page, '해양보호생물')).toHaveCount(0)
  expect(api.legalStatuses.map(({ kind }) => kind)).not.toContain(
    '해양보호생물',
  )
  for (const name of legalPresets) {
    await expect(legalPill(page, name)).toBeVisible()
    await expect(removeButton(page, name)).toHaveCount(0)
  }
})

test('S22: 사진 교체', async ({ page }) => {
  await page.goto(createUrl)
  await uploadPhoto(page, imageFile('capybara.jpg', 'image/jpeg'))
  await expect(page.getByText('capybara.jpg', { exact: true })).toBeVisible()

  await uploadPhoto(page, imageFile('capybara-2.png', 'image/png'))

  await expect(photoDownloadButtons(page)).toHaveCount(1)
  await expect(
    page.getByRole('button', { name: 'capybara-2.png 다운로드' }),
  ).toBeVisible()
  await expect(page.getByText('capybara-2.png', { exact: true })).toBeVisible()
  await expect(page.getByText('capybara.jpg', { exact: true })).toHaveCount(0)
})

test('S23: 사진 제거', async ({ page }) => {
  await page.goto(createUrl)
  await uploadPhoto(page, imageFile('capybara.jpg', 'image/jpeg'))
  await expect(photoDownloadButtons(page)).toHaveCount(1)

  await removeButton(page, 'capybara.jpg').click()

  await expect(photoDownloadButtons(page)).toHaveCount(0)
  await expect(page.getByText('capybara.jpg', { exact: true })).toHaveCount(0)
  await expect(uploadButton(page)).toBeVisible()

  // 사진은 필수라 지운 채로는 생성되지 않는다.
  await koreanNameInput(page).fill('카피바라')
  await englishNameInput(page).fill('Capybara')
  await scientificNameInput(page).fill('Hydrochoerus hydrochaeris')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(errorRow(page, '사진을 등록해주세요!')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${createUrl}$`))
})

test('S33: 수정 화면 사진 제거', async ({ page }) => {
  await page.goto(editUrl)
  await expect(photoDownloadButtons(page)).toHaveCount(1)
  const fileName = await photoDownloadButtons(page)
    .getAttribute('aria-label')
    .then((label) => label?.replace(' 다운로드', '') ?? '')

  await removeButton(page, fileName).click()

  await expect(photoDownloadButtons(page)).toHaveCount(0)
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(errorRow(page, '사진을 등록해주세요!')).toBeVisible()

  // 다시 올리면 저장된다.
  await uploadPhoto(page, imageFile('re-uploaded.png', 'image/png'))
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page).toHaveURL(/\/species\/1$/)
})

test('S24: 이미지가 아닌 파일 거부', async ({ page }) => {
  await page.goto(createUrl)
  await uploadPhoto(page, imageFile('report.pdf', 'application/pdf'))

  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: '이미지 파일만 등록할 수 있습니다.' }),
  ).toBeVisible()
  await expect(photoDownloadButtons(page)).toHaveCount(0)
})

test('S25: 50MB 초과 거부', async ({ page }) => {
  await page.goto(createUrl)
  await photoInput(page).evaluate((input: HTMLInputElement) => {
    const oversizedFile = new File(['oversized'], 'huge-capybara.jpg', {
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
      hasText: 'huge-capybara.jpg은 50MB를 초과해 첨부할 수 없습니다.',
    }),
  ).toBeVisible()
  await expect(photoDownloadButtons(page)).toHaveCount(0)
})

test('S26: 여러 파일 동시 선택 거부', async ({ page }) => {
  await page.goto(createUrl)
  // 숨긴 input 은 단일 선택이라 두 파일을 한 번에 넣는 선택을 스크립트로 만든다.
  await photoInput(page).evaluate((input: HTMLInputElement) => {
    const files = new DataTransfer()
    files.items.add(new File(['a'], 'first.jpg', { type: 'image/jpeg' }))
    files.items.add(new File(['b'], 'second.png', { type: 'image/png' }))
    input.files = files.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })

  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: '대표 사진은 1장만 등록할 수 있습니다.' }),
  ).toBeVisible()
  await expect(photoDownloadButtons(page)).toHaveCount(0)
})

test('S27: 등록 화면 이탈 보호', async ({ page }) => {
  await page.goto(createUrl)
  await koreanNameInput(page).fill('작성 중인 종')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  const dialog = page.getByRole('alertdialog', {
    name: '정말 나가시겠습니까?',
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '취소' }).click()

  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL(/\/species\/create$/)
  await expect(page.getByRole('heading', { name: '종 등록' })).toBeVisible()
  await expect(koreanNameInput(page)).toHaveValue('작성 중인 종')
})

test('S28: 수정 화면 무변경 이탈', async ({ page }) => {
  await page.goto(editUrl)
  await expect(koreanNameInput(page)).toHaveValue('카피바라')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})

test('S30: 저장 실패 시 입력 보존', async ({ page }) => {
  await page.goto(editUrl)
  await koreanNameInput(page).fill('카피바라(실패)')
  api.failNext('kind.update')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(
    page
      .getByRole('status')
      .filter({ hasText: '저장하지 못했습니다. 다시 시도해 주세요.' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/species\/1\/edit$/)
  await expect(koreanNameInput(page)).toHaveValue('카피바라(실패)')
})

test('S31: 없는 종 수정 진입', async ({ page }) => {
  await page.goto('/species/999/edit')

  await expect(page.getByText('종을 찾을 수 없습니다.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: '목록으로 돌아가기' }),
  ).toBeVisible()
})

test('S32: 키보드 조작', async ({ page }) => {
  await page.goto(createUrl)
  await page.getByRole('link', { name: '뒤로가기' }).focus()

  // 텍스트 입력: 뒤로가기 → 국명 → 영문명 → 학명
  await page.keyboard.press('Tab')
  await expect(koreanNameInput(page)).toBeFocused()
  await page.keyboard.type('키보드 수달')
  await page.keyboard.press('Tab')
  await expect(englishNameInput(page)).toBeFocused()
  await page.keyboard.type('Keyboard otter')
  await page.keyboard.press('Tab')
  await expect(scientificNameInput(page)).toBeFocused()
  await page.keyboard.type('Lutra clavis')

  // 분류군: 선택된 pill 로 들어가 방향키로 옮긴다.
  await page.keyboard.press('Tab')
  await expect(page.getByRole('radio', { name: '포유류' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: '파충류' })).toBeFocused()
  await expectOnlyTaxonGroupChecked(page, '파충류')

  // 세부 분류 → 법정지정분류 기본 선택지
  await page.keyboard.press('Tab')
  await expect(subClassificationInput(page)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(legalPill(page, '지정관리 야생동물')).toBeFocused()
  await page.keyboard.press('Space')
  await expect(legalPill(page, '지정관리 야생동물')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.keyboard.press('Tab')
  await expect(legalPill(page, '멸종위기 야생생물 I급')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(legalPill(page, '천연기념물')).toBeFocused()

  // 법정분류 추가 → 모달 입력 → Enter 로 추가
  await page.keyboard.press('Tab')
  await expect(addLegalButton(page)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(addLegalInput(page)).toBeFocused()
  await page.keyboard.type('해양보호생물')
  await page.keyboard.press('Enter')
  await expect(addLegalDialog(page)).toBeHidden()
  await expect(addLegalButton(page)).toBeFocused()
  await expect(legalPill(page, '해양보호생물')).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  // 직접 추가 항목: 본문 → 삭제 → 법정분류 추가 순서, 삭제 버튼으로 제거
  await page.keyboard.press('Shift+Tab')
  await expect(removeButton(page, '해양보호생물')).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(legalPill(page, '해양보호생물')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(removeButton(page, '해양보호생물')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(legalDeleteDialog(page)).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(
    legalDeleteDialog(page).getByRole('button', { name: '확인' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(legalPill(page, '해양보호생물')).toHaveCount(0)

  // 사진 업로드 컨트롤 접근(파일 선택 창은 file input 으로 대체)
  await expect(addLegalButton(page)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(uploadButton(page)).toBeFocused()
  await uploadPhoto(page, imageFile('keyboard.jpg', 'image/jpeg'))
  await expect(page.getByText('keyboard.jpg', { exact: true })).toBeVisible()

  // 사진 chip 다운로드 → 삭제 → 사진 업로드 → 생성하기
  await page.keyboard.press('Shift+Tab')
  await expect(removeButton(page, 'keyboard.jpg')).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(
    page.getByRole('button', { name: 'keyboard.jpg 다운로드' }),
  ).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(removeButton(page, 'keyboard.jpg')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(uploadButton(page)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '생성하기' })).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/species$/)
})

function koreanNameInput(page: Page) {
  return page.getByRole('textbox', { name: '국명', exact: true })
}

function englishNameInput(page: Page) {
  return page.getByRole('textbox', { name: '영문명', exact: true })
}

function scientificNameInput(page: Page) {
  return page.getByRole('textbox', { name: '학명', exact: true })
}

function subClassificationInput(page: Page) {
  return page.getByRole('textbox', { name: '세부 분류', exact: true })
}

async function expectOnlyTaxonGroupChecked(page: Page, checkedName: string) {
  for (const name of taxonGroups) {
    const radio = page.getByRole('radio', { name, exact: true })
    if (name === checkedName) await expect(radio).toBeChecked()
    else await expect(radio).not.toBeChecked()
  }
}

function legalGroup(page: Page) {
  return page.getByRole('group', { name: '법정지정분류' })
}

function legalPill(page: Page, name: string) {
  return page.getByRole('button', { name, exact: true })
}

function removeButton(page: Page, name: string) {
  return page.getByRole('button', { name: `${name} 삭제`, exact: true })
}

function addLegalButton(page: Page) {
  return page.getByRole('button', { name: '법정분류 추가', exact: true })
}

function addLegalDialog(page: Page) {
  return page.getByRole('dialog', { name: '법정분류 추가' })
}

function addLegalInput(page: Page) {
  return addLegalDialog(page).getByRole('textbox', { name: '분류 이름' })
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

function legalDeleteDialog(page: Page) {
  return page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
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

function errorRow(page: Page, message: string) {
  return page.getByRole('alert').filter({ hasText: message })
}

// 생성 요청이 가지 않았다 — 가짜 서버가 생성 요청을 받지 않았고 화면에 머문다.
async function expectNoCreateRequest(page: Page) {
  await expect(page).toHaveURL(/\/species\/create$/)
  expect(api.count('kind.create')).toBe(0)
}

// 첫 오류로 부드럽게 스크롤하는 중에도 비교가 맞도록 위치를 한 번에 읽는다.
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
