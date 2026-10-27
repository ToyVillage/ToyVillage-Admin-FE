import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(excel-download.approved.json: S1~S16)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 다운로드는 아직 mock 경계만 호출한다. 요청 횟수·내용 검증은 API 연동 때 추가한다.

const NOW = new Date('2026-10-20T12:00:00')
const url = '/settings/excel-download'

const targetNames = [
  '개체관리',
  '먹이 급여 관리',
  '업무관리',
  '업무보고',
  '업무일지관리',
  '단체예약',
  '휴관일 관리',
  '공지사항',
  '직원 계정 관리',
]

const main = (page: Page) => page.getByRole('main')
const target = (page: Page, name: string) =>
  page.getByRole('checkbox', { name, exact: true })
const targetCard = (page: Page, name: string) =>
  main(page).getByText(name, { exact: true })
const selectAll = (page: Page) =>
  page.getByRole('checkbox', { name: '전체 선택' })
const preset = (page: Page, name: string) =>
  page.getByRole('radio', { name, exact: true })
const startButton = (page: Page) =>
  page.getByRole('button', { name: /^시작일/ })
const endButton = (page: Page) => page.getByRole('button', { name: /^종료일/ })
const calendar = (page: Page, name: '시작일 선택' | '종료일 선택') =>
  page.getByRole('dialog', { name })
const day = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true })
const summary = (page: Page) =>
  page.getByRole('region', { name: '다운로드 요약' })
const downloadButton = (page: Page) =>
  page.getByRole('button', { name: '엑셀 다운로드' })
const reason = (page: Page) => summary(page).getByRole('status')

async function expectPeriod(page: Page, start: string, end: string) {
  await expect(startButton(page)).toContainText(start)
  await expect(endButton(page)).toContainText(end)
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
})

