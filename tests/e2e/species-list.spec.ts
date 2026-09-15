import { expect, test, type Locator, type Page } from '@playwright/test'
import { mockTaskApi } from './support/task-api'

// 승인된 시나리오(species-list.approved.json, S1~S30)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스라 실제 API 대신 `entities/species` mock(13종)과
// localStorage 키(`toyvillage:species:deleted` / `toyvillage:species:fail`)를 쓴다.
// 기본 최신순 — `전체` 1페이지는 id 13~4(첫 행 `피라냐`), 2페이지는 `반달가슴곰` `플라밍고` `카피바라`.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    // clear() 는 인증 가드가 보는 세션 토큰까지 지운다. mock 상태만 비우고
    // 보호 경로에 들어갈 수 있도록 토큰을 다시 심는다.
    localStorage.setItem('accessToken', 'species-list-test-token')
  })
})

test('S1: 목록 진입 기본 상태', async ({ page }) => {
  await page.goto('/species')

  await expect(page.getByRole('heading', { name: '개체 카드' })).toBeVisible()
  await expect(page.getByText('토이빌리지의 등록된 개체 목록')).toBeVisible()
  await expect(tab(page, '전체')).toHaveAttribute('aria-pressed', 'true')
  await expect(headerCells(page)).toHaveText([
    '분류군',
    '국명',
    '학명',
    '마리수',
    '',
  ])
  await expect(searchBox(page)).toHaveAttribute(
    'placeholder',
    '개체이름 또는 국명을 입력해주세요',
  )
  await expect(rows(page)).toHaveCount(10)
  await expect(nameCell(rows(page).first())).toHaveText('피라냐')
})

test('S2: 등록 버튼 이동', async ({ page }) => {
  await page.goto('/species')
  await page.getByRole('link', { name: '개체 등록하기' }).click()

  await expect(page).toHaveURL(/\/species\/create$/)
})

test('S3: `포유류` 탭 필터', async ({ page }) => {
  await page.goto('/species')
  await expect(tab(page, '전체')).toHaveAttribute('aria-pressed', 'true')

  await expectTaxonTabFilter(page, '포유류', 5)
})

test('S4: `파충류` 탭 필터', async ({ page }) => {
  await page.goto('/species')

  await expectTaxonTabFilter(page, '파충류', 3)
})

test('S5: `조류` 탭 필터', async ({ page }) => {
  await page.goto('/species')

  await expectTaxonTabFilter(page, '조류', 3)
})

test('S6: `어류` 탭 필터', async ({ page }) => {
  await page.goto('/species')

  await expectTaxonTabFilter(page, '어류', 2)
})

test('S7: `전체` 탭 복귀', async ({ page }) => {
  await page.goto('/species')
  await tab(page, '조류').click()
  await expect(tab(page, '조류')).toHaveAttribute('aria-pressed', 'true')

  await tab(page, '전체').click()

  await expect(tab(page, '전체')).toHaveAttribute('aria-pressed', 'true')
  await expect(rows(page)).toHaveCount(10)
  const taxonGroups = new Set(await taxonCells(page).allTextContents())
  expect(taxonGroups.size).toBeGreaterThan(1)
})

test('S8: 국명 검색', async ({ page }) => {
  await page.goto('/species')
  await expect(tab(page, '전체')).toHaveAttribute('aria-pressed', 'true')

  await searchBox(page).fill('카피')

  await expect(rows(page)).toHaveCount(1)
  await expect(nameCell(rows(page).first())).toHaveText('카피바라')
})

test('S9: 개체명 검색', async ({ page }) => {
  await page.goto('/species')

  // 개체 `동식이` 는 종 `카피바라` 에 속한다(individual mock).
  await searchBox(page).fill('동식')

  await expect(speciesRow(page, '카피바라')).toBeVisible()
})

test('S10: 행 본문 클릭 → 종 상세 이동', async ({ page }) => {
  await page.goto('/species')
  await nameCell(speciesRow(page, '피라냐')).click()

  await expect(page).toHaveURL(/\/species\/13$/)
})

test('S11: 페이지네이션 이동', async ({ page }) => {
  await page.goto('/species')
  await expect(rows(page)).toHaveCount(10)

  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(nameCells(page)).toHaveText([
    '반달가슴곰',
    '플라밍고',
    '카피바라',
  ])
})

test('S12: 마리수 표시', async ({ page }) => {
  await page.goto('/species')

  await tab(page, '포유류').click()
  await expect(countCell(speciesRow(page, '카피바라'))).toHaveText('3')

  await tab(page, '어류').click()
  await expect(countCell(speciesRow(page, '피라냐'))).toHaveText('0')
})

