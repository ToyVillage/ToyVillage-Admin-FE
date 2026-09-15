import { expect, test, type Locator, type Page } from '@playwright/test'

// 승인된 시나리오(species-detail.approved.json, S1~S33)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스라 실제 API 대신 `entities/species`·`entities/individual` mock 과
// localStorage 실패 주입 키(`toyvillage:species:fail` / `toyvillage:individuals:fail`)를 쓴다.
// 종 1 카피바라 3마리(최신순 두리 → 미미 → 동식이), 종 2 플라밍고 12마리, 종 3 반달가슴곰 2마리,
// 종 4~12 각 1마리, 종 13 피라냐 0마리.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    // clear() 는 인증 가드가 보는 세션 토큰까지 지운다. mock 상태만 비우고
    // 보호 경로에 들어갈 수 있도록 토큰을 다시 심는다.
    localStorage.setItem('accessToken', 'species-detail-test-token')
  })
})

test('S1: 종 상세 진입 기본 상태', async ({ page }) => {
  await page.goto('/species/1')

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: '카피바라' }),
  ).toBeVisible()
  await expect(
    page.getByText('포유류 · Hydrochoerus hydrochaeris', { exact: true }),
  ).toBeVisible()
  for (const label of [
    '국명',
    '분류군',
    '영문명',
    '학명',
    '법정지정분류',
    '세부분류',
  ]) {
    await expect(detailLabel(page, label)).toBeVisible()
  }
  await expect(individualSection(page, 3)).toBeVisible()
  await expect(nameCells(page)).toHaveText(['두리', '미미', '동식이'])
})

test('S2: 개체 표 컬럼과 값', async ({ page }) => {
  await page.goto('/species/1')

  await expect(headerCells(page)).toHaveText(['이름', '성별', '출생연도', ''])
  const firstRow = rows(page).first()
  await expect(rowCell(firstRow, 0)).toHaveText('두리')
  await expect(rowCell(firstRow, 1)).toContainText('수컷')
  await expect(rowCell(firstRow, 2)).toHaveText('2021년')
})

test('S3: 성별 뱃지 3종', async ({ page }) => {
  await page.goto('/species/2')

  const sexCells = rows(page).locator(':scope > div:nth-child(2)')
  for (const label of ['수컷', '암컷', '미상']) {
    await expect(
      sexCells.filter({ hasText: label }).first().getByText(label),
    ).toBeVisible()
  }
})

test('S4: 법정지정분류 여러 개', async ({ page }) => {
  await page.goto('/species/3')

  await expect(
    detailValue(page, '법정지정분류').locator(':scope > * > *'),
  ).toHaveText(['멸종위기 야생생물 I급', '천연기념물'])
})

test('S5: 뒤로가기', async ({ page }) => {
  await page.goto('/species/1')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/species$/)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('S6: 개체 등록하기 이동', async ({ page }) => {
  await page.goto('/species/1')
  await page.getByRole('link', { name: '개체 등록하기' }).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/create$/)
})

test('S7: 행 본문 클릭 → 개체 상세', async ({ page }) => {
  await page.goto('/species/1')
  await rowCell(individualRow(page, '동식이'), 0).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
})

test('S8: 개체명 검색', async ({ page }) => {
  await page.goto('/species/1')
  await searchBox(page).fill('미미')

  await expect(nameCells(page)).toHaveText(['미미'])
  await expect(individualSection(page, 3)).toBeVisible()
})

test('S9: 페이지네이션 이동', async ({ page }) => {
  await page.goto('/species/2')
  await expect(rows(page)).toHaveCount(10)

  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(rows(page)).toHaveCount(2)
})

test('S10: 카드 케밥 메뉴 열기', async ({ page }) => {
  await page.goto('/species/1')
  await speciesMenuTrigger(page).click()

  const menu = speciesMenu(page)
  await expect(menu.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: '삭제' })).toBeVisible()
  await expect(menu.getByRole('menuitem')).toHaveCount(2)
})