test('S1: 사이드바 설정 › 엑셀 다운로드 클릭 → 엑셀 다운로드 화면 이동', async ({
  page,
}) => {
  await page.route(/^https:\/\//, (route) => route.abort())
  await page.goto('/')

  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await page.getByRole('button', { name: '설정', exact: true }).click()
  await page.getByRole('link', { name: '엑셀 다운로드' }).click()

  await expect(page).toHaveURL(/\/settings\/excel-download$/)
  await expect(
    page.getByRole('heading', { name: '엑셀 다운로드', level: 1 }),
  ).toBeVisible()
})

test('S2: 첫 진입 → 항목 0개·최근 1개월·다운로드 비활성', async ({ page }) => {
  await page.goto(url)

  for (const name of targetNames) {
    await expect(target(page, name)).not.toBeChecked()
  }
  await expect(selectAll(page)).not.toBeChecked()
  await expect(selectAll(page)).toHaveJSProperty('indeterminate', false)
  await expect(preset(page, '최근 1개월')).toBeChecked()
  await expectPeriod(page, '2026. 09. 20', '2026. 10. 20')
  await expect(summary(page).getByText('0개', { exact: true })).toBeVisible()
  await expect(
    summary(page).getByText('2026. 09. 20 ~ 2026. 10. 20', { exact: true }),
  ).toBeVisible()
  await expect(downloadButton(page)).toBeDisabled()
  await expect(reason(page)).toHaveText('항목을 1개 이상 선택해주세요')
})

test('S3: 항목 카드 클릭 → 선택·해제와 개수 갱신', async ({ page }) => {
  await page.goto(url)

  await targetCard(page, '개체관리').click()

  await expect(target(page, '개체관리')).toBeChecked()
  await expect(summary(page).getByText('1개', { exact: true })).toBeVisible()
  await expect(selectAll(page)).toHaveJSProperty('indeterminate', true)
  await expect(downloadButton(page)).toBeEnabled()
  await expect(reason(page)).toHaveText('')

  await targetCard(page, '개체관리').click()

  await expect(target(page, '개체관리')).not.toBeChecked()
  await expect(summary(page).getByText('0개', { exact: true })).toBeVisible()
  await expect(selectAll(page)).not.toBeChecked()
  await expect(selectAll(page)).toHaveJSProperty('indeterminate', false)
  await expect(downloadButton(page)).toBeDisabled()
  await expect(reason(page)).toHaveText('항목을 1개 이상 선택해주세요')
})

test('S4: 전체 선택 → 9개 선택, 다시 클릭 → 모두 해제', async ({ page }) => {
  await page.goto(url)

  await selectAll(page).click()

  for (const name of targetNames) {
    await expect(target(page, name)).toBeChecked()
  }
  await expect(selectAll(page)).toBeChecked()
  await expect(summary(page).getByText('9개', { exact: true })).toBeVisible()

  await selectAll(page).click()

  for (const name of targetNames) {
    await expect(target(page, name)).not.toBeChecked()
  }
  await expect(summary(page).getByText('0개', { exact: true })).toBeVisible()
})

test('S5: 일부 선택에서 전체 선택 → 모두 해제', async ({ page }) => {
  await page.goto(url)
  await targetCard(page, '개체관리').click()
  await targetCard(page, '먹이 급여 관리').click()
  await targetCard(page, '업무일지관리').click()
  await expect(selectAll(page)).toHaveJSProperty('indeterminate', true)

  await selectAll(page).click()

  for (const name of targetNames) {
    await expect(target(page, name)).not.toBeChecked()
  }
  await expect(selectAll(page)).not.toBeChecked()
  await expect(selectAll(page)).toHaveJSProperty('indeterminate', false)
  await expect(summary(page).getByText('0개', { exact: true })).toBeVisible()
  await expect(downloadButton(page)).toBeDisabled()
  await expect(reason(page)).toHaveText('항목을 1개 이상 선택해주세요')
})

test('S6: 9개를 하나씩 모두 선택 → 전체 선택 상태', async ({ page }) => {
  await page.goto(url)

  for (const name of targetNames) {
    await targetCard(page, name).click()
  }

  await expect(selectAll(page)).toBeChecked()
  await expect(selectAll(page)).toHaveJSProperty('indeterminate', false)
})

test('S7: 오늘·최근 1주·최근 3개월 → 날짜와 요약 기간 변경', async ({
  page,
}) => {
  await page.goto(url)

  await preset(page, '오늘').click()
  await expectPeriod(page, '2026. 10. 20', '2026. 10. 20')
  await expect(
    summary(page).getByText('2026. 10. 20 ~ 2026. 10. 20', { exact: true }),
  ).toBeVisible()

  await preset(page, '최근 1주').click()
  await expectPeriod(page, '2026. 10. 13', '2026. 10. 20')

  await preset(page, '최근 3개월').click()
  await expectPeriod(page, '2026. 07. 20', '2026. 10. 20')
  await expect(
    summary(page).getByText('2026. 07. 20 ~ 2026. 10. 20', { exact: true }),
  ).toBeVisible()
})

test('S8: 전체 기간 → 날짜 비활성·요약 전체 기간, 항목 선택 시 다운로드 가능', async ({
  page,
}) => {
  await page.goto(url)

  await preset(page, '전체 기간').click()

  await expect(startButton(page)).toBeDisabled()
  await expect(endButton(page)).toBeDisabled()
  await expectPeriod(page, '연도. 월. 일', '연도. 월. 일')
  await expect(
    summary(page).getByText('전체 기간', { exact: true }),
  ).toBeVisible()

  await targetCard(page, '개체관리').click()

  await expect(downloadButton(page)).toBeEnabled()
})

test('S9: 직접 선택 → 종료일 비움·시작일 달력 열림·다운로드 비활성', async ({
  page,
}) => {
  await page.goto(url)
  await targetCard(page, '개체관리').click()

  await preset(page, '직접 선택').click()

  await expectPeriod(page, '2026. 09. 20', '연도. 월. 일')
  await expect(calendar(page, '시작일 선택')).toBeVisible()
  await expect(downloadButton(page)).toBeDisabled()
  await expect(reason(page)).toHaveText('종료일을 선택해주세요')
  await expect(
    summary(page).getByText('2026. 09. 20 ~', { exact: true }),
  ).toBeVisible()
})

test('S10: 달력으로 종료일 선택 → 다운로드 활성·요약 갱신', async ({
  page,
}) => {
  await page.goto(url)
  await targetCard(page, '개체관리').click()
  await preset(page, '직접 선택').click()
  await page.keyboard.press('Escape')
  await expect(calendar(page, '시작일 선택')).toBeHidden()

  await endButton(page).click()
  await calendar(page, '종료일 선택')
    .getByRole('button', { name: '2026년 10월 15일', exact: true })
    .click()

  await expect(calendar(page, '종료일 선택')).toBeHidden()
  await expectPeriod(page, '2026. 09. 20', '2026. 10. 15')
  await expect(
    summary(page).getByText('2026. 09. 20 ~ 2026. 10. 15', { exact: true }),
  ).toBeVisible()
  await expect(downloadButton(page)).toBeEnabled()
})

test('S11: 날짜를 바꾸면 기간 버튼이 직접 선택으로 바뀐다', async ({
  page,
}) => {
  await page.goto(url)
  await expect(preset(page, '최근 1개월')).toBeChecked()

  await startButton(page).click()
  await calendar(page, '시작일 선택')
    .getByRole('button', { name: '2026년 9월 25일', exact: true })
    .click()

  await expect(preset(page, '직접 선택')).toBeChecked()
  await expect(startButton(page)).toContainText('2026. 09. 25')
})

test('S12: 종료일 달력에서 시작일보다 앞선 날짜는 고를 수 없다', async ({
  page,
}) => {
  await page.goto(url)

  await endButton(page).click()
  const endCalendar = calendar(page, '종료일 선택')
  await endCalendar.getByRole('button', { name: '이전 달' }).click()

  await expect(day(page, '2026년 9월 19일')).toBeDisabled()
  await expect(day(page, '2026년 9월 20일')).toBeEnabled()
})

test('S13: 시작일을 종료일 뒤로 바꾸면 종료일이 빈다', async ({ page }) => {
  await page.goto(url)
  await targetCard(page, '개체관리').click()

  await startButton(page).click()
  const startCalendar = calendar(page, '시작일 선택')
  await startCalendar.getByRole('button', { name: '다음 달' }).click()
  await startCalendar
    .getByRole('button', { name: '2026년 10월 25일', exact: true })
    .click()

  await expectPeriod(page, '2026. 10. 25', '연도. 월. 일')
  await expect(downloadButton(page)).toBeDisabled()
  await expect(reason(page)).toHaveText('종료일을 선택해주세요')
})

test('S14: 달력에서 Esc → 값 유지·달력 닫힘·날짜 버튼으로 포커스 복귀', async ({
  page,
}) => {
  await page.goto(url)

  await startButton(page).click()
  await expect(calendar(page, '시작일 선택')).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(
    calendar(page, '시작일 선택').getByRole('button', { name: '이전 달' }),
  ).toBeFocused()

  await page.keyboard.press('Escape')

  await expect(calendar(page, '시작일 선택')).toBeHidden()
  await expect(startButton(page)).toBeFocused()
  await expect(startButton(page)).toContainText('2026. 09. 20')
})

test('S15: 다운로드 버튼 연속 클릭 → 오류 없이 화면 상태 유지', async ({
  page,
}) => {
  const errors: Error[] = []
  page.on('pageerror', (error) => errors.push(error))
  await page.goto(url)
  await targetCard(page, '개체관리').click()

  await downloadButton(page).click({ clickCount: 2 })

  await expect(page).toHaveURL(/\/settings\/excel-download$/)
  await expect(target(page, '개체관리')).toBeChecked()
  await expectPeriod(page, '2026. 09. 20', '2026. 10. 20')
  await expect(downloadButton(page)).toBeEnabled()
  expect(errors).toEqual([])
})

test('S16: 키보드만으로 항목·기간·날짜 선택 후 다운로드 버튼까지 이동', async ({
  page,
}) => {
  await page.goto(url)

  await selectAll(page).focus()
  await page.keyboard.press('Space')
  await expect(summary(page).getByText('9개', { exact: true })).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(target(page, '개체관리')).toBeFocused()
  await page.keyboard.press('Space')
  await expect(target(page, '개체관리')).not.toBeChecked()
  await expect(summary(page).getByText('8개', { exact: true })).toBeVisible()

  for (let index = 1; index < targetNames.length; index += 1) {
    await page.keyboard.press('Tab')
  }
  await expect(target(page, '직원 계정 관리')).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(preset(page, '최근 1개월')).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(preset(page, '최근 3개월')).toBeChecked()
  await expectPeriod(page, '2026. 07. 20', '2026. 10. 20')

  await page.keyboard.press('Tab')
  await expect(startButton(page)).toBeFocused()
  await page.keyboard.press('Enter')
  const startCalendar = calendar(page, '시작일 선택')
  await expect(startCalendar).toBeVisible()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(
    startCalendar.getByRole('button', { name: '2026년 6월 28일', exact: true }),
  ).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(startCalendar).toBeHidden()
  await expect(startButton(page)).toBeFocused()
  await expect(startButton(page)).toContainText('2026. 06. 28')
  await expect(preset(page, '직접 선택')).toBeChecked()

  await page.keyboard.press('Tab')
  await expect(endButton(page)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(downloadButton(page)).toBeFocused()
  await expect(downloadButton(page)).toBeEnabled()
})