test('S13: 케밥 메뉴 열기', async ({ page }) => {
  await page.goto('/species')
  const trigger = menuTrigger(page, '피라냐')
  await trigger.click()

  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const menu = rowMenu(page, '피라냐')
  await expect(menu.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: '삭제' })).toBeVisible()
  await expect(menu.getByRole('menuitem')).toHaveCount(2)
  // 케밥 클릭은 행 클릭 이동을 발생시키지 않는다.
  await expect(page).toHaveURL(/\/species$/)
})

test('S14: 케밥 메뉴는 하나만 열린다', async ({ page }) => {
  await page.goto('/species')
  await menuTrigger(page, '피라냐').click()
  await expect(rowMenu(page, '피라냐')).toBeVisible()

  // 리드 결정: 열린 메뉴가 Figma `39:8913` 대로 다음 행의 `⋮` 를 덮으므로 마우스로는 누를 수 없어 키보드로 누른다.
  const nextTrigger = menuTrigger(page, '흰동가리')
  await nextTrigger.focus()
  await page.keyboard.press('Enter')

  await expect(menuTrigger(page, '피라냐')).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await expect(nextTrigger).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('menu')).toHaveCount(1)
  await expect(rowMenu(page, '흰동가리')).toBeVisible()
})

test('S15: 케밥 메뉴 닫기', async ({ page }) => {
  await page.goto('/species')
  const trigger = menuTrigger(page, '피라냐')

  await trigger.click()
  await expect(page.getByRole('menu')).toHaveCount(1)
  await page.getByRole('heading', { name: '개체 카드' }).click()
  await expect(page.getByRole('menu')).toHaveCount(0)

  await trigger.click()
  await expect(page.getByRole('menu')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('S16: 케밥 `수정` → 종 수정 이동', async ({ page }) => {
  await page.goto('/species')
  await menuTrigger(page, '피라냐').click()
  await rowMenu(page, '피라냐').getByRole('menuitem', { name: '수정' }).click()

  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(page).toHaveURL(/\/species\/13\/edit$/)
})

test('S17: 케밥 `삭제` → 확인 모달', async ({ page }) => {
  await page.goto('/species')
  await menuTrigger(page, '흰동가리').click()
  await rowMenu(page, '흰동가리')
    .getByRole('menuitem', { name: '삭제' })
    .click()

  await expect(page.getByRole('menu')).toHaveCount(0)
  const dialog = deleteDialog(page)
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('등록된 개체와 관찰 기록도 함께 삭제되며')
  await expect(dialog).toContainText('삭제 후에는 복구할 수 없습니다')
  await expect(dialog.getByRole('button', { name: '취소' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '확인' })).toBeVisible()
})

test('S18: 삭제 취소', async ({ page }) => {
  await page.goto('/species')

  await openDeleteDialog(page, '흰동가리')
  await deleteDialog(page).getByRole('button', { name: '취소' }).click()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(speciesRow(page, '흰동가리')).toBeVisible()

  await openDeleteDialog(page, '흰동가리')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(speciesRow(page, '흰동가리')).toBeVisible()
})

test('S19: 삭제 확인 → 성공 토스트', async ({ page }) => {
  await page.goto('/species')
  await openDeleteDialog(page, '흰동가리')
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(speciesRow(page, '흰동가리')).toHaveCount(0)
  const toast = page
    .getByRole('status')
    .filter({ hasText: '데이터 삭제에 성공했습니다' })
  await expect(toast).toBeVisible()
  await expectTopRight(page, toast)
  await expect(toast).toBeHidden({ timeout: 6000 })
})

test('S20: 페이지네이션 경계 비활성', async ({ page }) => {
  await page.goto('/species')

  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeDisabled()

  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(nameCells(page)).toHaveText([
    '반달가슴곰',
    '플라밍고',
    '카피바라',
  ])

  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeDisabled()
})

test('S21: 탭 전환·검색 입력 시 1페이지로 리셋', async ({ page }) => {
  await page.goto('/species')

  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(nameCell(rows(page).first())).toHaveText('반달가슴곰')
  await tab(page, '포유류').click()
  await expect(nameCell(rows(page).first())).toHaveText('레서판다')
  await tab(page, '전체').click()
  await expect(nameCell(rows(page).first())).toHaveText('피라냐')
  await expect(page.getByRole('button', { name: '1 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(nameCell(rows(page).first())).toHaveText('반달가슴곰')
  await searchBox(page).fill('카피')
  await expect(nameCells(page)).toHaveText(['카피바라'])
})

test('S22: 검색 결과 없음', async ({ page }) => {
  await page.goto('/species')
  await searchBox(page).fill('없는종')

  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
  await expect(paginationButtons(page)).toHaveCount(0)
})

test('S23: 검색어 유지한 채 탭 전환', async ({ page }) => {
  await page.goto('/species')
  await searchBox(page).fill('카피')
  await expect(nameCells(page)).toHaveText(['카피바라'])

  await tab(page, '조류').click()

  await expect(searchBox(page)).toHaveValue('카피')
  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
})

test('S24: 종이 없는 탭 → 빈 상태', async ({ page }) => {
  // 어류 종(흰동가리 12 · 피라냐 13)이 모두 삭제된 상태.
  await page.addInitScript(() => {
    localStorage.setItem(
      'toyvillage:species:deleted',
      JSON.stringify(['12', '13']),
    )
  })
  await page.goto('/species')
  await expect(rows(page)).toHaveCount(10)

  await tab(page, '어류').click()

  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByText('등록된 개체 카드가 없습니다')).toBeVisible()
  await expect(
    page.getByText('오른쪽 위 [개체 등록하기]로 첫 개체 카드를 추가해주세요'),
  ).toBeVisible()
  await expect(paginationButtons(page)).toHaveCount(0)
})

test('S25: 삭제 실패 토스트', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('toyvillage:species:fail', 'delete')
  })
  await page.goto('/species')
  await openDeleteDialog(page, '흰동가리')

  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText(
    '데이터 삭제에 실패했습니다',
  )
  await expect(speciesRow(page, '흰동가리')).toBeVisible()
})

test('S26: 생성 성공 토스트', async ({ page }) => {
  await page.goto('/species/create')
  await page.getByRole('textbox', { name: '국명' }).fill('사막여우')
  await page.getByRole('textbox', { name: '영문명' }).fill('Fennec fox')
  await page.getByRole('textbox', { name: '학명' }).fill('Vulpes zerda')
  await page.getByLabel('사진 파일 선택').setInputFiles({
    name: '사막여우_2026.png',
    mimeType: 'image/png',
    buffer: Buffer.from('species-list-photo'),
  })
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/species$/)
  const toast = page
    .getByRole('status')
    .filter({ hasText: '데이터 생성에 성공했습니다' })
  await expect(toast).toBeVisible()
  await expectTopRight(page, toast)
  await expect(toast).toBeHidden({ timeout: 6000 })
})

test('S27: 마지막 페이지의 유일한 행 삭제', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'toyvillage:species:deleted',
      JSON.stringify(['12', '13']),
    )
  })
  await page.goto('/species')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(nameCells(page)).toHaveText(['카피바라'])

  await openDeleteDialog(page, '카피바라')
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(rows(page)).toHaveCount(10)
  await expect(speciesRow(page, '카피바라')).toHaveCount(0)
  await expect(
    page.getByRole('status').filter({ hasText: '데이터 삭제에 성공했습니다' }),
  ).toBeVisible()
  await expect(paginationButtons(page)).toHaveCount(0)
})

