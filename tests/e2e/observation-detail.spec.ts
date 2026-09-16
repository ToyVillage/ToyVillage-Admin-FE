import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  mockAnimalManageApi,
  type AnimalManageApiHandle,
} from './support/animal-manage-api'

// 승인된 시나리오(observation-detail.approved.json, S1~S16 · S13 삭제)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 실제 서버 대신 `page.route` 가짜 서버(`support/animal-manage-api`)를 쓰고, 실패는 `failNext` 로 주입한다.

// 종 1 카피바라 · 개체 1 동식이 · 관찰 1(첨부 3개).
const individualUrl = '/species/1/individuals/1'
const detailUrl = `${individualUrl}/observations/1`
const title = '얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음'
const attachmentNames = ['상처사진.jpg', '상처사진_측면.jpg', '처치기록.pdf']

let api: AnimalManageApiHandle

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    // clear() 는 인증 가드가 보는 세션 토큰까지 지운다. 보호 경로에 들어갈 수 있도록 토큰을 다시 심는다.
    localStorage.setItem('accessToken', 'observation-detail-test-token')
  })
  api = await mockAnimalManageApi(page)
})

test('S1: 상세 진입 기본 표시', async ({ page }) => {
  await page.goto(detailUrl)

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: title }),
  ).toBeVisible()
  await expect(page.getByText('2026.06.01')).toBeVisible()
  await expect(page.getByText('김유영')).toBeVisible()

  // 관찰사항 본문은 fixture 상 제목과 같은 문장이다.
  const contentCard = sectionCard(page, '관찰사항')
  await expect(contentCard).toBeVisible()
  await expect(contentCard).toContainText(title)
  await expect(sectionCard(page, '첨부')).toBeVisible()
})

test('S2: 첨부 전체 표시', async ({ page }) => {
  await page.goto(detailUrl)

  const attachmentCard = sectionCard(page, '첨부')
  for (const fileName of attachmentNames) {
    await expect(
      attachmentCard.getByText(fileName, { exact: true }),
    ).toBeVisible()
    await expect(
      attachmentCard.getByRole('button', { name: `${fileName} 다운로드` }),
    ).toBeVisible()
  }
  await expect(
    attachmentCard.getByRole('button', { name: /다운로드$/ }),
  ).toHaveCount(3)
  await expect(page.getByText(/외 \d+개/)).toHaveCount(0)
})

test('S3: 첨부 다운로드', async ({ page }) => {
  await page.goto(detailUrl)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '상처사진.jpg 다운로드' }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe('상처사진.jpg')
})

test('S4: 뒤로가기', async ({ page }) => {
  await page.goto(detailUrl)
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})

test('S5: 케밥 메뉴 열기', async ({ page }) => {
  await page.goto(detailUrl)
  await menuTrigger(page).click()

  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitem')).toHaveCount(2)
  await expect(menu.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: '삭제' })).toBeVisible()
})

test('S6: 케밥 수정 → 수정 화면 이동', async ({ page }) => {
  await page.goto(detailUrl)
  await menuTrigger(page).click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(
    /\/species\/1\/individuals\/1\/observations\/1\/edit$/,
  )
})

test('S7: 케밥 삭제 → 확인 모달', async ({ page }) => {
  await page.goto(detailUrl)
  await menuTrigger(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()

  // 모달이 열리면 앱 루트가 aria-hidden 이라 role 조회 대신 DOM 으로 메뉴 닫힘을 본다.
  await expect(page.locator('[role="menu"]')).toHaveCount(0)
  await expect(deleteDialog(page)).toBeVisible()
})

test('S8: 삭제 확인 → 개체 상세 이동', async ({ page }) => {
  await page.goto(detailUrl)
  await openDeleteDialog(page)
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/species\/1\/individuals\/1$/)
  await expect(page.getByRole('status')).toContainText(
    '데이터 삭제에 성공했습니다',
  )
  const rows = page.getByTestId('observation-row')
  await expect(rows.first()).toBeVisible()
  await expect(rows.filter({ hasText: title })).toHaveCount(0)
})

test('S9: 첨부 없음', async ({ page }) => {
  await page.goto(`${individualUrl}/observations/3`)

  const attachmentCard = sectionCard(page, '첨부')
  await expect(attachmentCard).toBeVisible()
  await expect(attachmentCard.getByText('—', { exact: true })).toBeVisible()
})

