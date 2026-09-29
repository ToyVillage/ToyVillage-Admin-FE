import { expect, test, type Page } from '@playwright/test'
import {
  analyticsBaseURL,
  analyticsMeasurementId,
} from './support/analytics-server'

// GA 로 나가는 값에 실제 ID·쿼리스트링·이름이 실리지 않는지 dataLayer 로 검증한다.
// gtag.js 는 가로채 빈 스크립트로 응답하므로 GA 로 실제 요청은 나가지 않는다.

type DataLayerEntry = unknown[]

interface PageViewParams {
  page_location: string
  page_title: string
  page_referrer?: string
}

const sessionUser = { name: '홍길동', role: 'APP_ADMIN' }

test.use({ storageState: { cookies: [], origins: [] } })

test('측정 ID 가 없으면 gtag.js 를 로드하지 않는다', async ({ page }) => {
  const gtagRequests = await interceptGtag(page)

  await page.goto('/login')
  await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible()

  expect(gtagRequests).toEqual([])
  expect(await page.evaluate(() => 'dataLayer' in window)).toBe(false)
})

test('페이지뷰는 라우트 패턴으로 보내고 ID·쿼리·이름을 싣지 않는다', async ({
  page,
}) => {
  const gtagRequests = await interceptGtag(page)
  await page.route('**/api.e2e.invalid/**', (route) => route.abort())
  await page.addInitScript((user) => {
    localStorage.setItem('accessToken', 'test-access-token')
    localStorage.setItem('toyvillage.session.user', JSON.stringify(user))
  }, sessionUser)

  // 전체 새로고침으로 들어온 첫 화면은 document.referrer 에 쿼리·ID 가 담긴다.
  await page.goto(
    `${analyticsBaseURL}/species/12/individuals/34?keyword=홍길동`,
    { referer: `${analyticsBaseURL}/tasks/7?keyword=홍길동` },
  )
  await expect.poll(() => readPageViews(page)).toHaveLength(1)

  await navigateInApp(page, '/tasks?page=2')
  // 쿼리만 바뀐 이동은 같은 화면이다.
  await navigateInApp(page, '/tasks?page=3')
  // 리다이렉트만 하는 라우트는 도착 화면만 집계한다.
  await navigateInApp(page, '/notices')
  await expect(page).toHaveURL(/\/notices\/list$/)
  await expect.poll(() => readPageViews(page)).toHaveLength(3)

  const pattern = (path: string) => `${analyticsBaseURL}${path}`
  expect(await readPageViews(page)).toEqual([
    {
      page_location: pattern('/species/:speciesId/individuals/:individualId'),
      page_title: '/species/:speciesId/individuals/:individualId',
      page_referrer: pattern('/tasks/:id'),
    },
    {
      page_location: pattern('/tasks'),
      page_title: '/tasks',
      page_referrer: pattern('/species/:speciesId/individuals/:individualId'),
    },
    {
      page_location: pattern('/notices/list'),
      page_title: '/notices/list',
      page_referrer: pattern('/tasks'),
    },
  ])

  const dataLayer = JSON.stringify(await readDataLayer(page))
  expect(dataLayer).toContain('"role":"APP_ADMIN"')
  expect(dataLayer).not.toContain('홍길동')
  expect(dataLayer).not.toContain('keyword')
  expect(dataLayer).not.toMatch(/\/(?:12|34|7)\b/)
  expect(gtagRequests).toEqual([
    `https://www.googletagmanager.com/gtag/js?id=${analyticsMeasurementId}`,
  ])
})

test('세션 없이 보호 화면에 들어오면 로그인 화면만 집계한다', async ({
  page,
}) => {
  await interceptGtag(page)

  await page.goto(`${analyticsBaseURL}/tasks`)
  await expect(page).toHaveURL(/\/login$/)
  await expect.poll(() => readPageViews(page)).toHaveLength(1)

  expect((await readPageViews(page))[0]).toMatchObject({
    page_location: `${analyticsBaseURL}/login`,
    page_title: '/login',
  })
})

async function interceptGtag(page: Page) {
  const requests: string[] = []

  await page.route('https://www.googletagmanager.com/**', (route) => {
    requests.push(route.request().url())
    return route.fulfill({ contentType: 'text/javascript', body: '' })
  })

  return requests
}

// 라우터는 popstate 로 주소 변경을 받는다. 화면별 링크에 기대지 않고 앱 안 이동을 만든다.
async function navigateInApp(page: Page, path: string) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

async function readDataLayer(page: Page) {
  return page.evaluate(() => {
    const { dataLayer } = window as Window & { dataLayer?: unknown[] }

    return (dataLayer ?? []).map((entry) =>
      Array.from(entry as ArrayLike<unknown>),
    )
  }) as Promise<DataLayerEntry[]>
}

async function readPageViews(page: Page) {
  return (await readDataLayer(page))
    .filter((entry) => entry[0] === 'event' && entry[1] === 'page_view')
    .map((entry) => entry[2] as PageViewParams)
}