test('S11: 카드 케밥 `수정` → 종 수정 이동', async ({ page }) => {
  await page.goto('/species/1')
  await speciesMenuTrigger(page).click()
  await expect(speciesMenu(page)).toBeVisible()

  await speciesMenu(page).getByRole('menuitem', { name: '수정' }).click()

  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(page).toHaveURL(/\/species\/1\/edit$/)
})

test('S12: 카드 케밥 `삭제` → 종 삭제 확인 모달', async ({ page }) => {
  await page.goto('/species/1')
  await speciesMenuTrigger(page).click()
  await expect(speciesMenu(page)).toBeVisible()

  await speciesMenu(page).getByRole('menuitem', { name: '삭제' }).click()

  await expect(page.getByRole('menu')).toHaveCount(0)
  const dialog = deleteDialog(page)
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('등록된 개체와 관찰 기록도 함께 삭제되며')
  await expect(dialog).toContainText('삭제 후에는 복구할 수 없습니다')
})

test('S13: 종 삭제 확인 → 종 목록 이동', async ({ page }) => {
  await page.goto('/species/1')
  await openSpeciesDeleteDialog(page)

  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/species$/)
  await expect(
    page.getByRole('status').filter({ hasText: '데이터 삭제에 성공했습니다' }),
  ).toBeVisible()
})

test('S14: 행 케밥 메뉴 열기', async ({ page }) => {
  await page.goto('/species/1')
  const trigger = individualMenuTrigger(page, '동식이')
  await trigger.click()

  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const menu = individualMenu(page, '동식이')
  await expect(menu.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: '삭제' })).toBeVisible()
  // 케밥 클릭은 행 클릭 이동을 발생시키지 않는다.
  await expect(page).toHaveURL(/\/species\/1$/)
})

test('S15: 행 케밥 `수정` → 개체 수정 이동', async ({ page }) => {
  await page.goto('/species/1')
  await individualMenuTrigger(page, '동식이').click()
  await expect(individualMenu(page, '동식이')).toBeVisible()

  await individualMenu(page, '동식이')
    .getByRole('menuitem', { name: '수정' })
    .click()

  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1\/edit$/)
})

test('S16: 행 케밥 `삭제` → 개체 삭제 확인 모달', async ({ page }) => {
  await page.goto('/species/1')
  await individualMenuTrigger(page, '동식이').click()
  await expect(individualMenu(page, '동식이')).toBeVisible()

  await individualMenu(page, '동식이')
    .getByRole('menuitem', { name: '삭제' })
    .click()

  await expect(page.getByRole('menu')).toHaveCount(0)
  const dialog = deleteDialog(page)
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('등록된 관찰 기록도 함께 삭제되며')
  await expect(dialog).toContainText('삭제 후에는 복구할 수 없습니다')
})

test('S17: 개체 삭제 확인 → 성공 토스트', async ({ page }) => {
  await page.goto('/species/1')
  await openIndividualDeleteDialog(page, '동식이')

  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(individualRow(page, '동식이')).toHaveCount(0)
  await expect(individualSection(page, 2)).toBeVisible()
  const toast = page
    .getByRole('status')
    .filter({ hasText: '데이터 삭제에 성공했습니다' })
  await expect(toast).toBeVisible()
  await expect(toast).toBeHidden({ timeout: 6000 })
})

test('S18: 개체 0마리 빈 상태', async ({ page }) => {
  await page.goto('/species/13')

  await expect(individualSection(page, 0)).toBeVisible()
  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByText('등록된 개체가 없습니다')).toBeVisible()
  await expect(
    page.getByText('오른쪽 위 [개체 등록하기]로 첫 개체를 추가해주세요'),
  ).toBeVisible()
  await expect(searchBox(page)).toBeVisible()
  await expect(paginationButtons(page)).toHaveCount(0)
})

test('S19: 검색 결과 없음', async ({ page }) => {
  await page.goto('/species/1')
  await searchBox(page).fill('없는개체')

  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
  await expect(paginationButtons(page)).toHaveCount(0)
})

test('S20: 검색 시 1페이지로 리셋', async ({ page }) => {
  await page.goto('/species/2')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(nameCells(page)).toHaveText(['노을', '핑키'])

  await searchBox(page).fill('홍')

  await expect(nameCells(page)).toHaveText(['홍시', '분홍이'])
})

