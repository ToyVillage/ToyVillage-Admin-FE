import { test, expect, type Page } from '@playwright/test'
import { mockActivityApi } from './support/activity-api'

// 승인된 시나리오(activity.approved.json: S1~S13)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 2026-10-20 에만 기록이 있고, 오늘은 2026-10-27(화)로 고정한다.
// 먹이 급여(4층·5층)는 실제 API 를 page.route 가짜 서버로 받는다(support/activity-api — 퍼블리싱 mock 과 같은 값).
// 관찰일지·업무일지는 아직 앱 안의 퍼블리싱 mock 이다.

const NOW = new Date('2026-10-27T10:00:00')
const MOCK_DATE = '2026-10-20'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW)
  await mockActivityApi(page)
})

function dateField(page: Page) {
  return page.getByRole('button', { name: '날짜 선택' })
}

// 표는 디자인 시스템 DataTable 이다. 화면이 그려지기 전에 읽으면 빈 배열이 나오므로 머리 행이 보일 때까지 기다린다.
async function columnHeaders(page: Page) {
  const header = page.getByTestId('activity-table-header')
  await expect(header).toBeVisible()
  return header.locator(':scope > *').allTextContents()
}

test('S1: 기본 진입은 먹이 급여 · 오늘 · 4층이다', async ({ page }) => {
  await page.goto('/activity')
  await expect(page.getByRole('heading', { name: '전체 활동' })).toBeVisible()
  await expect(
    page.getByText('직원이 올린 기록을 날짜별로 한눈에 확인해요'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '먹이 급여' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: '4층' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(dateField(page)).toHaveText('2026. 10. 27 (화)')
  await expect(page.getByRole('button', { name: '오늘' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('S2: 4층 표는 앱 입력 칸만 보여준다', async ({ page }) => {
  await page.goto(`/activity?tab=feed&date=${MOCK_DATE}&floor=4`)
  expect(await columnHeaders(page)).toEqual([
    '일반명',
    '개체명',
    '급여시간',
    '먹이 종류',
    '급여량',
    '잔량',
    '특이사항',
    '급여자',
  ])
  for (const hidden of ['먹이반응', '상태', '사료', '채소류', '단백질']) {
    await expect(
      page
        .getByTestId('activity-table-header')
        .getByText(hidden, { exact: true }),
    ).toHaveCount(0)
  }
  await expect(page.getByText('관찰 필요')).toHaveCount(0)
  await expect(page.getByText(/\d+건$/)).toHaveCount(0)

  const rows = page.getByTestId('activity-row')
  await expect(rows).toHaveCount(22)
  await expect(rows.first()).toContainText('08:40')
  await expect(rows.first()).toContainText('150 g/ml')
  await expect(rows.first()).toContainText('20 g/ml')
  await expect(rows.last()).toContainText('16:22')

  const times = await rows.evaluateAll((elements) =>
    elements.map((element) => element.children[2]?.textContent ?? ''),
  )
  expect(times).toEqual([...times].sort())
})

test('S3: 5층으로 바꾸면 5층 표와 URL 이 바뀐다', async ({ page }) => {
  await page.goto(`/activity?tab=feed&date=${MOCK_DATE}&floor=4`)
  await page.getByRole('button', { name: '5층' }).click()
  await expect(page).toHaveURL(/floor=5/)
  await expect(page.getByTestId('activity-row')).toHaveCount(24)
  expect(await columnHeaders(page)).toEqual([
    '일반명',
    '개체명',
    '먹이 종류',
    '급여량',
    '급여자',
  ])
})

test('S4: 이전·다음 날짜로 하루씩 이동한다', async ({ page }) => {
  await page.goto(`/activity?date=${MOCK_DATE}`)
  await page.getByRole('button', { name: '이전 날짜' }).click()
  await expect(dateField(page)).toHaveText('2026. 10. 19 (월)')
  await expect(page).toHaveURL(/date=2026-10-19/)

  await page.getByRole('button', { name: '다음 날짜' }).click()
  await page.getByRole('button', { name: '다음 날짜' }).click()
  await expect(dateField(page)).toHaveText('2026. 10. 21 (수)')
  await expect(page).toHaveURL(/date=2026-10-21/)
  await expect(page.getByRole('button', { name: '오늘' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})

test('S5: 오늘 버튼은 오늘 날짜로 돌아온다', async ({ page }) => {
  await page.goto(`/activity?date=${MOCK_DATE}`)
  const today = page.getByRole('button', { name: '오늘' })
  await expect(today).toHaveAttribute('aria-pressed', 'false')
  await today.click()
  await expect(dateField(page)).toHaveText('2026. 10. 27 (화)')
  await expect(today).toHaveAttribute('aria-pressed', 'true')
})

test('S6: 달력에서 날짜를 고른다', async ({ page }) => {
  await page.goto(`/activity?date=${MOCK_DATE}`)
  await dateField(page).click()
  const calendar = page.getByRole('dialog', { name: '달력' })
  await expect(calendar).toBeVisible()
  await expect(calendar.getByText('2026년 10월')).toBeVisible()
  await expect(
    calendar.getByRole('button', { name: '2026년 10월 20일' }),
  ).toHaveAttribute('aria-pressed', 'true')

  await calendar.getByRole('button', { name: '다음 달' }).click()
  await expect(calendar.getByText('2026년 11월')).toBeVisible()
  await calendar.getByRole('button', { name: '2026년 11월 3일' }).click()
  await expect(calendar).toBeHidden()
  await expect(dateField(page)).toHaveText('2026. 11. 03 (화)')
})

test('S7: 유형 탭을 바꿔도 날짜는 유지된다', async ({ page }) => {
  await page.goto(`/activity?date=${MOCK_DATE}`)
  await page.getByRole('button', { name: '업무일지' }).click()
  await expect(page).toHaveURL(/tab=work-log/)
  await expect(page).toHaveURL(/date=2026-10-20/)
  expect(await columnHeaders(page)).toEqual([
    '작성시간',
    '양식',
    '제목',
    '작성자',
    '첨부',
  ])

  const rows = page.getByTestId('activity-row')
  await expect(rows.filter({ hasText: '개장 전 점검일지' })).toContainText(
    '정문·매표소 개장 전 점검',
  )
  await expect(rows.filter({ hasText: '오전 순찰일지' })).toContainText('-')
  await expect(rows.filter({ hasText: '개장 전 점검일지' })).toContainText(
    '1개',
  )
})

test('S8: 관찰일지 탭은 앱 관찰 기록 칸을 보여준다', async ({ page }) => {
  await page.goto(`/activity?tab=observation&date=${MOCK_DATE}`)
  await expect(page.getByRole('button', { name: '4층' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '5층' })).toHaveCount(0)
  expect(await columnHeaders(page)).toEqual([
    '작성시간',
    '일반명',
    '개체명',
    '제목',
    '관찰자',
    '첨부',
  ])

  const rows = page.getByTestId('activity-row')
  await expect(rows.filter({ hasText: '식욕 저하 관찰' })).toContainText('-')
  await expect(rows.filter({ hasText: '왼쪽 앞발 절뚝임' })).toContainText(
    '2개',
  )
  const times = await rows.evaluateAll((elements) =>
    elements.map((element) => element.children[0]?.textContent ?? ''),
  )
  expect(times).toEqual([...times].sort())
})

test('S9: 기록이 없는 날은 빈 상태를 보여준다', async ({ page }) => {
  await page.goto('/activity?tab=work-log&date=2026-10-22')
  await expect(
    page.getByText('이 날짜에 올라온 업무일지가 없어요'),
  ).toBeVisible()
  await expect(page.getByText('다른 날짜를 선택해 보세요')).toBeVisible()

  await page.getByRole('button', { name: '먹이 급여' }).click()
  await expect(
    page.getByText('이 날짜에 올라온 먹이 급여 기록이 없어요'),
  ).toBeVisible()

  await page.getByRole('button', { name: '관찰일지' }).click()
  await expect(
    page.getByText('이 날짜에 올라온 관찰일지가 없어요'),
  ).toBeVisible()
})

test('S10: 달력은 바깥 클릭이나 Escape 로 닫히고 날짜는 그대로다', async ({
  page,
}) => {
  await page.goto(`/activity?date=${MOCK_DATE}`)
  const calendar = page.getByRole('dialog', { name: '달력' })

  await dateField(page).click()
  await expect(calendar).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(calendar).toBeHidden()
  await expect(dateField(page)).toHaveText('2026. 10. 20 (화)')

  await dateField(page).click()
  await expect(calendar).toBeVisible()
  await page.getByRole('heading', { name: '전체 활동' }).click()
  await expect(calendar).toBeHidden()
  await expect(dateField(page)).toHaveText('2026. 10. 20 (화)')
})

test('S11: 행을 눌러도 이동하지 않는다', async ({ page }) => {
  await page.goto(`/activity?tab=feed&date=${MOCK_DATE}&floor=4`)
  const url = page.url()
  await page.getByTestId('activity-row').first().click()
  await expect(page).toHaveURL(url)
})

test('S12: 잘못된 쿼리는 기본값으로 본다', async ({ page }) => {
  await page.goto('/activity?tab=unknown&floor=7&date=not-a-date')
  await expect(page.getByRole('button', { name: '먹이 급여' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: '4층' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(dateField(page)).toHaveText('2026. 10. 27 (화)')
})

test('S13: 새로고침해도 탭·날짜·층이 유지된다', async ({ page }) => {
  await page.goto(`/activity?tab=feed&date=${MOCK_DATE}&floor=5`)
  await expect(page.getByTestId('activity-row')).toHaveCount(24)
  await page.reload()
  await expect(page.getByRole('button', { name: '5층' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByTestId('activity-row')).toHaveCount(24)
  await expect(dateField(page)).toHaveText('2026. 10. 20 (화)')
})