test('S28: 키보드 조작', async ({ page }) => {
  await page.goto('/species')

  // 탭 전환
  const mammalTab = tab(page, '포유류')
  await mammalTab.focus()
  await expectFocusOutline(mammalTab)
  await page.keyboard.press('Enter')
  await expect(mammalTab).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Shift+Tab')
  await expect(tab(page, '전체')).toBeFocused()
  await expectFocusOutline(tab(page, '전체'))
  await page.keyboard.press('Enter')
  await expect(tab(page, '전체')).toHaveAttribute('aria-pressed', 'true')

  // 검색 입력
  await searchBox(page).focus()
  await page.keyboard.type('카피')
  await expect(nameCells(page)).toHaveText(['카피바라'])
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await expect(rows(page)).toHaveCount(10)

  // 정렬 메뉴 선택
  await page.keyboard.press('Tab')
  const sortButton = page.getByRole('button', { name: '종 정렬' })
  await expect(sortButton).toBeFocused()
  await expectFocusOutline(sortButton)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const oldest = page.getByRole('menuitemradio', { name: '오래된순' })
  await expect(oldest).toBeFocused()
  await expectFocusOutline(oldest)
  await page.keyboard.press('Enter')
  await expect(nameCell(rows(page).first())).toHaveText('카피바라')

  // 페이지 이동
  const secondPage = page.getByRole('button', { name: '2 페이지' })
  await secondPage.focus()
  await expectFocusOutline(secondPage)
  await page.keyboard.press('Enter')
  await expect(nameCells(page)).toHaveText(['훔볼트펭귄', '흰동가리', '피라냐'])

  // 케밥 메뉴 열기·항목 선택
  const trigger = menuTrigger(page, '흰동가리')
  await trigger.focus()
  await expectFocusOutline(trigger)
  await page.keyboard.press('Enter')
  await expect(rowMenu(page, '흰동가리')).toBeVisible()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const deleteItem = page.getByRole('menuitem', { name: '삭제' })
  await expect(deleteItem).toBeFocused()
  await expectFocusOutline(deleteItem)
  await page.keyboard.press('Enter')
  await expect(deleteDialog(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  // 모달이 닫힌 뒤 초점이 `⋮` 로 돌아온 다음에 다음 조작으로 넘어간다.
  await expect(trigger).toBeFocused()

  // 행 진입(Enter)
  const row = speciesRow(page, '흰동가리')
  await row.focus()
  await expectFocusOutline(row)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/species\/12$/)
})

test('S29: 사이드바 `개체관리 > 개체 카드`', async ({ page }) => {
  await mockTaskApi(page)
  await page.goto('/tasks')
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await expect(page.getByRole('dialog', { name: '사이드바' })).toBeVisible()

  await page.getByRole('button', { name: '개체관리', exact: true }).click()
  await page.getByRole('link', { name: '개체 카드', exact: true }).click()
  await expect(page).toHaveURL(/\/species$/)
  await expect(page.getByRole('dialog', { name: '사이드바' })).toBeHidden()

  await page.goto('/species/1')
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  const menu = page.getByRole('link', { name: '개체 카드', exact: true })
  await expect(menu).toHaveCSS('color', 'rgb(73, 82, 255)')
  await expect(menu).toHaveCSS('background-color', 'rgb(232, 233, 255)')
})

test('S30: 정렬 전환', async ({ page }) => {
  await page.goto('/species')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(nameCell(rows(page).first())).toHaveText('반달가슴곰')

  await page.getByRole('button', { name: '종 정렬' }).click()
  await page.getByRole('menuitemradio', { name: '오래된순' }).click()

  await expect(page.getByRole('button', { name: '1 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(nameCell(rows(page).first())).toHaveText('카피바라')
})

function rows(page: Page) {
  return page.getByTestId('species-row')
}

function speciesRow(page: Page, koreanName: string) {
  return rows(page).filter({
    has: page.getByText(koreanName, { exact: true }),
  })
}

// 행의 셀 순서: 분류군 / 국명 / 학명 / 마리수 / 케밥.
function rowCell(row: Locator, index: number) {
  return row.locator(':scope > div').nth(index)
}

function nameCell(row: Locator) {
  return rowCell(row, 1)
}

function countCell(row: Locator) {
  return rowCell(row, 3)
}

function taxonCells(page: Page) {
  return rows(page).locator(':scope > div:nth-child(1)')
}

function nameCells(page: Page) {
  return rows(page).locator(':scope > div:nth-child(2)')
}

function headerCells(page: Page) {
  return page
    .getByText('분류군', { exact: true })
    .locator('xpath=..')
    .locator(':scope > div')
}

function tab(page: Page, label: string) {
  return page.getByRole('button', { name: label, exact: true })
}

function searchBox(page: Page) {
  return page.getByRole('searchbox', { name: '종 검색' })
}

function paginationButtons(page: Page) {
  return page.getByRole('button', { name: /페이지$/ })
}

function menuTrigger(page: Page, koreanName: string) {
  return page.getByRole('button', { name: `${koreanName} 관리 메뉴` })
}

function rowMenu(page: Page, koreanName: string) {
  return page.getByRole('menu', { name: `${koreanName} 관리 메뉴` })
}

function deleteDialog(page: Page) {
  return page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
}

// 탭을 누르면 활성이 되고, 분류군 셀이 그 탭인 행만 남는다.
async function expectTaxonTabFilter(page: Page, label: string, count: number) {
  await tab(page, label).click()

  await expect(tab(page, label)).toHaveAttribute('aria-pressed', 'true')
  await expect(rows(page)).toHaveCount(count)
  await expect(taxonCells(page)).toHaveText(Array(count).fill(label))
}

async function openDeleteDialog(page: Page, koreanName: string) {
  await menuTrigger(page, koreanName).click()
  await rowMenu(page, koreanName)
    .getByRole('menuitem', { name: '삭제' })
    .click()
  await expect(deleteDialog(page)).toBeVisible()
}

async function expectTopRight(page: Page, locator: Locator) {
  const box = await locator.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  if (!box || !viewport) return
  expect(box.y).toBeLessThan(viewport.height / 4)
  expect(box.x + box.width).toBeGreaterThan(viewport.width * 0.75)
  expect(box.x).toBeGreaterThan(viewport.width / 2)
}

async function expectFocusOutline(locator: Locator) {
  await expect(locator).toBeFocused()
  await expect(locator).not.toHaveCSS('outline-style', 'none')
}