test('S10: 케밥 메뉴 닫기', async ({ page }) => {
  await page.goto(detailUrl)
  const menus = page.locator('[role="menu"]')

  // 바깥 클릭
  await menuTrigger(page).click()
  await expect(menus).toHaveCount(1)
  await page.getByRole('heading', { level: 1, name: title }).click()
  await expect(menus).toHaveCount(0)

  // Escape
  await menuTrigger(page).click()
  await expect(menus).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(menus).toHaveCount(0)
  await expect(menuTrigger(page)).toBeFocused()
})

test('S11: 삭제 취소', async ({ page }) => {
  await page.goto(detailUrl)
  await openDeleteDialog(page)
  await deleteDialog(page).getByRole('button', { name: '취소' }).click()

  await expect(deleteDialog(page)).toHaveCount(0)
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1\/observations\/1$/)
  await expect(
    page.getByRole('heading', { level: 1, name: title }),
  ).toBeVisible()
  await expect(menuTrigger(page)).toBeFocused()
})

test('S12: 삭제 실패', async ({ page }) => {
  api.failNext('observation.delete')
  await page.goto(detailUrl)
  await openDeleteDialog(page)
  await deleteDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(deleteDialog(page)).toHaveCount(0)
  await expect(page.getByRole('alert')).toContainText(
    '데이터 삭제에 실패했습니다',
  )
  await expect(page).toHaveURL(/\/species\/1\/individuals\/1\/observations\/1$/)
  await expect(
    page.getByRole('heading', { level: 1, name: title }),
  ).toBeVisible()
})

test('S14: 없는 관찰 기록', async ({ page }) => {
  await page.goto(`${individualUrl}/observations/9999`)

  await expect(page.getByText('관찰 기록을 찾을 수 없습니다.')).toBeVisible()
  const backLink = page.getByRole('link', { name: '개체 상세로 돌아가기' })
  await expect(backLink).toBeVisible()
  await expect(backLink).toHaveAttribute('href', individualUrl)
})

test('S15: 다른 개체 경로의 관찰 id', async ({ page }) => {
  for (const pathIndividualUrl of [
    '/species/1/individuals/2',
    '/species/2/individuals/1',
  ]) {
    await page.goto(`${pathIndividualUrl}/observations/1`)

    await expect(page.getByText('관찰 기록을 찾을 수 없습니다.')).toBeVisible()
    const backLink = page.getByRole('link', { name: '개체 상세로 돌아가기' })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', pathIndividualUrl)
  }
})

test('S16: 키보드 조작', async ({ page }) => {
  await page.goto(detailUrl)

  // 뒤로가기 포커스
  const backLink = page.getByRole('link', { name: '뒤로가기' })
  await backLink.focus()
  await expectFocusOutline(backLink)

  // 케밥 열기 — 뒤로가기 다음 초점이 `⋮` 다.
  await page.keyboard.press('Tab')
  const trigger = menuTrigger(page)
  await expectFocusOutline(trigger)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menu')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toHaveCount(0)
  await expect(trigger).toBeFocused()

  // 다운로드 버튼 실행 — 닫힌 메뉴 다음 초점이 첫 첨부 칩이다.
  await page.keyboard.press('Tab')
  const firstChip = page.getByRole('button', { name: '상처사진.jpg 다운로드' })
  await expectFocusOutline(firstChip)
  const downloadPromise = page.waitForEvent('download')
  await page.keyboard.press('Enter')
  expect((await downloadPromise).suggestedFilename()).toBe('상처사진.jpg')

  // 메뉴 항목 실행
  await page.keyboard.press('Shift+Tab')
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Enter')
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

function menuTrigger(page: Page) {
  return page.getByRole('button', { name: `${title} 관찰 기록 메뉴 열기` })
}

// `관찰사항`·`첨부` 카드는 h2 라벨을 가진 section 이다.
function sectionCard(page: Page, label: string) {
  return page.locator('section').filter({
    has: page.getByRole('heading', { level: 2, name: label, exact: true }),
  })
}

function deleteDialog(page: Page) {
  return page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
}

async function openDeleteDialog(page: Page) {
  await menuTrigger(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(deleteDialog(page)).toBeVisible()
}
