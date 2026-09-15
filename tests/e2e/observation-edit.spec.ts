import { expect, test, type Locator, type Page } from '@playwright/test'

// 승인된 시나리오(observation-edit.approved.json, S1~S22 · S19 삭제)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 관찰은 퍼블리싱 단계 localStorage mock(`toyvillage:observations`)을 쓴다.

// 종 1 카피바라 · 개체 1 동식이 · 관찰 1(첨부 3개).
const individualUrl = '/species/1/individuals/1'
const detailUrl = `${individualUrl}/observations/1`
const editUrl = `${detailUrl}/edit`
const savedTitle = '얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음'
// fixture 의 관찰사항은 제목과 같은 문장이다.
const savedContent = savedTitle
const attachmentNames = ['상처사진.jpg', '상처사진_측면.jpg', '처치기록.pdf']

const detailUrlPattern = /\/species\/1\/individuals\/1\/observations\/1$/
const editUrlPattern = /\/species\/1\/individuals\/1\/observations\/1\/edit$/

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    // clear() 는 인증 가드가 보는 세션 토큰까지 지운다. mock 상태만 비우고
    // 보호 경로에 들어갈 수 있도록 토큰을 다시 심는다.
    localStorage.setItem('accessToken', 'observation-edit-test-token')
  })
})

test('S1: 관찰 상세에서 수정 진입', async ({ page }) => {
  await page.goto(detailUrl)
  await page
    .getByRole('button', { name: `${savedTitle} 관찰 기록 메뉴 열기` })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(editUrlPattern)
})

test('S2: 개체 상세 관찰 표에서 수정 진입', async ({ page }) => {
  await page.goto(individualUrl)
  await page
    .getByRole('button', { name: `${savedTitle} 관찰 메뉴 열기` })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(editUrlPattern)
})

test('S3: 헤더 표시', async ({ page }) => {
  await page.goto(editUrl)

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: '관찰 및 특이사항' }),
  ).toBeVisible()
  await expect(
    page.getByText('카피바라 · 동식이의 정보를 수정합니다'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
})

test('S4: 기존 값 복원', async ({ page }) => {
  await page.goto(editUrl)

  await expect(titleInput(page)).toHaveValue(savedTitle)
  await expect(contentInput(page)).toHaveValue(savedContent)
  await expect(dateInput(page)).toHaveValue('2026.06.01')
  await expect(observerInput(page)).toHaveValue('김유영')
})

test('S5: 기존 첨부 표시', async ({ page }) => {
  await page.goto(editUrl)

  const attachments = attachmentGroup(page)
  await expect(downloadButtons(page)).toHaveCount(attachmentNames.length)
  await expect(removeButtons(page)).toHaveCount(attachmentNames.length)
  for (const fileName of attachmentNames) {
    await expect(
      attachments.getByRole('button', { name: `${fileName} 다운로드` }),
    ).toBeVisible()
    await expect(
      attachments.getByRole('button', { name: `${fileName} 삭제` }),
    ).toBeVisible()
  }
})

test('S6: 날짜·관찰자 읽기 전용', async ({ page }) => {
  await page.goto(editUrl)

  await dateInput(page).focus()
  await page.keyboard.type('2027.01.01')
  await observerInput(page).focus()
  await page.keyboard.type('홍길동')

  await expect(dateInput(page)).toHaveValue('2026.06.01')
  await expect(observerInput(page)).toHaveValue('김유영')
})

test('S7: 제목·관찰사항 수정 저장', async ({ page }) => {
  await page.goto(editUrl)
  await titleInput(page).fill('수정한 관찰 제목')
  await contentInput(page).fill('수정한 관찰사항 내용')
  await saveButton(page).click()

  await expect(page).toHaveURL(detailUrlPattern)
  await expect(
    page.getByRole('heading', { level: 1, name: '수정한 관찰 제목' }),
  ).toBeVisible()
  await expect(page.getByText('수정한 관찰사항 내용')).toBeVisible()
})

test('S8: 첨부 다운로드', async ({ page }) => {
  await page.goto(editUrl)

  const downloadPromise = page.waitForEvent('download')
  await downloadButtons(page).first().click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe(attachmentNames[0])
})

