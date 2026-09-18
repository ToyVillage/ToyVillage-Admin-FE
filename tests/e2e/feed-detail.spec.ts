import { expect, test as base, type Page } from '@playwright/test'
import { mockFeedApi, type FeedApiHandle } from './support/feed-api'

// `관찰 및 특이사항 보러가기` 링크가 종 id 를 얻으려고 개체 상세를 함께 조회한다.
// 공용 `mockFeedApi` 에 넣으면 개체관리 스펙의 가짜 서버를 덮어쓰므로 여기서만 건다.
const animalManagePattern = /^https:\/\/[^/]+\/animal-manage\/(\d+)(?:\?.*)?$/

// 승인된 시나리오(feed-detail.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 먹이 급여 API 연동 이후 mock 데이터 대신 `support/feed-api` 의 page.route mock 을 쓴다.
// 실제 서버는 호출하지 않는다.

const test = base.extend<{ feedApi: FeedApiHandle }>({
  feedApi: [
    async ({ page }, runTest) => {
      const handle = await mockFeedApi(page)

      // 개체 사진은 파일 서버에서 받는다. e2e 의 파일 서버 주소는 실제로 닿지 않아
      // 그대로 두면 `ProfilePhoto` 가 `사진 없음` 으로 넘어간다. 1x1 png 로 고정한다.
      await page.route(
        (url) => url.origin === 'https://cdn.e2e.invalid',
        async (route) => {
          await route.fulfill({
            status: 200,
            headers: { 'access-control-allow-origin': '*' },
            contentType: 'image/png',
            body: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
              'base64',
            ),
          })
        },
      )

      // 개체 id 를 그대로 종 id 로 쓴다. 링크 경로만 확인하면 되므로 값 자체는 중요하지 않다.
      await page.route(animalManagePattern, async (route) => {
        const animalManageId = Number(
          animalManagePattern.exec(route.request().url())?.[1] ?? '0',
        )
        const feed = handle.feedLogs.find(
          (item) => item.animalId === animalManageId,
        )

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            animalManageId,
            animalName: feed?.animalName ?? '개체',
            animalGender: 'UNKNOWN',
            birthYear: 2020,
            otherInfo: null,
            animalImage: { fileName: 'photo.png', fileKey: 'photo-key' },
            animalKindId: animalManageId * 10,
          }),
        })
      })

      await runTest(handle)
    },
    { auto: true },
  ],
})

const historyRows = (page: Page) => page.getByTestId('feed-history-row')

test('S1: 상세 진입 기본 표시', async ({ page }) => {
  await page.goto('/feeds/1')

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '레오' })).toBeVisible()
  await expect(page.getByText('급여날짜').first()).toBeVisible()
  await expect(page.getByText('급여시간').first()).toBeVisible()
  await expect(page.getByText('급여자').first()).toBeVisible()
  await expect(page.getByText('먹이 종류', { exact: true })).toBeVisible()
  await expect(page.getByText('급여량', { exact: true })).toBeVisible()
  await expect(page.getByText('특이사항').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: '급여 이력' })).toBeVisible()
})

test('S2: 목록에서 상세로, 뒤로가기로 목록으로', async ({ page }) => {
  await page.goto('/feeds')
  await page.getByTestId('feed-row').first().click()
  await expect(page).toHaveURL(/\/feeds\/1$/)

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/feeds$/)
})

// 상세에 다녀와도 목록의 조회 조건(조회날짜·분류·페이지)이 그대로여야 한다.
test('S2-1: 뒤로가기하면 목록의 조회 조건이 유지된다', async ({ page }) => {
  await page.goto('/feeds')

  await page.getByRole('button', { name: '파충류' }).click()
  await expect(page.getByTestId('feed-row')).toHaveCount(2)

  await page.getByTestId('feed-row').first().click()
  await expect(page).toHaveURL(/\/feeds\/5$/)

  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page.getByRole('button', { name: '파충류' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByTestId('feed-row')).toHaveCount(2)
})

test('S3: 급여 이력 건수와 행 수가 일치한다', async ({ page }) => {
  await page.goto('/feeds/1')

  await expect(page.getByText('3건')).toBeVisible()
  await expect(historyRows(page)).toHaveCount(3)
})

test('S4: 급여 이력 표의 열 구성', async ({ page }) => {
  await page.goto('/feeds/1')

  await expect(page.getByText('급여날짜').last()).toBeVisible()
  await expect(page.getByText('급여시간').last()).toBeVisible()
  await expect(page.getByText('급여자').last()).toBeVisible()
  await expect(page.getByText('먹이 종류 · 급여량')).toBeVisible()
  await expect(page.getByText('특이사항').last()).toBeVisible()
})

test('S5: `관찰 및 특이사항 보러가기` 로 개체 상세로 간다', async ({ page }) => {
  await page.goto('/feeds/1')

  // 급여 기록 1 의 개체는 1, mock 이 주는 종 id 는 10 이다.
  const link = page.getByRole('link', { name: /관찰 및 특이사항 보러가기/ })
  await expect(link).toHaveAttribute(
    'href',
    '/species/10/individuals/1',
  )

  await link.click()
  await expect(page).toHaveURL(/\/species\/10\/individuals\/1$/)
  await expect(
    page.getByRole('heading', { name: '관찰 및 특이사항' }),
  ).toBeVisible()
})

// 급여 이력은 개체 기준이라 조회 중인 급여 기록 자신이 항상 한 건 포함된다.
// 개체 `초코`(6)는 그 한 건뿐이다.
test('S6: 급여 이력이 자기 자신 한 건뿐인 상태', async ({ page }) => {
  await page.goto('/feeds/6')

  await expect(page.getByText('1건')).toBeVisible()
  await expect(historyRows(page)).toHaveCount(1)
})

// 급여날짜는 열 폭이 모자라 말줄임되면 안 된다.
test('S6-1: 급여 이력의 급여날짜는 잘리지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 })
  await page.goto('/feeds/1')
  await expect(historyRows(page)).toHaveCount(3)

  const dateCell = historyRows(page)
    .first()
    .getByText(/^\d{4}\.\d{2}\.\d{2}$/)
  const scrollWidth = await dateCell.evaluate((node) => node.scrollWidth)
  const clientWidth = await dateCell.evaluate((node) => node.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
})

test('S7: 급여 이력 행은 클릭 대상이 아니다', async ({ page }) => {
  await page.goto('/feeds/1')

  await historyRows(page).first().click()
  await expect(page).toHaveURL(/\/feeds\/1$/)
})

test('S8: 진입 시 스크롤은 맨 위다', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 })
  await page.goto('/feeds')
  await page.mouse.wheel(0, 600)

  await page.getByTestId('feed-row').first().click()
  await expect(page).toHaveURL(/\/feeds\/1$/)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThanOrEqual(1)
})

test('S17: 개체 사진을 fileKey 로 만든 URL 로 띄운다', async ({ page }) => {
  await page.goto('/feeds/1')

  // 응답의 `animalImageUrl.fileKey` 를 파일 서버 주소와 합쳐 개체 상세와 같은
  // 사진 컴포넌트에 넘긴다.
  await expect(page.getByRole('img', { name: '레오 사진' })).toHaveAttribute(
    'src',
    'https://cdn.e2e.invalid/animal%2Fleo.png',
  )
})
