import { expect, test, type Page } from '@playwright/test'
import { mockOpenTimeApi } from './support/open-time-api'

// 승인된 시나리오(operating-hours-edit.approved.json: S1~S12)를 변환한 것.
// 영업시간 API 는 page.route mock 을 쓴다(저장값 없음 → 등록, 있음 → 수정).

const today = new Date()
const month = today.getMonth() + 1
const date = `${today.getFullYear()}-${String(month).padStart(2, '0')}-13`

test.beforeEach(async ({ page }) => {
  await mockOpenTimeApi(page)
})

test('S1: 캘린더 날짜 클릭 → 해당 날짜 영업시간 화면 이동', async ({
  page,
}) => {
  await page.goto('/notices/guide')
  await page
    .getByRole('link', { name: `${today.getFullYear()}년 ${month}월 13일` })
    .click()

  await expect(page).toHaveURL(`/notices/guide/hours/${date}`)
  await expect(
    page.getByRole('heading', { name: `${month}월 13일 영업시간` }),
  ).toBeVisible()
})

test('S2: 저장값이 없는 날짜 → 오전 07:40, 오후 07:40 기본값 표시', async ({
  page,
}) => {
  await page.goto(`/notices/guide/hours/${date}`)

  await expect(page.getByLabel('영업 시작 시')).toHaveValue('07')
  await expect(page.getByLabel('영업 시작 분')).toHaveValue('40')
  await expect(
    page
      .getByRole('group', { name: '영업 시작 오전 오후 선택' })
      .getByRole('button', { name: '오전' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('영업 종료 시')).toHaveValue('07')
  await expect(page.getByLabel('영업 종료 분')).toHaveValue('40')
  await expect(
    page
      .getByRole('group', { name: '영업 종료 오전 오후 선택' })
      .getByRole('button', { name: '오후' }),
  ).toHaveAttribute('aria-pressed', 'true')
})

test('S3: 영업시간 수정 후 저장 → 목록 이동', async ({ page }) => {
  await page.goto(`/notices/guide/hours/${date}`)
  await setOpeningTime(page, '08', '15', '오전')
  await setClosingTime(page, '06', '30', '오후')

  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL('/notices/guide')
})

test('S4: 같은 날짜 다시 열기 → 저장한 값 유지', async ({ page }) => {
  await page.goto(`/notices/guide/hours/${date}`)
  await setOpeningTime(page, '09', '05', '오전')
  await setClosingTime(page, '08', '25', '오후')
  await page.getByRole('button', { name: '저장하기' }).click()

  await page.goto(`/notices/guide/hours/${date}`)

  await expect(page.getByLabel('영업 시작 시')).toHaveValue('09')
  await expect(page.getByLabel('영업 시작 분')).toHaveValue('05')
  await expect(page.getByLabel('영업 종료 시')).toHaveValue('08')
  await expect(page.getByLabel('영업 종료 분')).toHaveValue('25')
})

test('S5: 뒤로가기 → 변경을 저장하지 않고 목록 이동', async ({ page }) => {
  await page.goto(`/notices/guide/hours/${date}`)
  await page.getByLabel('영업 시작 시').fill('10')

  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL('/notices/guide')
  await page.goto(`/notices/guide/hours/${date}`)
  await expect(page.getByLabel('영업 시작 시')).toHaveValue('07')
})

test('S6: 잘못된 시·분 → 저장하지 않고 형식 오류 표시', async ({ page }) => {
  await page.goto(`/notices/guide/hours/${date}`)
  await page.getByLabel('영업 시작 시').fill('13')

  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(`/notices/guide/hours/${date}`)
  await expect(page.getByRole('status')).toHaveText('시간을 확인해 주세요')
  await page.goto(`/notices/guide/hours/${date}`)
  await expect(page.getByLabel('영업 시작 시')).toHaveValue('07')
  await expect(page.getByLabel('영업 시작 분')).toHaveValue('40')
})

test('S7: 종료 시간이 시작 시간과 같거나 빠름 → 저장하지 않고 오류 표시', async ({
  page,
}) => {
  await page.goto(`/notices/guide/hours/${date}`)

  await setOpeningTime(page, '08', '40', '오후')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByRole('status')).toHaveText(
    '영업 종료 시간은 시작 시간보다 늦어야 합니다',
  )
  await page.goto(`/notices/guide/hours/${date}`)
  await expect(page.getByLabel('영업 시작 시')).toHaveValue('07')
  await expect(page.getByLabel('영업 시작 분')).toHaveValue('40')
})

test('S8: 저장 실패 → 입력값과 페이지 유지', async ({ page }) => {
  await mockOpenTimeApi(page, { saveStatus: 500 })
  await page.goto(`/notices/guide/hours/${date}`)
  await setOpeningTime(page, '08', '10', '오전')

  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(`/notices/guide/hours/${date}`)
  await expect(page.getByRole('status')).toHaveText(
    '저장하지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByLabel('영업 시작 시')).toHaveValue('08')
  await expect(page.getByLabel('영업 시작 분')).toHaveValue('10')
  await expect(page.getByRole('button', { name: '저장하기' })).toBeEnabled()
})

test('S9: 시간 입력에서 Enter로 저장', async ({ page }) => {
  await page.goto(`/notices/guide/hours/${date}`)
  await setOpeningTime(page, '08', '15', '오전')
  await setClosingTime(page, '06', '30', '오후')

  await page.getByLabel('영업 종료 분').press('Enter')

  await expect(page).toHaveURL('/notices/guide')
  await page.goto(`/notices/guide/hours/${date}`)
  await expect(page.getByLabel('영업 시작 시')).toHaveValue('08')
  await expect(page.getByLabel('영업 시작 분')).toHaveValue('15')
  await expect(page.getByLabel('영업 종료 시')).toHaveValue('06')
  await expect(page.getByLabel('영업 종료 분')).toHaveValue('30')
})

test('S10: 잘못된 날짜 URL → 휴무일 관리로 replace 이동', async ({ page }) => {
  await page.goto('/notices/guide/hours/2026-02-30')

  await expect(page).toHaveURL('/notices/guide')
  await expect(page.getByRole('heading', { name: '휴무일 관리' })).toBeVisible()
})

test('S11: 저장 버튼 반복 클릭 → 저장 요청 한 번만 실행', async ({ page }) => {
  let saveCount = 0
  await mockOpenTimeApi(page, { onSave: () => (saveCount += 1) })
  await page.goto(`/notices/guide/hours/${date}`)
  await setOpeningTime(page, '08', '15', '오전')
  await setClosingTime(page, '06', '30', '오후')

  await page.getByRole('button', { name: '저장하기' }).click({ clickCount: 2 })

  await expect(page).toHaveURL('/notices/guide')
  expect(saveCount).toBe(1)
})

test('S12: 키보드만으로 시간 입력·오전/오후 선택·저장', async ({ page }) => {
  await page.goto(`/notices/guide/hours/${date}`)
  const openingHour = page.getByLabel('영업 시작 시')
  await openingHour.focus()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('08')
  await page.keyboard.press('Tab')
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('15')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '오전' }).first()).toBeFocused()
  await page.keyboard.press('Space')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('06')
  await page.keyboard.press('Tab')
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('30')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const closingPeriod = page
    .getByRole('group', { name: '영업 종료 오전 오후 선택' })
    .getByRole('button', { name: '오후' })
  await expect(closingPeriod).toBeFocused()
  await page.keyboard.press('Space')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '저장하기' })).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL('/notices/guide')
  await page.goto(`/notices/guide/hours/${date}`)
  await expect(page.getByLabel('영업 시작 시')).toHaveValue('08')
  await expect(page.getByLabel('영업 시작 분')).toHaveValue('15')
  await expect(page.getByLabel('영업 종료 시')).toHaveValue('06')
  await expect(page.getByLabel('영업 종료 분')).toHaveValue('30')
})

async function setOpeningTime(
  page: Page,
  hour: string,
  minute: string,
  meridiem: '오전' | '오후',
) {
  await page.getByLabel('영업 시작 시').fill(hour)
  await page.getByLabel('영업 시작 분').fill(minute)
  await page
    .getByRole('group', { name: '영업 시작 오전 오후 선택' })
    .getByRole('button', { name: meridiem })
    .click()
}

async function setClosingTime(
  page: Page,
  hour: string,
  minute: string,
  meridiem: '오전' | '오후',
) {
  await page.getByLabel('영업 종료 시').fill(hour)
  await page.getByLabel('영업 종료 분').fill(minute)
  await page
    .getByRole('group', { name: '영업 종료 오전 오후 선택' })
    .getByRole('button', { name: meridiem })
    .click()
}
