import { expect, test, type Locator, type Page } from '@playwright/test'

// 승인된 시나리오(individual-detail.approved.json, S1~S30)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 개체·관찰은 퍼블리싱 단계 localStorage mock(`toyvillage:individuals`·`toyvillage:observations`)을 쓴다.

// 종 1 카피바라 · 개체 1 동식이(관찰 11건).
const detailUrl = '/species/1/individuals/1'
const firstTitle = '얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    // clear() 는 인증 가드가 보는 세션 토큰까지 지운다. mock 상태만 비우고
    // 보호 경로에 들어갈 수 있도록 토큰을 다시 심는다.
    localStorage.setItem('accessToken', 'individual-detail-test-token')
  })
})

test('S1: 개체 상세 진입 기본 상태', async ({ page }) => {
  await page.goto(detailUrl)

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: '동식이' }),
  ).toBeVisible()
  // 성별 뱃지는 기호(aria-hidden)와 라벨이 붙어 렌더된다.
  await expect(page.getByText('수컷')).toBeVisible()
  await expect(page.getByText('2019년')).toBeVisible()
  await expect(page.getByText('알락꼬리여우원숭이와 합사 중')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '먹이 급여 기록 확인하기' }),
  ).toBeVisible()
  await expect(sectionHeading(page, 11)).toBeVisible()
})

test('S2: 관찰 표 컬럼·정렬·페이지 크기', async ({ page }) => {
  await page.goto(detailUrl)

  await expect(headerCells(page)).toHaveText([
    '날짜',
    '관찰자',
    '제목',
    '첨부',
    '',
  ])
  await expect(rows(page)).toHaveCount(10)

  const dates = (await rows(page).allInnerTexts()).map(
    (text) => text.match(/\d{4}\.\d{2}\.\d{2}/)?.[0] ?? '',
  )
  expect(dates.every(Boolean)).toBe(true)
  expect(dates).toEqual([...dates].sort().reverse())

  const firstRow = rows(page).first()
  await expect(firstRow).toContainText('2026.06.01')
  await expect(firstRow).toContainText('김유영')
  await expect(firstRow).toContainText(firstTitle)
})

test('S3: 첨부 칸 표기', async ({ page }) => {
  await page.goto(detailUrl)

  const threeAttachments = observationRow(page, firstTitle)
  await expect(
    threeAttachments.getByRole('button', { name: '상처사진.jpg 다운로드' }),
  ).toBeVisible()
  await expect(threeAttachments.getByText('외 2개')).toBeVisible()

  const oneAttachment = observationRow(page, '배변상태 평소보다 조금 묽음')
  await expect(
    oneAttachment.getByRole('button', { name: '배변사진.jpg 다운로드' }),
  ).toBeVisible()
  await expect(oneAttachment.getByText(/^외 \d+개$/)).toHaveCount(0)

  const noAttachment = observationRow(page, '식욕 정상, 활동량 양호')
  await expect(noAttachment.getByText('—', { exact: true })).toBeVisible()
})

test('S4: 행 클릭 → 관찰 상세', async ({ page }) => {
  await page.goto(detailUrl)
  await rows(page).first().getByText(firstTitle).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/1\/observations\/1$/)
})

test('S5: 첨부 chip 다운로드', async ({ page }) => {
  await page.goto(detailUrl)

  const downloadPromise = page.waitForEvent('download')
  await rows(page)
    .first()
    .getByRole('button', { name: '상처사진.jpg 다운로드' })
    .click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('상처사진.jpg')
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
})

test('S6: `외 N개` hover → 첨부 팝오버', async ({ page }) => {
  await page.goto(detailUrl)
  await rows(page).first().getByText('외 2개').hover()

  const popover = attachmentPopover(page, firstTitle)
  await expect(popover).toBeVisible()
  await expect(
    popover.getByRole('button', { name: '상처사진.jpg 다운로드' }),
  ).toBeVisible()
  await expect(popover.getByRole('button', { name: /다운로드$/ })).toHaveCount(
    3,
  )
})

test('S7: 팝오버에서 다운로드', async ({ page }) => {
  await page.goto(detailUrl)
  await rows(page).first().getByText('외 2개').hover()
  const popover = attachmentPopover(page, firstTitle)
  await expect(popover).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await popover
    .getByRole('button', { name: /다운로드$/ })
    .nth(1)
    .click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('상처사진_측면.jpg')
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
})

test('S8: 페이지네이션', async ({ page }) => {
  await page.goto(detailUrl)
  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(rows(page)).toHaveCount(1)
  await expect(rows(page).first()).toContainText('2026.01.07')
  await expect(rows(page).first()).toContainText('겨울철 실내 적응 양호')
  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeDisabled()

  await page.getByRole('button', { name: '1 페이지' }).click()
  await expect(rows(page)).toHaveCount(10)
  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeDisabled()
})

