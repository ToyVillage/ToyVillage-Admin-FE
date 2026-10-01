import { expect, test, type Page } from '@playwright/test'
import { sentryBaseURL } from './support/sentry-server'

// 가짜 DSN 으로 나가는 envelope 를 가로채 Sentry 로 무엇이 가는지 검증한다.
// 실제 Sentry 로는 아무것도 나가지 않는다.

const noticeListApiPath = /^https:\/\/[^/]+\/notice(?:\?.*)?$/

interface SentryEvent {
  exception?: { values?: { type?: string; value?: string }[] }
  tags?: Record<string, unknown>
  fingerprint?: string[]
}

function session(tokens: Record<string, string>) {
  return {
    cookies: [],
    origins: [
      {
        origin: sentryBaseURL,
        localStorage: Object.entries(tokens).map(([name, value]) => ({
          name,
          value,
        })),
      },
    ],
  }
}

test.describe('요청 실패', () => {
  test.use({ storageState: session({ accessToken: 'a1' }) })

  test('200 응답의 형식 검사 실패를 쿼리 키 첫 칸과 함께 보낸다', async ({
    page,
  }) => {
    const events = captureSentryEvents(page)
    await page.route(noticeListApiPath, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ notices: null, totalPageSize: 1 }),
      }),
    )

    await page.goto(`${sentryBaseURL}/notices/list`)

    const message = '공지사항 조회 응답 형식이 올바르지 않습니다.'
    await expect.poll(() => findException(events, message)).toHaveLength(1)
    expect(findException(events, message)[0].tags).toMatchObject({
      'request.kind': 'query',
      'request.key': 'notices',
    })
  })

  test('400 은 API·상태로 보내고 쿼리 실패로 한 번 더 보내지 않는다', async ({
    page,
  }) => {
    const events = captureSentryEvents(page)
    await page.route(noticeListApiPath, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(errorBody(400, '요청이 유효하지 않습니다.')),
      }),
    )

    await page.goto(`${sentryBaseURL}/notices/list`)

    const apiEvents = () =>
      events.filter((event) => event.tags?.['api.path'] === '/notice')
    await expect.poll(() => apiEvents().length).toBeGreaterThan(0)
    expect(apiEvents()[0].tags).toMatchObject({
      'api.method': 'GET',
      'api.status': 400,
    })
    expect(apiEvents()[0].fingerprint).toEqual(['api', 'GET', '/notice', '400'])
    expect(events.filter((event) => event.tags?.['request.kind'])).toEqual([])
  })
})

// 가로채지 못한 API 요청은 끊어 staging 으로 새지 않게 한다. route 는 나중에 등록한 것이 먼저 잡는다.
function captureSentryEvents(page: Page): SentryEvent[] {
  const events: SentryEvent[] = []

  void page.route('**/api.e2e.invalid/**', (route) => route.abort())
  void page.route('**/sentry.e2e.invalid/**', async (route) => {
    events.push(...parseEnvelopeEvents(route.request().postData() ?? ''))
    await route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*' },
      body: '{}',
    })
  })

  return events
}

// envelope 는 줄마다 JSON 이다. 항목 헤더({ type }) 다음 줄이 그 항목의 본문이다.
// 녹화(replay) 항목은 JSON 이 아닌 줄이 섞여 있어 건너뛴다.
function parseEnvelopeEvents(body: string): SentryEvent[] {
  const lines = body.split('\n')
  const events: SentryEvent[] = []

  for (let index = 1; index < lines.length - 1; index += 1) {
    const header = parseJson(lines[index])
    if (header?.type !== 'event') continue

    const event = parseJson(lines[index + 1])
    if (event) events.push(event as SentryEvent)
  }

  return events
}

function parseJson(line: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(line)
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function findException(events: SentryEvent[], value: string) {
  return events.filter((event) =>
    event.exception?.values?.some((exception) => exception.value === value),
  )
}

function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-08-10T22:30:00.000000',
    description: message,
  }
}
