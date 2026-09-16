import { expect, test as base, type Page } from '@playwright/test'
import {
  mockFeedApi,
  todayIsoDate,
  type FeedApiHandle,
} from './support/feed-api'

// 승인된 시나리오(feed-list.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 먹이 급여 API 연동 이후 mock 데이터 대신 `support/feed-api` 의 page.route mock 을 쓴다.
// 실제 서버는 호출하지 않는다.

const test = base.extend<{ feedApi: FeedApiHandle }>({
  feedApi: [
    async ({ page }, runTest) => {
      await runTest(await mockFeedApi(page))
    },
    { auto: true },
  ],
})

const rows = (page: Page) => page.getByTestId('feed-row')

test('S1: 목록 진입 기본 표시', async ({ page }) => {
  await page.goto('/feeds')

  await expect(
    page.getByRole('heading', { name: '먹이 급여 관리' }),
  ).toBeVisible()
  await expect(
    page.getByText('포유류·파충류·조류·어류별 먹이 급여 내역'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '조회 연도' })).toBeVisible()
  await expect(page.getByRole('button', { name: '조회 월' })).toBeVisible()
  await expect(page.getByRole('button', { name: '조회 일' })).toBeVisible()
  await expect(page.getByRole('button', { name: '전체' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  // 대상 개체는 종·개체명 두 열로 나뉜다.
  await expect(page.getByText('종', { exact: true })).toBeVisible()
  await expect(page.getByText('개체명')).toBeVisible()
  await expect(page.getByText('먹이 종류 · 급여량')).toBeVisible()
  await expect(page.getByText('급여자')).toBeVisible()
  // 급여일시는 날짜·시간 두 열로 나뉜다.
  await expect(page.getByText('급여날짜')).toBeVisible()
  await expect(page.getByText('급여시간')).toBeVisible()
  await expect(rows(page)).toHaveCount(4)
})

test('S2: 조회날짜 드롭다운 선택', async ({ page }) => {
  await page.goto('/feeds')
  await page.getByRole('button', { name: '2 페이지' }).click()

  const lastYear = String(new Date().getFullYear() - 1)
  await page.getByRole('button', { name: '조회 연도' }).click()
  await page.getByRole('option', { name: `${lastYear}년` }).click()

  await expect(page.getByRole('listbox', { name: '조회 연도' })).toBeHidden()
  await expect(page.getByRole('button', { name: '조회 연도' })).toContainText(
    `${lastYear}년`,
  )
  // 다른 날짜에는 급여 내역이 없어 1페이지 빈 상태로 리셋된다.
  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: '2 페이지' })).toBeHidden()
})

test('S3: 드롭다운 바깥 클릭으로 닫기', async ({ page }) => {
  await page.goto('/feeds')

  const yearTrigger = page.getByRole('button', { name: '조회 연도' })
  const label = await yearTrigger.textContent()
  await yearTrigger.click()
  await expect(page.getByRole('listbox', { name: '조회 연도' })).toBeVisible()

  await page.getByRole('heading', { name: '먹이 급여 관리' }).click()

  await expect(page.getByRole('listbox', { name: '조회 연도' })).toBeHidden()
  await expect(yearTrigger).toHaveText(String(label))
})