test('S9: 뒤로가기', async ({ page }) => {
  await page.goto(detailUrl)
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})

test('S10: 카드 케밥 메뉴 열기', async ({ page }) => {
  await page.goto(detailUrl)
  await cardMenuTrigger(page).click()

  const menu = page.getByRole('menu', { name: '동식이 개체 메뉴 열기' })
  await expect(menu.getByRole('menuitem')).toHaveCount(2)
  await expect(menu.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: '삭제' })).toBeVisible()
})

test('S11: 카드 메뉴 수정 → 개체 수정', async ({ page }) => {
  await page.goto(detailUrl)
  await cardMenuTrigger(page).click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/1\/edit$/)
})

test('S12: 카드 메뉴 삭제 → 개체 삭제 모달', async ({ page }) => {
  await page.goto(detailUrl)
  await cardMenuTrigger(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()

  // 모달이 열리면 앱 루트가 aria-hidden 이라 role 조회 대신 DOM 으로 메뉴 닫힘을 본다.
  await expect(page.locator('[role="menu"]')).toHaveCount(0)
  const dialog = deleteDialog(page)
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('등록된 관찰 기록도 함께 삭제되며')
  await expect(dialog).toContainText('삭제 후에는 복구할 수 없습니다')
})

test('S13: 개체 삭제 확인 → 종 상세', async ({ page }) => {
  await page.goto(detailUrl)
  await openIndividualDeleteDialog(page)
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(page.getByRole('status')).toContainText(
    '데이터 삭제에 성공했습니다',
  )
})

test('S14: 행 케밥 메뉴 열기', async ({ page }) => {
  await page.goto(detailUrl)
  await rowMenuTrigger(page, firstTitle).click()

  const menu = page.getByRole('menu', { name: `${firstTitle} 관찰 메뉴 열기` })
  await expect(menu.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: '삭제' })).toBeVisible()
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
})

test('S15: 행 메뉴 수정 → 관찰 수정', async ({ page }) => {
  await page.goto(detailUrl)
  await rowMenuTrigger(page, firstTitle).click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(
    /\/species\/1\/individuals\/1\/observations\/1\/edit$/,
  )
})

test('S16: 관찰 삭제 확인', async ({ page }) => {
  await page.goto(detailUrl)
  await openObservationDeleteDialog(page, firstTitle)
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(deleteDialog(page)).toHaveCount(0)
  await expect(observationRow(page, firstTitle)).toHaveCount(0)
  await expect(sectionHeading(page, 10)).toBeVisible()
  await expect(page.getByRole('status')).toContainText(
    '데이터 삭제에 성공했습니다',
  )
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
})

test('S17: 먹이 급여 기록 확인하기 비활성', async ({ page }) => {
  await page.goto(detailUrl)
  const feedingButton = page.getByRole('button', {
    name: '먹이 급여 기록 확인하기',
  })
  // aria-disabled 버튼은 Playwright 가 비활성으로 보고 클릭을 기다리므로 force 로 누른다.
  await feedingButton.click({ force: true })

  await expect(feedingButton).toHaveAttribute('aria-disabled', 'true')
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
})

test('S18: 관찰 0건', async ({ page }) => {
  await page.goto('/species/1/individuals/3')

  await expect(sectionHeading(page, 0)).toBeVisible()
  const empty = page
    .getByRole('status')
    .filter({ hasText: '등록된 관찰 기록이 없습니다' })
  await expect(empty).toBeVisible()

  // 표 헤더는 남고 빈 문구는 그 아래에 있다.
  const header = empty.locator('xpath=..').locator(':scope > div').first()
  await expect(header).toContainText('날짜')
  const headerBox = await header.boundingBox()
  const emptyBox = await empty.boundingBox()
  expect(emptyBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height)

  await expect(page.getByRole('button', { name: /페이지$/ })).toHaveCount(0)
})

test('S19: 기타정보 없음 · 암컷/미상 뱃지', async ({ page }) => {
  await page.goto('/species/1/individuals/2')

  await expect(
    page.getByRole('heading', { level: 1, name: '미미' }),
  ).toBeVisible()
  await expect(page.getByText('암컷')).toBeVisible()
  await expect(noteValue(page)).toHaveText('—')

  await page.goto('/species/2/individuals/7')

  await expect(
    page.getByRole('heading', { level: 1, name: '체리' }),
  ).toBeVisible()
  await expect(page.getByText('미상')).toBeVisible()
})

