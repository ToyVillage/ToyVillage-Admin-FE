import { expect, test, type Page } from '@playwright/test'
import {
  mockWorkLogApi,
  todayIsoDate,
  workLogListPattern,
} from '../support/work-log-api'

// 대상: WORK_LOG_QUERY_ALL (GET /work-log) · WORK_LOG_TEMPLATE_QUERY_ALL (GET /work-log/template).
// 서버 페이지네이션(page 는 0부터, size=4)과 date 필터를 검증한다. 실제 서버는 호출하지 않는다.

const templateListPattern = /^https:\/\/[^/]+\/work-log\/template(?:\?.*)?$/

const logRows = (page: Page) => page.getByTestId('work-log-row')
const formRows = (page: Page) => page.getByTestId('work-log-form-row')

test('S1: 진입 시 date=오늘 · page=0 · size=4 로 조회하고 Bearer 토큰을 보낸다', async ({
  page,
}) => {
  const requests: { url: string; headers: Record<string, string> }[] = []
  await mockWorkLogApi(page)
  await page.route(workLogListPattern, async (route) => {
    requests.push({
      url: route.request().url(),
      headers: route.request().headers(),
    })
    await route.fallback()
  })

  await page.goto('/work-logs')
  await expect(logRows(page)).toHaveCount(4)

  expect(requests).toHaveLength(1)
  const query = new URL(requests[0].url).searchParams
  expect(query.get('date')).toBe(todayIsoDate())
  expect(query.get('page')).toBe('0')
  expect(query.get('size')).toBe('4')
  expect(requests[0].headers.authorization).toBe('Bearer test-access-token')
})

test('S2: 2페이지로 가면 page=1 로 다시 조회한다', async ({ page }) => {
  const pages: (string | null)[] = []
  await mockWorkLogApi(page)
  await page.route(workLogListPattern, async (route) => {
    pages.push(new URL(route.request().url()).searchParams.get('page'))
    await route.fallback()
  })

  await page.goto('/work-logs')
  await expect(logRows(page)).toHaveCount(4)
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(logRows(page)).toHaveCount(4)

  expect(pages).toEqual(['0', '1'])
})

test('S3: 양식 관리 탭은 조회날짜를 보내지 않는다', async ({ page }) => {
  const requests: string[] = []
  await mockWorkLogApi(page)
  await page.route(templateListPattern, async (route) => {
    requests.push(route.request().url())
    await route.fallback()
  })

  await page.goto('/work-logs?tab=forms')
  await expect(formRows(page)).toHaveCount(4)

  expect(requests).toHaveLength(1)
  const query = new URL(requests[0]).searchParams
  // 양식은 날짜에 묶이지 않는다 — 양식 관리 탭에 조회날짜 필터가 없다.
  expect(query.get('date')).toBeNull()
  expect(query.get('page')).toBe('0')
  expect(query.get('size')).toBe('4')
})

test('S4: 총 페이지 수는 서버 응답(totalPages)을 따른다', async ({ page }) => {
  await mockWorkLogApi(page)

  await page.goto('/work-logs')

  // 오늘 일지 9건 / size 4 → 3페이지.
  await expect(page.getByRole('button', { name: '3 페이지' })).toBeVisible()
  await expect(page.getByRole('button', { name: '4 페이지' })).toHaveCount(0)
})

test('S5: 목록 응답 형식이 명세와 다르면 오류를 알린다', async ({ page }) => {
  await mockWorkLogApi(page)
  await page.route(workLogListPattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [{ workLogId: 'one' }] }),
    })
  })

  await page.goto('/work-logs')

  await expect(page.getByRole('alert')).toContainText(
    '업무일지를 불러오지 못했습니다.',
  )
})

// 이 앱은 관리자 단일 대상이라 403 을 세션 무효로 다룬다(공통 인터셉터).
test('S6: 403 이면 세션을 끊고 로그인으로 보낸다', async ({ page }) => {
  await mockWorkLogApi(page)
  await page.route(workLogListPattern, async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '접근할 수 있는 권한이 없습니다.',
        status: 403,
        timestamp: '2026-08-08T12:00:00',
        description: '직원(USER) 토큰으로 호출한 경우',
      }),
    })
  })

  await page.goto('/work-logs')

  await expect(page).toHaveURL(/\/login$/)
})
