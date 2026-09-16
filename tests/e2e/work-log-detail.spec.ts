import { expect, test as base, type Locator, type Page } from '@playwright/test'

// 승인된 시나리오(work-log-detail.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.



import { mockWorkLogApi, type WorkLogApiHandle } from './support/work-log-api'

// 업무일지 API 연동 이후 localStorage mock 대신 `support/work-log-api` 의
// page.route mock 을 쓴다. 실제 서버는 호출하지 않는다.
const test = base.extend<{ workLogApi: WorkLogApiHandle }>({
  workLogApi: [
    async ({ page }, runTest) => {
      await runTest(await mockWorkLogApi(page))
    },
    { auto: true },
  ],
})

test('S1: 상세 진입 기본 표시', async ({ page }) => {
  await page.goto('/work-logs/1')

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: /^\d+월 \d+일 업무일지$/ }),
  ).toBeVisible()
  await expect(page.getByText(/^선택 양식: /)).toBeVisible()
  await expect(page.getByText(/^작성자: /)).toBeVisible()
  await expect(page.getByText('설정된 구역')).toBeVisible()
})

test('S2: 목록 행 클릭 → 상세 진입', async ({ page }) => {
  await page.goto('/work-logs')
  await page.getByTestId('work-log-row').first().click()

  await expect(page).toHaveURL(/\/work-logs\/1$/)
  await expect(page.getByRole('heading', { name: /업무일지$/ })).toBeVisible()
})

test('S3: 뒤로가기 → 목록 복귀', async ({ page }) => {
  await page.goto('/work-logs/1')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/work-logs$/)
})

test('S4: 시트 열이 양식의 질문 순서대로 놓인다', async ({ page }) => {
  await page.goto('/work-logs/1')

  // 1 은 질문 유형이 모두 나오는 시트(Figma 541:14081)를 쓴다.
  // S4 는 `설정된 구역` + 질문 순서를 요구하므로 헤더 셀의 나열 순서를 단언한다.
  await expect(
    page.getByTestId('work-log-sheet-header').locator('> *'),
  ).toHaveText([
    '설정된 구역',
    '온도',
    '청소방법이 뭔가요?',
    '습도',
    '청소여부',
    '급여량',
    '사진',
  ])
})

// S4 회귀: 헤더 셀 하한(min-width)이 본문 셀에서 덮어써져 열이 어긋난 적이 있다.
test('S4: 시트 헤더와 본문의 열 폭이 일치한다', async ({ page }) => {
  for (const width of [1440, 1024, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/work-logs/1')

    const header = page.getByTestId('work-log-sheet-header')
    // 시트는 일지·양식 두 응답을 받아야 그려진다. 폭을 재기 전에 열이 다 붙기를 기다린다.
    await expect(header.locator('> *')).toHaveCount(7)

    const headWidths = await columnWidths(header)
    // 시트가 안 그려지면 빈 배열끼리 비교돼 공허하게 통과한다.
    expect(headWidths).toHaveLength(7)

    const rows = page.getByTestId('work-log-sheet-row')
    await expect(rows).toHaveCount(3)

    for (let index = 0; index < (await rows.count()); index += 1) {
      expect(
        await columnWidths(rows.nth(index)),
        `${width}px 행 ${index}`,
      ).toEqual(headWidths)
    }
  }
})

test('S5: 구역 행 표기', async ({ page }) => {
  await page.goto('/work-logs/1')

  await expect(rows(page)).toHaveCount(3)
  await expect(rows(page).nth(0)).toContainText('A1')
  await expect(rows(page).nth(1)).toContainText('A2')
  await expect(rows(page).nth(2)).toContainText('A3')
})

test('S6: 체크박스 셀은 선택 값마다 chip 으로 표기한다', async ({ page }) => {
  await page.goto('/work-logs/1')

  // 체크박스 열은 6번째 셀(구역 + 온도 + 청소방법 + 습도 + 청소여부).
  await expect(chips(page, 0)).toHaveCount(1)
  await expect(chips(page, 1)).toHaveCount(2)
  await expect(chips(page, 2)).toHaveCount(3)
})

test('S7: 파일 업로드 셀은 비워 둔다', async ({ page }) => {
  await page.goto('/work-logs/1')

  await expect(page.getByText('사진', { exact: true })).toBeVisible()
  // 마지막 열(파일 업로드) 셀에는 아무 내용이 없다.
  const fileCell = rows(page).first().locator('> div').last()
  await expect(fileCell).toHaveText('')
})

// 명세상 답변이 없는 구역은 answers 가 빈 배열이다. 그런 구역도 행으로는 그려진다.
test('S8: 일부 구역만 채워진 일지', async ({ page }) => {
  await page.goto('/work-logs/100')

  await expect(rows(page)).toHaveCount(6)
  // 답변이 있는 첫 구역에서 질문 열이 만들어지고, 빈 구역은 값 없이 행만 남는다.
  await expect(rows(page).first()).toContainText('A1')
  await expect(page.getByText('청소방법이 뭔가요?')).toBeVisible()
  await expect(rows(page).nth(1)).toHaveText('A2')
})

test('S9: 장문형 셀은 한 줄로 말줄임한다', async ({ page }) => {
  await page.goto('/work-logs/1')

  const longCell = rows(page).first().locator('> div').nth(2).locator('span')
  await expect(longCell).toHaveCSS('white-space', 'nowrap')
  await expect(longCell).toHaveCSS('text-overflow', 'ellipsis')

  // 행 높이가 한 줄 기준(64px)에서 늘지 않는다.
  const box = await rows(page).first().boundingBox()
  expect(box?.height).toBeLessThanOrEqual(65)
})

test('S10: 없는 일지로 진입', async ({ page }) => {
  await page.goto('/work-logs/999')

  await expect(page).toHaveURL(/\/work-logs$/)
  await expect(
    page.getByRole('heading', { name: '업무일지관리' }),
  ).toBeVisible()
})

function rows(page: Page) {
  return page.getByTestId('work-log-sheet-row')
}

function chips(page: Page, rowIndex: number) {
  return rows(page).nth(rowIndex).locator('> div').nth(4).locator('span')
}

function columnWidths(row: Locator) {
  return row
    .locator('> *')
    .evaluateAll((cells) =>
      cells.map((cell) => Math.round(cell.getBoundingClientRect().width)),
    )
}