test('S20: 케밥 메뉴 닫기', async ({ page }) => {
  await page.goto(detailUrl)
  const menus = page.locator('[role="menu"]')

  // 카드 메뉴 — 바깥 클릭
  await cardMenuTrigger(page).click()
  await expect(menus).toHaveCount(1)
  await page.getByRole('heading', { level: 1, name: '동식이' }).click()
  await expect(menus).toHaveCount(0)

  // 카드 메뉴 — Escape
  await cardMenuTrigger(page).click()
  await expect(menus).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(menus).toHaveCount(0)
  await expect(cardMenuTrigger(page)).toBeFocused()

  // 행 메뉴 — 바깥 클릭
  await rowMenuTrigger(page, firstTitle).click()
  await expect(menus).toHaveCount(1)
  await page.getByRole('heading', { level: 1, name: '동식이' }).click()
  await expect(menus).toHaveCount(0)

  // 행 메뉴 — Escape
  await rowMenuTrigger(page, firstTitle).click()
  await expect(menus).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(menus).toHaveCount(0)
  await expect(rowMenuTrigger(page, firstTitle)).toBeFocused()
})

test('S21: 메뉴는 하나만 열림', async ({ page }) => {
  await page.goto(detailUrl)
  await cardMenuTrigger(page).click()
  await expect(
    page.getByRole('menu', { name: '동식이 개체 메뉴 열기' }),
  ).toBeVisible()

  await rowMenuTrigger(page, firstTitle).click()

  await expect(
    page.getByRole('menu', { name: '동식이 개체 메뉴 열기' }),
  ).toHaveCount(0)
  await expect(page.getByRole('menu')).toHaveCount(1)
  await expect(
    page.getByRole('menu', { name: `${firstTitle} 관찰 메뉴 열기` }),
  ).toBeVisible()
})

test('S22: 첨부 팝오버 닫기', async ({ page }) => {
  await page.goto(detailUrl)
  const more = rows(page).first().getByText('외 2개')
  await more.hover()
  const popover = attachmentPopover(page, firstTitle)
  await expect(popover).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(popover).toHaveCount(0)
  await expect(more).toBeFocused()
})

test('S23: 개체 삭제 취소', async ({ page }) => {
  await page.goto(detailUrl)
  await openIndividualDeleteDialog(page)
  await deleteDialog(page).getByRole('button', { name: '취소' }).click()

  await expect(deleteDialog(page)).toHaveCount(0)
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
  await expect(
    page.getByRole('heading', { level: 1, name: '동식이' }),
  ).toBeVisible()
})

test('S24: 관찰 삭제 취소', async ({ page }) => {
  await page.goto(detailUrl)
  await openObservationDeleteDialog(page, firstTitle)
  await deleteDialog(page).getByRole('button', { name: '취소' }).click()

  await expect(deleteDialog(page)).toHaveCount(0)
  await expect(observationRow(page, firstTitle)).toBeVisible()
  await expect(sectionHeading(page, 11)).toBeVisible()
})

test('S25: 개체 삭제 실패', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('toyvillage:individuals:fail', 'delete')
  })
  await page.goto(detailUrl)
  await openIndividualDeleteDialog(page)
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(deleteDialog(page)).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText(
    '데이터 삭제에 실패했습니다',
  )
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
})

test('S26: 관찰 삭제 실패', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('toyvillage:observations:fail', 'delete')
  })
  await page.goto(detailUrl)
  await openObservationDeleteDialog(page, firstTitle)
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(deleteDialog(page)).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText(
    '데이터 삭제에 실패했습니다',
  )
  await expect(observationRow(page, firstTitle)).toBeVisible()
  await expect(sectionHeading(page, 11)).toBeVisible()
})

test('S27: 마지막 페이지의 유일한 행 삭제', async ({ page }) => {
  await page.goto(detailUrl)
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page)).toHaveCount(1)

  await openObservationDeleteDialog(page, '겨울철 실내 적응 양호')
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(rows(page)).toHaveCount(10)
  await expect(page.getByRole('button', { name: /페이지$/ })).toHaveCount(0)
  await expect(sectionHeading(page, 10)).toBeVisible()
})

test('S28: 없는 개체', async ({ page }) => {
  for (const { url, speciesPath } of [
    { url: '/species/1/individuals/999', speciesPath: '/species/1' },
    { url: '/species/2/individuals/1', speciesPath: '/species/2' },
  ]) {
    await page.goto(url)

    await expect(page.getByText('개체를 찾을 수 없습니다.')).toBeVisible()
    const backLink = page.getByRole('link', { name: '종 상세로 돌아가기' })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', speciesPath)
  }
})