test('S4: 분류 탭 전환', async ({ page }) => {
  await page.goto('/feeds')

  await page.getByRole('button', { name: '포유류' }).click()
  await expect(page.getByRole('button', { name: '포유류' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(rows(page)).toHaveCount(4)
  await expect(page.getByRole('button', { name: '2 페이지' })).toBeHidden()

  await page.getByRole('button', { name: '전체' }).click()
  await expect(rows(page)).toHaveCount(4)
  await expect(page.getByRole('button', { name: '2 페이지' })).toBeVisible()
})

test('S5: 행 클릭 → 상세 이동', async ({ page }) => {
  await page.goto('/feeds')
  await rows(page).first().click()

  await expect(page).toHaveURL(/\/feeds\/1$/)
})

test('S6: 페이지네이션', async ({ page }) => {
  await page.goto('/feeds')

  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeDisabled()

  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page)).toHaveCount(2)
  await expect(page.getByRole('button', { name: '이전 페이지' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '다음 페이지' })).toBeDisabled()
})

test('S7: 사이드바에서 진입', async ({ page }) => {
  await page.goto('/notices/list')

  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await page.getByRole('button', { name: '개체관리', exact: true }).click()
  await page.getByRole('link', { name: '먹이 급여 관리' }).click()

  await expect(page).toHaveURL(/\/feeds$/)
  await expect(page.getByRole('dialog', { name: '사이드바' })).toBeHidden()
})

test('S8: 해당 날짜에 급여 내역이 없는 빈 상태', async ({ page }) => {
  await page.goto('/feeds')

  const lastYear = String(new Date().getFullYear() - 1)
  await page.getByRole('button', { name: '조회 연도' }).click()
  await page.getByRole('option', { name: `${lastYear}년` }).click()

  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText(
    '해당 날짜에 급여 내역이 없습니다.',
  )
  await expect(page.getByRole('button', { name: '1 페이지' })).toBeHidden()
})

test('S9: 분류 탭을 바꿔도 조회날짜는 유지된다', async ({ page }) => {
  await page.goto('/feeds')

  await page.getByRole('button', { name: '조회 월' }).click()
  await page.getByRole('option', { name: '01월' }).click()
  // 조회 조건은 URL 로 반영되므로 선택이 트리거에 반영되기를 기다린 뒤 읽는다.
  await expect(page.getByRole('button', { name: '조회 월' })).toContainText(
    '01월',
  )
  const monthLabel = await page
    .getByRole('button', { name: '조회 월' })
    .textContent()

  await page.getByRole('button', { name: '포유류' }).click()
  await page.getByRole('button', { name: '전체' }).click()

  await expect(page.getByRole('button', { name: '조회 월' })).toHaveText(
    String(monthLabel),
  )
})

test('S10: 말일 보정', async ({ page }) => {
  await page.goto('/feeds')

  await page.getByRole('button', { name: '조회 월' }).click()
  await page.getByRole('option', { name: '01월' }).click()
  await page.getByRole('button', { name: '조회 일' }).click()
  await page.getByRole('option', { name: '31일' }).click()

  await page.getByRole('button', { name: '조회 월' }).click()
  await page.getByRole('option', { name: '02월' }).click()

  // 실행 연도가 윤년이면 29일이다.
  const lastDayOfFebruary = new Date(
    new Date().getFullYear(),
    2,
    0,
  ).getDate()
  await expect(page.getByRole('button', { name: '조회 일' })).toContainText(
    `${lastDayOfFebruary}일`,
  )
})

// 조회 연도는 5개뿐이라 스크롤이 없다. 31개인 `조회 일` 로 확인한다.
// 오늘이 월초여도 결과가 같도록 뒤쪽 날짜를 골라 두고 다시 펼친다.
// 화면이 좁아져도 열이 표 밖으로 새지 않고, 날짜는 잘리지 않는다.
test('S14: 화면이 좁으면 표만 가로로 스크롤한다', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 })
  await page.goto('/feeds')
  await expect(rows(page)).toHaveCount(4)

  // 표는 가로로 스크롤되고, 페이지 자체는 가로로 넘치지 않는다.
  const area = page.getByTestId('feed-table-scroll')
  const overflow = await area.evaluate(
    (node) => node.scrollWidth - node.clientWidth,
  )
  expect(overflow).toBeGreaterThan(0)

  const pageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(pageOverflow).toBeLessThanOrEqual(1)

  // 급여날짜는 말줄임 없이 온전히 보인다.
  const dateCell = rows(page).first().getByText(/^\d{4}\.\d{2}\.\d{2}$/)
  const scrollWidth = await dateCell.evaluate((node) => node.scrollWidth)
  const clientWidth = await dateCell.evaluate((node) => node.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
})

// 긴 값이 들어와도 행 높이가 늘지 않고 한 줄로 말줄임한다.
test('S13: 열 폭보다 긴 값은 한 줄로 말줄임한다', async ({ page }) => {
  const longKind = '아주아주아주아주긴이름을가진종이름입니다정말로깁니다'
  await mockFeedApi(page, {
    feedLogs: [
      {
        feedLogId: 1,
        animalId: 1,
        animalKind: longKind,
        animalName: '금이',
        animalTaxonomic: 'FISH',
        feedType: '사료',
        feedAmount: 1,
        name: '관리자',
        feedDateTime: `${todayIsoDate()}T09:30:00`,
        significant: '정상',
      },
    ],
  })

  await page.goto('/feeds')

  const cell = rows(page).first().getByTitle(longKind)
  await expect(cell).toHaveCSS('text-overflow', 'ellipsis')
  await expect(cell).toHaveCSS('white-space', 'nowrap')

  // 한 줄 행 높이(92px)에서 늘지 않는다.
  const box = await rows(page).first().boundingBox()
  expect(box?.height).toBeLessThanOrEqual(93)
})

test('S12: 조회날짜 목록을 펼치면 선택된 항목이 보이게 스크롤된다', async ({
  page,
}) => {
  await page.goto('/feeds')

  await page.getByRole('button', { name: '조회 일' }).click()
  await page.getByRole('option', { name: '28일' }).click()
  await expect(page.getByRole('button', { name: '조회 일' })).toContainText(
    '28일',
  )

  await page.getByRole('button', { name: '조회 일' }).click()
  const list = page.getByRole('listbox', { name: '조회 일' })

  await expect(list.getByRole('option', { selected: true })).toBeInViewport()
  expect(await list.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
})

test('S11: 분류 탭에 해당 개체가 없는 빈 상태', async ({ page }) => {
  await page.goto('/feeds')

  await page.getByRole('button', { name: '어류' }).click()

  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText(
    '해당 날짜에 급여 내역이 없습니다.',
  )
})