test('S9: 기존 첨부 제거 저장', async ({ page }) => {
  await page.goto(editUrl)
  await attachmentGroup(page)
    .getByRole('button', { name: '상처사진_측면.jpg 삭제' })
    .click()

  await expect(
    attachmentGroup(page).getByText('상처사진_측면.jpg', { exact: true }),
  ).toHaveCount(0)

  await saveButton(page).click()

  await expect(page).toHaveURL(detailUrlPattern)
  await expect(
    page.getByRole('heading', { level: 1, name: savedTitle }),
  ).toBeVisible()
  await expect(
    page.getByText('상처사진_측면.jpg', { exact: true }),
  ).toHaveCount(0)
})

test('S10: 새 첨부 추가 저장', async ({ page }) => {
  await page.goto(editUrl)
  await uploadInput(page).setInputFiles([
    {
      name: '관찰 추가.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('관찰 추가 첨부'),
    },
  ])

  await expect(downloadButtons(page)).toHaveCount(attachmentNames.length + 1)
  await expect(downloadButtons(page).last()).toHaveAccessibleName(
    '관찰 추가.txt 다운로드',
  )

  await saveButton(page).click()

  await expect(page).toHaveURL(detailUrlPattern)
  await expect(page.getByText('관찰 추가.txt', { exact: true })).toBeVisible()
})

test('S11: 무변경 뒤로가기', async ({ page }) => {
  await page.goto(editUrl)
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(detailUrlPattern)
  await expect(leaveDialog(page)).toHaveCount(0)
})

test('S12: 제목 미입력 검증', async ({ page }) => {
  // 비운 값과 공백만 남긴 값 모두 빈 값으로 본다.
  for (const emptyTitle of ['', '   ']) {
    await page.goto(editUrl)
    await titleInput(page).fill(emptyTitle)
    await saveButton(page).click()

    const error = page.getByRole('alert').filter({
      hasText: '제목을 입력해주세요!',
    })
    await expect(error).toBeVisible()
    await expectBetween(error, titleInput(page), dateInput(page))
    await expect(saveButton(page)).toBeFocused()
    await expect(page).toHaveURL(editUrlPattern)
    expect(await storedObservationOverrides(page)).toBeNull()
  }
})

test('S13: 관찰사항 미입력 검증', async ({ page }) => {
  await page.goto(editUrl)
  await contentInput(page).fill('')
  await saveButton(page).click()

  const error = page.getByRole('alert').filter({
    hasText: '관찰사항을 입력해주세요!',
  })
  await expect(error).toBeVisible()
  await expectBetween(error, contentInput(page), attachmentGroup(page))
  await expect(page).toHaveURL(editUrlPattern)
  expect(await storedObservationOverrides(page)).toBeNull()
})

test('S14: 오류 줄 동시 표시', async ({ page }) => {
  await page.goto(editUrl)
  await titleInput(page).fill('')
  await contentInput(page).fill('')
  await saveButton(page).click()

  const titleError = page.getByRole('alert').filter({
    hasText: '제목을 입력해주세요!',
  })
  const contentError = page.getByRole('alert').filter({
    hasText: '관찰사항을 입력해주세요!',
  })
  await expect(titleError).toBeVisible()
  await expect(contentError).toBeVisible()
  await expectBetween(titleError, titleInput(page), dateInput(page))
  await expectBetween(contentError, contentInput(page), attachmentGroup(page))
})

test('S15: 첨부 전부 제거 후 저장', async ({ page }) => {
  await page.goto(editUrl)
  for (const fileName of attachmentNames) {
    await attachmentGroup(page)
      .getByRole('button', { name: `${fileName} 삭제` })
      .click()
  }
  await expect(downloadButtons(page)).toHaveCount(0)

  await expect(
    attachmentGroup(page).getByRole('heading', { name: '첨부', exact: true }),
  ).toBeVisible()

  await saveButton(page).click()

  await expect(page).toHaveURL(detailUrlPattern)
  await expect(page.getByText(/을 입력해주세요!$/)).toHaveCount(0)
})