test('S29: 관찰 상세 삭제 후 복귀 토스트', async ({ page }) => {
  // 관찰 상세에서 실제로 삭제해 navigate state `{ toast: 'delete-success' }` 로 돌아온다.
  const observationTitle = '배변상태 평소보다 조금 묽음'
  await page.goto('/species/1/individuals/1/observations/2')
  await page
    .getByRole('button', { name: `${observationTitle} 관찰 기록 메뉴 열기` })
    .click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
  await expect(page.getByRole('status')).toContainText(
    '데이터 삭제에 성공했습니다',
  )
})

test('S30: 키보드 조작', async ({ page }) => {
  await page.goto(detailUrl)
  const firstRow = rows(page).first()

  // 행 진입(Enter)
  await firstRow.focus()
  await expect(firstRow).toBeFocused()
  await expectFocusOutline(firstRow)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1\/observations\/1$/)

  // 첨부 chip 다운로드 — 행 다음 초점이 chip 이고 Enter 는 행 이동을 일으키지 않는다.
  await page.goto(detailUrl)
  await rows(page).first().focus()
  await page.keyboard.press('Tab')
  const chip = rows(page)
    .first()
    .getByRole('button', { name: '상처사진.jpg 다운로드' })
  await expect(chip).toBeFocused()
  await expectFocusOutline(chip)
  const downloadPromise = page.waitForEvent('download')
  await page.keyboard.press('Enter')
  expect((await downloadPromise).suggestedFilename()).toBe('상처사진.jpg')
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)

  // `외 N개` — 초점이 오면 팝오버가 열리고 Enter 는 행 이동을 일으키지 않는다.
  await page.keyboard.press('Tab')
  const more = rows(page).first().getByText('외 2개')
  await expect(more).toBeFocused()
  await expectFocusOutline(more)
  await expect(attachmentPopover(page, firstTitle)).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)

  // 카드 케밥 열기와 항목 실행
  const cardTrigger = cardMenuTrigger(page)
  await cardTrigger.focus()
  await expectFocusOutline(cardTrigger)
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('menu', { name: '동식이 개체 메뉴 열기' }),
  ).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('menuitem', { name: '수정' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('menuitem', { name: '삭제' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(deleteDialog(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(deleteDialog(page)).toHaveCount(0)

  // 행 케밥 열기와 항목 실행 — `⋮` 의 Enter 는 행 이동을 일으키지 않는다.
  const rowTrigger = rowMenuTrigger(page, firstTitle)
  await rowTrigger.focus()
  await expectFocusOutline(rowTrigger)
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('menu', { name: `${firstTitle} 관찰 메뉴 열기` }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('menuitem', { name: '수정' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(
    /\/species\/1\/individuals\/1\/observations\/1\/edit$/,
  )
})

// 포커스 표시는 outline 이다(직접 지정한 solid 또는 브라우저 기본 focus ring auto).
async function expectFocusOutline(locator: Locator) {
  await expect(locator).toBeFocused()
  await expect(locator).not.toHaveCSS('outline-style', 'none')
}

function rows(page: Page) {
  return page.getByTestId('observation-row')
}

function observationRow(page: Page, title: string) {
  return rows(page).filter({ hasText: title })
}

// DataTable 헤더행은 행들과 같은 표 카드의 첫 줄이다.
function headerCells(page: Page) {
  return rows(page)
    .first()
    .locator('xpath=..')
    .locator(':scope > div')
    .first()
    .locator(':scope > div')
}

function sectionHeading(page: Page, count: number) {
  return page.getByRole('heading', {
    level: 2,
    name: new RegExp(`^관찰 및 특이사항\\s*${count}건$`),
  })
}

function cardMenuTrigger(page: Page) {
  return page.getByRole('button', { name: '동식이 개체 메뉴 열기' })
}

function rowMenuTrigger(page: Page, title: string) {
  return page.getByRole('button', { name: `${title} 관찰 메뉴 열기` })
}

function attachmentPopover(page: Page, title: string) {
  return page.getByRole('group', { name: `${title} 첨부` })
}

function deleteDialog(page: Page) {
  return page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
}

function noteValue(page: Page) {
  return page
    .locator('dt', { hasText: '기타정보' })
    .locator('xpath=following-sibling::dd[1]')
}

async function openIndividualDeleteDialog(page: Page) {
  await cardMenuTrigger(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(deleteDialog(page)).toBeVisible()
}

async function openObservationDeleteDialog(page: Page, title: string) {
  await rowMenuTrigger(page, title).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(deleteDialog(page)).toBeVisible()
}
