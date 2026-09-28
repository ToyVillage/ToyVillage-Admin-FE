import { expect, test as base, type Page } from '@playwright/test'
import {
  errorBody,
  feedAdminDetailPattern,
  mockFeedApi,
  todayIsoDate,
  type FeedApiHandle,
} from './support/feed-api'

// 승인된 시나리오(feed-edit.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 목록·상세 조회는 `support/feed-api` 의 page.route mock 이고, 수정·삭제는 퍼블리싱 mock 이다.

const test = base.extend<{ feedApi: FeedApiHandle }>({
  feedApi: [
    async ({ page }, runTest) => {
      await runTest(await mockFeedApi(page))
    },
    { auto: true },
  ],
})

const rows = (page: Page) => page.getByTestId('feed-row')
const firstKebab = (page: Page) =>
  page.getByRole('button', { name: '표범 · 레오 급여 기록 메뉴' })
const menu = (page: Page) =>
  page.getByRole('menu', { name: '표범 · 레오 급여 기록 메뉴' })
const confirmDialog = (page: Page) => page.getByRole('alertdialog')
const field = (page: Page, label: string) => page.getByLabel(label)
const saveButton = (page: Page) =>
  page.getByRole('button', { name: '저장하기' })

async function openList(page: Page, path = '/feeds') {
  await page.goto(path)
  await expect(rows(page).first()).toContainText('표범')
}

async function openEdit(page: Page) {
  await openList(page)
  await firstKebab(page).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(
    page.getByRole('heading', { name: '급여 기록 수정' }),
  ).toBeVisible()
}

test('S1: 목록 행 케밥에서 수정·삭제 메뉴가 열린다', async ({ page }) => {
  await openList(page)

  await firstKebab(page).click()

  await expect(menu(page).getByRole('menuitem')).toHaveText(['수정', '삭제'])
  await expect(page).toHaveURL(/\/feeds(\?.*)?$/)
})

test('S2: 수정을 고르면 기존 값이 채워진 수정 화면으로 간다', async ({
  page,
}) => {
  await openEdit(page)

  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)
  await expect(
    page.getByText('표범 · 레오의 급여 기록을 수정합니다'),
  ).toBeVisible()
  await expect(field(page, '대상 개체')).toHaveValue('표범 · 레오')
  await expect(field(page, '급여일시')).toHaveValue(
    `${todayIsoDate().replaceAll('-', '.')} 09:30`,
  )
  await expect(field(page, '급여자')).toHaveValue('김수인')
  for (const label of ['대상 개체', '급여일시', '급여자']) {
    await expect(field(page, label)).toHaveAttribute('readonly', '')
  }
  await expect(field(page, '먹이 종류')).toHaveValue('생닭')
  await expect(field(page, '급여량')).toHaveValue('1.2')
  await expect(page.getByText('kg', { exact: true })).toBeVisible()
  await expect(field(page, '특이사항')).toHaveValue(
    '평소보다 식욕이 왕성함. 잔반 없음.',
  )
})

test('S3: 값을 고쳐 저장하면 목록으로 돌아가 수정 성공 토스트를 띄운다', async ({
  page,
}) => {
  await openEdit(page)

  await field(page, '먹이 종류').fill('닭가슴살')
  await field(page, '급여량').fill('2.5kg')
  await field(page, '특이사항').fill('잔반 조금 남김')
  await saveButton(page).click()

  await expect(page).toHaveURL(/\/feeds(\?.*)?$/)
  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()

  await page.reload()
  await expect(rows(page).first()).toBeVisible()
  await expect(page.getByText('데이터 수정에 성공했습니다')).toHaveCount(0)
})

test('S4: 삭제를 확인하면 성공 토스트가 뜬다', async ({ page, feedApi }) => {
  await openList(page)
  const listRequests = feedApi.requests.list

  await firstKebab(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await confirmDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(confirmDialog(page)).toBeHidden()
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect.poll(() => feedApi.requests.list).toBeGreaterThan(listRequests)
})

test('S5: 먹이 종류·급여량을 비우면 두 오류를 함께 보이고 저장하지 않는다', async ({
  page,
}) => {
  await openEdit(page)

  await field(page, '먹이 종류').fill('')
  await field(page, '급여량').fill('   ')
  await saveButton(page).click()

  await expect(page.getByRole('alert')).toContainText([
    '먹이 종류를 입력해주세요!',
    '급여량을 입력해주세요!',
  ])
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)
})

