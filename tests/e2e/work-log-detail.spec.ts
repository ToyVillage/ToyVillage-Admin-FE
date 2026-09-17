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

test('S6: 체크박스 셀은 chip 으로 표기하고 넘치면 +N 으로 접는다', async ({
  page,
}) => {
  await page.goto('/work-logs/1')
  await expect(rows(page)).toHaveCount(3)

  // 선택 값마다 chip 하나(접힌 chip 포함).
  await expect(chips(page, 0)).toHaveCount(1)
  await expect(chips(page, 1)).toHaveCount(2)
  await expect(chips(page, 2)).toHaveCount(3)

  for (const rowIndex of [0, 1, 2]) {
    const cell = rows(page).nth(rowIndex).locator('> div').nth(4)
    const total = await cell.locator('[data-chip]').count()
    const shown = await cell.locator('[data-chip]:visible').count()
    const counter = cell.locator('[data-chip-counter]')

    expect(shown, `행 ${rowIndex}`).toBeGreaterThan(0)

    // 들어가지 않는 chip 은 반쯤 잘리는 대신 `+N` 으로 접힌다.
    if (shown < total) {
      await expect(counter).toHaveText(`+${total - shown}`)
    } else {
      await expect(counter).toHaveCount(0)
    }

    // 보이는 chip 은 셀 밖으로 삐져나오지 않는다.
    const cellBox = await cell.boundingBox()
    for (let index = 0; index < shown; index += 1) {
      const chipBox = await cell
        .locator('[data-chip]:visible')
        .nth(index)
        .boundingBox()
      expect(
        (chipBox?.x ?? 0) + (chipBox?.width ?? 0),
        `행 ${rowIndex} chip ${index}`,
      ).toBeLessThanOrEqual((cellBox?.x ?? 0) + (cellBox?.width ?? 0) + 1)
    }
  }
})

test('S7: 파일 업로드 셀은 첨부 칩으로 표기한다', async ({ page }) => {
  await page.goto('/work-logs/1')

  await expect(page.getByText('사진', { exact: true })).toBeVisible()
  // 마지막 열(파일 업로드) 셀에 파일명과 다운로드가 있는 칩이 놓인다.
  const fileCell = rows(page).first().locator('> div').last()
  await expect(
    fileCell.getByRole('button', { name: 'feed.png 다운로드' }),
  ).toBeVisible()
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

test('S11: 헤더 셀은 질문명이 길어도 항상 한 줄이다', async ({ page }) => {
  await page.goto('/work-logs/1')

  const header = page.getByTestId('work-log-sheet-header')
  await expect(header.locator('> *')).toHaveCount(7)

  // 두 줄이 되면 헤더 높이가 한 줄(56px) 기준을 넘는다.
  const box = await header.boundingBox()
  expect(box?.height).toBeLessThanOrEqual(57)

  // 질문명이 잘리지도 않는다 — 열 폭이 헤더 텍스트 폭 이상으로 잡힌다.
  const clipped = await header.locator('> *').evaluateAll((cells) =>
    cells.filter((cell) => cell.scrollWidth > cell.clientWidth + 1).length,
  )
  expect(clipped).toBe(0)
})

test('S12: 값 셀을 클릭하면 전체 값 팝오버가 열린다', async ({ page }) => {
  await page.goto('/work-logs/1')

  await rows(page).first().locator('> div').nth(2).locator('button').click()

  const popover = page.getByTestId('work-log-sheet-popover')
  await expect(popover).toBeVisible()
  // 어느 질문의 값인지 함께 보여준다.
  await expect(popover).toContainText('청소방법이 뭔가요?')

  // 크기는 내용이 정한다 — 짧은 값은 작게, 긴 값은 최대 폭 안에서 줄바꿈한다.
  const longBox = await popover.boundingBox()
  expect(longBox?.width ?? 0).toBeLessThanOrEqual(560)

  await page.keyboard.press('Escape')
  await rows(page).first().locator('> div').nth(1).locator('button').click()
  const shortBox = await popover.boundingBox()
  expect(shortBox?.width ?? 0).toBeLessThan(longBox?.width ?? 0)
  await page.keyboard.press('Escape')

  await rows(page).first().locator('> div').nth(2).locator('button').click()
  await expect(popover).toBeVisible()

  // 스크롤해도 닫히지 않고 셀을 따라간다.
  await page.mouse.wheel(0, 120)
  await expect(popover).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(popover).toHaveCount(0)
})

test('S14: 같은 셀을 다시 클릭하면 팝오버가 닫힌다', async ({ page }) => {
  await page.goto('/work-logs/1')

  const cell = rows(page).first().locator('> div').nth(2).locator('button')
  const popover = page.getByTestId('work-log-sheet-popover')

  await cell.click()
  await expect(popover).toBeVisible()

  await cell.click()
  await expect(popover).toHaveCount(0)
})

test('S13: 질문이 많으면 시트만 가로 스크롤하고 구역 열은 고정된다', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/work-logs/1')
  await expect(rows(page)).toHaveCount(3)

  const sheet = page.getByTestId('work-log-sheet')
  const metrics = await sheet.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }))
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth)

  // 페이지 본문은 가로로 스크롤되지 않는다.
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)

  const zoneCell = rows(page).first().locator('> div').first()
  const before = await zoneCell.boundingBox()
  await sheet.evaluate((element) =>
    element.scrollTo({ left: element.scrollWidth }),
  )
  const after = await zoneCell.boundingBox()

  expect(Math.round(after?.x ?? 0)).toBe(Math.round(before?.x ?? 0))
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
  // 접힌 chip 도 DOM 에 남는다. `+N` 배지는 chip 이 아니므로 제외한다.
  return rows(page).nth(rowIndex).locator('> div').nth(4).locator('[data-chip]')
}

function columnWidths(row: Locator) {
  return row
    .locator('> *')
    .evaluateAll((cells) =>
      cells.map((cell) => Math.round(cell.getBoundingClientRect().width)),
    )
}