test('S21: 페이지네이션 경계 비활성', async ({ page }) => {
  await page.goto('/species/2')

  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeDisabled()

  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page)).toHaveCount(2)

  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeDisabled()
})

test('S22: 케밥 메뉴는 하나만 열린다', async ({ page }) => {
  await page.goto('/species/1')

  // 다른 행의 `⋮`
  await individualMenuTrigger(page, '동식이').click()
  await expect(individualMenu(page, '동식이')).toBeVisible()
  await individualMenuTrigger(page, '미미').click()

  await expect(individualMenuTrigger(page, '동식이')).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await expect(individualMenuTrigger(page, '미미')).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await expect(page.getByRole('menu')).toHaveCount(1)
  await expect(individualMenu(page, '미미')).toBeVisible()

  // 카드 `⋮`
  await page.goto('/species/1')
  await individualMenuTrigger(page, '동식이').click()
  await expect(individualMenu(page, '동식이')).toBeVisible()
  await speciesMenuTrigger(page).click()

  await expect(individualMenuTrigger(page, '동식이')).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await expect(speciesMenuTrigger(page)).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await expect(page.getByRole('menu')).toHaveCount(1)
  await expect(speciesMenu(page)).toBeVisible()
})

test('S23: 케밥 메뉴 닫기', async ({ page }) => {
  await page.goto('/species/1')

  for (const trigger of [
    speciesMenuTrigger(page),
    individualMenuTrigger(page, '동식이'),
  ]) {
    await trigger.click()
    await expect(page.getByRole('menu')).toHaveCount(1)
    await page
      .getByRole('heading', { level: 2, name: '개체', exact: true })
      .click()
    await expect(page.getByRole('menu')).toHaveCount(0)

    await trigger.click()
    await expect(page.getByRole('menu')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  }
})

test('S24: 삭제 취소', async ({ page }) => {
  await page.goto('/species/1')

  const openDialogs = [
    () => openSpeciesDeleteDialog(page),
    () => openIndividualDeleteDialog(page, '동식이'),
  ]
  for (const openDialog of openDialogs) {
    await openDialog()
    await deleteDialog(page).getByRole('button', { name: '취소' }).click()
    await expectDetailUnchanged(page)

    await openDialog()
    await page.keyboard.press('Escape')
    await expectDetailUnchanged(page)
  }
})

test('S25: 종 삭제 실패', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('toyvillage:species:fail', 'delete')
  })
  await page.goto('/species/1')
  await openSpeciesDeleteDialog(page)

  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText(
    '데이터 삭제에 실패했습니다',
  )
  await expect(page).toHaveURL(/\/species\/1$/)
})

test('S26: 개체 삭제 실패', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('toyvillage:individuals:fail', 'delete')
  })
  await page.goto('/species/1')
  await openIndividualDeleteDialog(page, '동식이')

  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText(
    '데이터 삭제에 실패했습니다',
  )
  await expect(individualRow(page, '동식이')).toBeVisible()
  await expect(individualSection(page, 3)).toBeVisible()
})

test('S27: 마지막 개체 삭제 → 빈 상태', async ({ page }) => {
  // 종 4 알락꼬리여우원숭이는 개체 `럭키` 1마리다.
  await page.goto('/species/4')
  await expect(nameCells(page)).toHaveText(['럭키'])

  await openIndividualDeleteDialog(page, '럭키')
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page.getByText('등록된 개체가 없습니다')).toBeVisible()
  await expect(
    page.getByText('오른쪽 위 [개체 등록하기]로 첫 개체를 추가해주세요'),
  ).toBeVisible()
  await expect(individualSection(page, 0)).toBeVisible()
  await expect(paginationButtons(page)).toHaveCount(0)
})