test('S6: 급여량에는 숫자만 들어가고 0 이하는 숫자 오류를 보인다', async ({
  page,
}) => {
  await openEdit(page)
  const amount = field(page, '급여량')

  await amount.fill('많이')
  await expect(amount).toHaveValue('')
  await amount.fill('2 kg')
  await expect(amount).toHaveValue('2')
  await amount.fill('1.2.3')
  await expect(amount).toHaveValue('1.23')
  await expect(page.getByText('kg', { exact: true })).toBeVisible()

  await amount.fill('0')
  await saveButton(page).click()
  await expect(page.getByRole('alert')).toContainText([
    '급여량을 숫자로 입력해주세요!',
  ])
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)
})

test('S7: 오류 줄은 다음 제출 때 다시 검증해야 사라진다', async ({ page }) => {
  await openEdit(page)
  await field(page, '먹이 종류').fill('')
  await field(page, '급여량').fill('')
  await saveButton(page).click()
  await expect(page.getByRole('alert')).toHaveCount(2)

  await field(page, '먹이 종류').fill('생닭')
  await expect(page.getByRole('alert')).toHaveCount(2)
  await saveButton(page).click()

  await expect(page.getByRole('alert')).toContainText([
    '급여량을 입력해주세요!',
  ])
})

test('S8: 읽기 전용 항목은 바꿀 수 없다', async ({ page }) => {
  await openEdit(page)

  for (const [label, value] of [
    ['대상 개체', '표범 · 레오'],
    ['급여자', '김수인'],
  ] as const) {
    await field(page, label).click()
    await page.keyboard.type('변경')
    await expect(field(page, label)).toHaveValue(value)
  }
  const fedAt = await field(page, '급여일시').inputValue()
  await field(page, '급여일시').click()
  await page.keyboard.type('변경')
  await expect(field(page, '급여일시')).toHaveValue(fedAt)
})

test('S9: 바꾼 값이 있으면 뒤로가기 때 이탈을 확인한다', async ({ page }) => {
  await openEdit(page)
  await field(page, '특이사항').fill('바뀐 특이사항')

  await page.getByRole('link', { name: '뒤로가기' }).click()
  const leave = page.getByRole('alertdialog')
  await expect(leave).toContainText('정말 나가시겠습니까?')
  await leave.getByRole('button', { name: '취소' }).click()
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)
  await expect(field(page, '특이사항')).toHaveValue('바뀐 특이사항')

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '확인' })
    .click()
  await expect(page).toHaveURL(/\/feeds(\?.*)?$/)
  await expect(page.getByText(/성공했습니다/)).toHaveCount(0)
})

test('S10: 바꾼 값이 없으면 바로 뒤로 간다', async ({ page }) => {
  await openEdit(page)

  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page.getByRole('alertdialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/feeds(\?.*)?$/)
})

test('S11: 삭제 확인에서 취소하면 아무것도 지우지 않는다', async ({ page }) => {
  await openList(page)

  await firstKebab(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await confirmDialog(page).getByRole('button', { name: '취소' }).click()
  await expect(confirmDialog(page)).toBeHidden()
  await expect(firstKebab(page)).toBeFocused()

  await firstKebab(page).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await expect(confirmDialog(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(confirmDialog(page)).toBeHidden()

  await expect(rows(page).first()).toContainText('표범')
  await expect(page.getByText(/성공했습니다|실패했습니다/)).toHaveCount(0)
})

test('S12: 케밥 메뉴는 Escape 와 바깥 클릭으로 닫힌다', async ({ page }) => {
  await openList(page)

  await firstKebab(page).click()
  await expect(menu(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu(page)).toBeHidden()

  await firstKebab(page).click()
  await expect(menu(page)).toBeVisible()
  await page.getByRole('heading', { name: '먹이 급여 관리' }).click()
  await expect(menu(page)).toBeHidden()
})

test('S13: 없는 기록의 수정 주소는 목록으로 돌려보낸다', async ({ page }) => {
  await page.goto('/feeds/999999/edit')
  await expect(page).toHaveURL(/\/feeds$/)

  await page.goto('/feeds/abc/edit')
  await expect(page).toHaveURL(/\/feeds$/)
})

test('S14: 조회 실패면 안내 문구를 보인다', async ({ page }) => {
  await page.route(feedAdminDetailPattern, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify(errorBody(500, '내부 서버 오류가 발생했습니다.')),
    }),
  )

  await page.goto('/feeds/1/edit')

  await expect(
    page.getByText('급여 기록을 불러오지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(saveButton(page)).toHaveCount(0)
})

test('S15: 목록 조회 조건을 유지한 채 수정하고 돌아온다', async ({ page }) => {
  const search = `?date=${todayIsoDate()}&tab=${encodeURIComponent('포유류')}`
  await openList(page, `/feeds${search}`)

  await firstKebab(page).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/feeds\/1\/edit$/)
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect.poll(() => new URL(page.url()).search).toBe(search)
  await expect(page.getByRole('button', { name: '포유류' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