test('S16: 50MB 초과 파일', async ({ page }) => {
  await page.goto(editUrl)
  await expect(downloadButtons(page)).toHaveCount(attachmentNames.length)

  await uploadInput(page).evaluate((input) => {
    const oversizedFile = new File(['oversized'], '초과 파일.zip', {
      type: 'application/zip',
    })
    Object.defineProperty(oversizedFile, 'size', {
      value: 50 * 1024 * 1024 + 1,
    })

    const files = new DataTransfer()
    files.items.add(oversizedFile)
    ;(input as HTMLInputElement).files = files.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })

  await expect(
    page.getByText('초과 파일.zip은 50MB를 초과해 첨부할 수 없습니다.'),
  ).toBeVisible()
  await expect(downloadButtons(page)).toHaveCount(attachmentNames.length)
})

test('S17: 변경 후 뒤로가기 이탈 보호', async ({ page }) => {
  await page.goto(editUrl)
  await titleInput(page).fill('바꾼 관찰 제목')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(leaveDialog(page)).toBeVisible()
  await leaveDialog(page).getByRole('button', { name: '취소' }).click()

  await expect(leaveDialog(page)).toHaveCount(0)
  await expect(titleInput(page)).toHaveValue('바꾼 관찰 제목')
  await expect(page).toHaveURL(editUrlPattern)

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await leaveDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(detailUrlPattern)
})

test('S18: 변경 후 사이드바·브라우저 뒤로가기 이탈 보호', async ({ page }) => {
  // 브라우저 뒤로가기가 앱 안의 이전 화면(관찰 상세)으로 가도록 화면 이동으로 진입한다.
  await page.goto(detailUrl)
  await page
    .getByRole('button', { name: `${savedTitle} 관찰 기록 메뉴 열기` })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(editUrlPattern)
  await contentInput(page).fill('바꾼 관찰사항')

  // 사이드바 이동 시도
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  // `/species/**` 라 `개체관리` 대분류가 이미 펼쳐져 있다.
  await page.getByRole('link', { name: '개체 카드', exact: true }).click()

  await expect(leaveDialog(page)).toBeVisible()
  await leaveDialog(page).getByRole('button', { name: '취소' }).click()
  await expect(leaveDialog(page)).toHaveCount(0)
  await expect(page).toHaveURL(editUrlPattern)
  await expect(contentInput(page)).toHaveValue('바꾼 관찰사항')

  // 브라우저 뒤로가기
  await page.goBack()

  await expect(leaveDialog(page)).toBeVisible()
  await leaveDialog(page).getByRole('button', { name: '취소' }).click()
  await expect(leaveDialog(page)).toHaveCount(0)
  await expect(page).toHaveURL(editUrlPattern)
  await expect(contentInput(page)).toHaveValue('바꾼 관찰사항')
})

test('S20: 저장 실패', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('toyvillage:observations:fail', 'update')
  })
  await page.goto(editUrl)
  await titleInput(page).fill('실패할 관찰 제목')
  await saveButton(page).click()

  await expect(
    page.getByText('저장하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(page).toHaveURL(editUrlPattern)
  await expect(titleInput(page)).toHaveValue('실패할 관찰 제목')
  await expect(contentInput(page)).toHaveValue(savedContent)
  await expect(downloadButtons(page)).toHaveCount(attachmentNames.length)
})

test('S21: 없는 관찰', async ({ page }) => {
  for (const url of [
    `${individualUrl}/observations/9999/edit`,
    '/species/1/individuals/2/observations/1/edit',
    '/species/2/individuals/1/observations/1/edit',
  ]) {
    await page.goto(url)

    await expect(page.getByText('관찰 기록을 찾을 수 없습니다.')).toBeVisible()
    await expect(
      page.getByRole('link', { name: '개체 상세로 돌아가기' }),
    ).toBeVisible()
    await expect(saveButton(page)).toHaveCount(0)
  }
})