test('S28: 개체 생성 성공 토스트', async ({ page }) => {
  await page.goto('/species/1/individuals/create')
  await page.getByRole('textbox', { name: '개체명' }).fill('보리')
  await page.getByRole('radio', { name: '암컷' }).check()
  await page.getByRole('textbox', { name: '출생연도' }).fill('2024')
  await page.getByLabel('사진 파일 선택').setInputFiles({
    name: '보리_2026.png',
    mimeType: 'image/png',
    buffer: Buffer.from('species-detail-photo'),
  })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  const toast = page
    .getByRole('status')
    .filter({ hasText: '데이터 생성에 성공했습니다' })
  await expect(toast).toBeVisible()
  await expect(toast).toBeHidden({ timeout: 6000 })
})

test('S29: 개체 상세 삭제 후 복귀 토스트', async ({ page }) => {
  await page.goto('/species/1/individuals/1')
  await page.getByRole('button', { name: '동식이 개체 메뉴 열기' }).click()
  await page
    .getByRole('menu', { name: '동식이 개체 메뉴 열기' })
    .getByRole('menuitem', { name: '삭제' })
    .click()
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(
    page.getByRole('status').filter({ hasText: '데이터 삭제에 성공했습니다' }),
  ).toBeVisible()
  await expect(individualRow(page, '동식이')).toHaveCount(0)
})

test('S30: 없는 종', async ({ page }) => {
  await page.goto('/species/999')

  await expect(page.getByText('종을 찾을 수 없습니다.')).toBeVisible()
  const backToList = page.getByRole('link', { name: '목록으로 돌아가기' })
  await expect(backToList).toBeVisible()

  await backToList.click()
  await expect(page).toHaveURL(/\/species$/)
})

test('S31: 빈 값 표시', async ({ page }) => {
  await page.goto('/species/2')

  await expect(detailValue(page, '분류군')).toHaveText('조류')
  await expect(detailValue(page, '법정지정분류')).toHaveText('—')
  await expect(detailValue(page, '세부분류')).toHaveText('—')
})

test('S32: 키보드 조작', async ({ page }) => {
  await page.goto('/species/2')

  // 카드 케밥 열기와 항목 실행
  const cardTrigger = speciesMenuTrigger(page)
  await cardTrigger.focus()
  await expectFocusOutline(cardTrigger)
  await page.keyboard.press('Enter')
  await expect(speciesMenu(page)).toBeVisible()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const cardDeleteItem = speciesMenu(page).getByRole('menuitem', {
    name: '삭제',
  })
  await expect(cardDeleteItem).toBeFocused()
  await expectFocusOutline(cardDeleteItem)
  await page.keyboard.press('Enter')
  await expect(deleteDialog(page)).toContainText(
    '등록된 개체와 관찰 기록도 함께 삭제되며',
  )
  await page.keyboard.press('Escape')
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  // 모달이 닫힌 뒤 초점이 `⋮` 로 돌아온 다음에 다음 조작으로 넘어간다.
  await expect(cardTrigger).toBeFocused()

  // 행 케밥 열기와 항목 실행
  const rowTrigger = individualMenuTrigger(page, '홍시')
  await rowTrigger.focus()
  await expectFocusOutline(rowTrigger)
  await page.keyboard.press('Enter')
  await expect(individualMenu(page, '홍시')).toBeVisible()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const rowDeleteItem = individualMenu(page, '홍시').getByRole('menuitem', {
    name: '삭제',
  })
  await expect(rowDeleteItem).toBeFocused()
  await expectFocusOutline(rowDeleteItem)
  await page.keyboard.press('Enter')
  await expect(deleteDialog(page)).toContainText(
    '등록된 관찰 기록도 함께 삭제되며',
  )
  await page.keyboard.press('Escape')
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(rowTrigger).toBeFocused()

  // 검색 입력
  await searchBox(page).focus()
  await page.keyboard.type('홍')
  await expect(nameCells(page)).toHaveText(['홍시', '분홍이'])
  await page.keyboard.press('Backspace')
  await expect(rows(page)).toHaveCount(10)

  // 정렬 메뉴 선택
  await page.keyboard.press('Tab')
  const sortButton = page.getByRole('button', { name: '개체 정렬' })
  await expect(sortButton).toBeFocused()
  await expectFocusOutline(sortButton)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const oldest = page.getByRole('menuitemradio', { name: '오래된순' })
  await expect(oldest).toBeFocused()
  await expectFocusOutline(oldest)
  await page.keyboard.press('Enter')
  await expect(rowCell(rows(page).first(), 0)).toHaveText('핑키')

  // 페이지 이동
  const secondPage = page.getByRole('button', { name: '2 페이지' })
  await secondPage.focus()
  await expectFocusOutline(secondPage)
  await page.keyboard.press('Enter')
  await expect(nameCells(page)).toHaveText(['분홍이', '홍시'])

  // 행 진입
  const row = individualRow(page, '분홍이')
  await row.focus()
  await expectFocusOutline(row)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/species\/2\/individuals\/14$/)
})

test('S33: 분류군·세부분류 표시', async ({ page }) => {
  await page.goto('/species/1')

  await expect(detailValue(page, '분류군')).toHaveText(
    '포유류 · 설치목 · 천축서과',
  )
  await expect(detailValue(page, '세부분류')).toHaveText('천축서과')
})

function rows(page: Page) {
  return page.getByTestId('individual-row')
}

// 섹션 헤더: 제목 `개체`(h2) 옆에 `N마리` 가 형제 텍스트로 붙는다.
function individualSection(page: Page, count: number) {
  return page
    .getByRole('heading', { level: 2, name: '개체', exact: true })
    .locator('xpath=..')
    .filter({ has: page.getByText(`${count}마리`, { exact: true }) })
}

function individualRow(page: Page, name: string) {
  return rows(page).filter({ has: page.getByText(name, { exact: true }) })
}

// 행의 셀 순서: 이름 / 성별 / 출생연도 / 케밥.
function rowCell(row: Locator, index: number) {
  return row.locator(':scope > div').nth(index)
}

function nameCells(page: Page) {
  return rows(page).locator(':scope > div:nth-child(1)')
}

function headerCells(page: Page) {
  return page
    .getByText('출생연도', { exact: true })
    .locator('xpath=..')
    .locator(':scope > div')
}

function detailLabel(page: Page, label: string) {
  return page.locator('dt', { hasText: new RegExp(`^${label}$`) })
}

function detailValue(page: Page, label: string) {
  return page
    .locator('dl > div')
    .filter({ has: detailLabel(page, label) })
    .locator('dd')
}

function searchBox(page: Page) {
  return page.getByRole('searchbox', { name: '개체 검색' })
}

function paginationButtons(page: Page) {
  return page.getByRole('button', { name: /페이지$/ })
}

function speciesMenuTrigger(page: Page) {
  return page.getByRole('button', { name: /종 메뉴 열기$/ })
}

function speciesMenu(page: Page) {
  return page.getByRole('menu', { name: /종 메뉴 열기$/ })
}

function individualMenuTrigger(page: Page, name: string) {
  return page.getByRole('button', { name: `${name} 개체 메뉴 열기` })
}

function individualMenu(page: Page, name: string) {
  return page.getByRole('menu', { name: `${name} 개체 메뉴 열기` })
}

function deleteDialog(page: Page) {
  return page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
}

async function openSpeciesDeleteDialog(page: Page) {
  await speciesMenuTrigger(page).click()
  await speciesMenu(page).getByRole('menuitem', { name: '삭제' }).click()
  await expect(deleteDialog(page)).toBeVisible()
}

async function openIndividualDeleteDialog(page: Page, name: string) {
  await individualMenuTrigger(page, name).click()
  await individualMenu(page, name)
    .getByRole('menuitem', { name: '삭제' })
    .click()
  await expect(deleteDialog(page)).toBeVisible()
}

// 모달이 닫히고 종 상세 화면·행·`N마리` 가 그대로 남는다(종 1 기준).
async function expectDetailUnchanged(page: Page) {
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/species\/1$/)
  await expect(
    page.getByRole('heading', { level: 1, name: '카피바라' }),
  ).toBeVisible()
  await expect(nameCells(page)).toHaveText(['두리', '미미', '동식이'])
  await expect(individualSection(page, 3)).toBeVisible()
}

async function expectFocusOutline(locator: Locator) {
  await expect(locator).toBeFocused()
  await expect(locator).not.toHaveCSS('outline-style', 'none')
}