test('S22: 키보드 조작', async ({ page }) => {
  await page.goto(editUrl)

  const backLink = page.getByRole('link', { name: '뒤로가기' })
  await backLink.focus()
  await expectFocusOutline(backLink)

  // 뒤로가기 → 제목. Tab 진입은 값을 전체 선택하므로 End 로 캐럿을 끝에 둔다.
  await page.keyboard.press('Tab')
  await expect(titleInput(page)).toBeFocused()
  await page.keyboard.press('End')
  await page.keyboard.type(' (키보드 수정)')

  await page.keyboard.press('Tab')
  await expect(dateInput(page)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(observerInput(page)).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(contentInput(page)).toBeFocused()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' (키보드 수정)')

  // 첨부 컨트롤 — chip 순서대로 다운로드 → 삭제.
  for (const fileName of attachmentNames) {
    await page.keyboard.press('Tab')
    await expectFocusOutline(
      page.getByRole('button', { name: `${fileName} 다운로드` }),
    )
    await page.keyboard.press('Tab')
    await expectFocusOutline(
      page.getByRole('button', { name: `${fileName} 삭제` }),
    )
  }

  await page.keyboard.press('Tab')
  const uploadButton = page.getByRole('button', { name: '파일 업로드' })
  await expectFocusOutline(uploadButton)

  await page.keyboard.press('Tab')
  await expectFocusOutline(saveButton(page))

  // 파일 업로드 버튼 활성화 → 파일 선택 input 이 열린다.
  // 연속 실행에서 Chromium filechooser 이벤트가 불안정해 숨은 input 의 click 으로 확인한다.
  await page.keyboard.press('Shift+Tab')
  await expect(uploadButton).toBeFocused()
  await uploadInput(page).evaluate((input) => {
    input.addEventListener('click', (event) => {
      event.preventDefault()
      document.body.dataset.fileChooserOpened = 'true'
    })
  })
  await page.keyboard.press('Enter')
  await expect(page.locator('body')).toHaveAttribute(
    'data-file-chooser-opened',
    'true',
  )

  // 첨부 chip 삭제
  const lastRemove = page.getByRole('button', { name: '처치기록.pdf 삭제' })
  await lastRemove.focus()
  await page.keyboard.press('Enter')
  await expect(lastRemove).toHaveCount(0)

  // 저장하기
  await saveButton(page).focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(detailUrlPattern)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: `${savedTitle} (키보드 수정)`,
    }),
  ).toBeVisible()
  await expect(page.getByText('처치기록.pdf', { exact: true })).toHaveCount(0)
})

// 포커스 표시는 outline 이다(직접 지정한 solid 또는 브라우저 기본 focus ring auto).
async function expectFocusOutline(locator: Locator) {
  await expect(locator).toBeFocused()
  await expect(locator).not.toHaveCSS('outline-style', 'none')
}

// 오류 줄이 해당 카드 입력 아래, 다음 카드 위에 있다.
// 첫 오류로 부드럽게 스크롤하는 중에도 비교할 수 있게 문서 기준 좌표를 쓴다.
async function expectBetween(target: Locator, above: Locator, below: Locator) {
  const targetBox = await documentBox(target)
  const aboveBox = await documentBox(above)
  const belowBox = await documentBox(below)
  expect(targetBox.top).toBeGreaterThanOrEqual(aboveBox.bottom)
  expect(targetBox.bottom).toBeLessThanOrEqual(belowBox.top)
}

function documentBox(locator: Locator) {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      top: rect.top + window.scrollY,
      bottom: rect.bottom + window.scrollY,
    }
  })
}

// 수정 요청이 한 번이라도 가면 mock 이 override 를 저장한다.
function storedObservationOverrides(page: Page) {
  return page.evaluate(() => localStorage.getItem('toyvillage:observations'))
}

function titleInput(page: Page) {
  return page.getByRole('textbox', { name: '제목', exact: true })
}

function dateInput(page: Page) {
  return page.getByRole('textbox', { name: '날짜', exact: true })
}

function observerInput(page: Page) {
  return page.getByRole('textbox', { name: '관찰자', exact: true })
}

function contentInput(page: Page) {
  return page.getByRole('textbox', { name: '관찰사항', exact: true })
}

function saveButton(page: Page) {
  return page.getByRole('button', { name: '저장하기' })
}

function attachmentGroup(page: Page) {
  return page.getByRole('group', { name: '첨부파일' })
}

function downloadButtons(page: Page) {
  return attachmentGroup(page).getByRole('button', { name: /다운로드$/ })
}

function removeButtons(page: Page) {
  return attachmentGroup(page).getByRole('button', { name: /삭제$/ })
}

function uploadInput(page: Page) {
  return page.getByLabel('첨부파일 선택')
}

function leaveDialog(page: Page) {
  return page.getByRole('alertdialog', { name: '정말 나가시겠습니까?' })
}
