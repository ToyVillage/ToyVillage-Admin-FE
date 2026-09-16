import type { Page, Route } from '@playwright/test'

// 먹이 급여 관리 화면이 쓰는 API mock.
// 대상: GET /feed-log/admin, /feed-log/admin/{feedLogId}, /feed-log/admin/history/{animalManageId},
//       /feed-log/{feedLogId}, /animal-manage/{animalManageId}.
// 실제 서버는 호출하지 않으며, 각 spec 은 필요한 응답만 page.route 로 덮어쓴다
// (Playwright 는 나중에 등록한 route 를 먼저 매칭한다).

export const feedListPattern = /^https:\/\/[^/]+\/feed-log\/admin(?:\?.*)?$/
export const feedHistoryPattern =
  /^https:\/\/[^/]+\/feed-log\/admin\/history\/(\d+)(?:\?.*)?$/
export const feedAdminDetailPattern =
  /^https:\/\/[^/]+\/feed-log\/admin\/(\d+)(?:\?.*)?$/
export const feedOwnDetailPattern =
  /^https:\/\/[^/]+\/feed-log\/(\d+)(?:\?.*)?$/
export const animalManagePattern =
  /^https:\/\/[^/]+\/animal-manage\/(\d+)(?:\?.*)?$/

export type MockTaxonomic = 'MAMMALS' | 'REPTILES' | 'BIRDS' | 'FISH'

export interface MockFeedLog {
  feedId: number
  animalId: number
  animalKind: string
  animalName: string
  animalTaxonomic: MockTaxonomic
  feedType: string
  feedAmount: number
  /** 급여자명 — 관리자 상세의 `name` */
  name: string
  /** `YYYY-MM-DDTHH:mm:ss` */
  feedDateTime: string
  significant: string
}

export function todayIsoDate(): string {
  return isoDate(new Date())
}

function shiftedIsoDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return isoDate(date)
}

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// 오늘 급여 6건(포유류 4 · 파충류 1 · 조류 1 · 어류 0)으로 4행 페이지네이션 2쪽을 만든다.
// 7·8번은 지난 날짜의 `레오`(개체 1) 급여라 목록에는 없고 급여 이력에만 나온다.
export const mockFeedLogs: MockFeedLog[] = [
  feedLog(
    1,
    1,
    '표범',
    '레오',
    'MAMMALS',
    '생닭',
    2,
    '김수인',
    `${todayIsoDate()}T09:30:00`,
    '평소보다 식욕이 왕성함. 잔반 없음.',
  ),
  feedLog(
    2,
    2,
    '사자',
    '심바',
    'MAMMALS',
    '소고기',
    3,
    '박도현',
    `${todayIsoDate()}T09:10:00`,
    '정상',
  ),
  feedLog(
    3,
    3,
    '호랑이',
    '라라',
    'MAMMALS',
    '닭가슴살',
    2,
    '김수인',
    `${todayIsoDate()}T08:40:00`,
    '잔반 없음',
  ),
  feedLog(
    4,
    4,
    '곰',
    '우니',
    'MAMMALS',
    '사료',
    1,
    '이서준',
    `${todayIsoDate()}T08:20:00`,
    '정상',
  ),
  feedLog(
    5,
    5,
    '이구아나',
    '동식이',
    'REPTILES',
    '채소',
    1,
    '김수인',
    `${todayIsoDate()}T08:00:00`,
    '활동량이 많아 보임.',
  ),
  feedLog(
    6,
    6,
    '앵무',
    '초코',
    'BIRDS',
    '견과',
    1,
    '이서준',
    `${todayIsoDate()}T07:40:00`,
    '정상',
  ),
  feedLog(
    7,
    1,
    '표범',
    '레오',
    'MAMMALS',
    '닭가슴살',
    2,
    '김수인',
    `${shiftedIsoDate(-1)}T17:20:00`,
    '잔반 없음',
  ),
  feedLog(
    8,
    1,
    '표범',
    '레오',
    'MAMMALS',
    '소고기',
    3,
    '박도현',
    `${shiftedIsoDate(-2)}T09:15:00`,
    '정상',
  ),
]

function feedLog(
  feedId: number,
  animalId: number,
  animalKind: string,
  animalName: string,
  animalTaxonomic: MockTaxonomic,
  feedType: string,
  feedAmount: number,
  name: string,
  feedDateTime: string,
  significant: string,
): MockFeedLog {
  return {
    feedId,
    animalId,
    animalKind,
    animalName,
    animalTaxonomic,
    feedType,
    feedAmount,
    name,
    feedDateTime,
    significant,
  }
}

export interface FeedApiRequests {
  list: number
  adminDetail: number
  ownDetail: number
  history: number
  animal: number
}

export interface FeedApiHandle {
  feedLogs: MockFeedLog[]
  requests: FeedApiRequests
  listQueries: URLSearchParams[]
}

export interface FeedApiOptions {
  /** 초기 급여 기록. 기본은 시나리오용 8건이다. */
  feedLogs?: MockFeedLog[]
  /** 목록 응답 지연(ms). 로딩 상태를 관찰할 때 쓴다. */
  listDelayMs?: number
}

export async function mockFeedApi(
  page: Page,
  options: FeedApiOptions = {},
): Promise<FeedApiHandle> {
  const {
    feedLogs = mockFeedLogs.map((item) => ({ ...item })),
    listDelayMs = 0,
  } = options

  const handle: FeedApiHandle = {
    feedLogs,
    requests: { list: 0, adminDetail: 0, ownDetail: 0, history: 0, animal: 0 },
    listQueries: [],
  }

  await page.route(feedListPattern, async (route) => {
    handle.requests.list += 1
    const query = new URL(route.request().url()).searchParams
    handle.listQueries.push(query)
    await delay(listDelayMs)

    const date = query.get('date')
    const feeds = handle.feedLogs.filter((item) =>
      item.feedDateTime.startsWith(`${date}T`),
    )

    await json(route, 200, { feedLogs: feeds.map(toListItem) })
  })

  await page.route(feedHistoryPattern, async (route) => {
    handle.requests.history += 1
    const animalId = Number(matchId(route, feedHistoryPattern))
    const feeds = handle.feedLogs.filter((item) => item.animalId === animalId)

    await json(route, 200, { feedLogs: feeds.map(toListItem) })
  })

  await page.route(feedAdminDetailPattern, async (route) => {
    handle.requests.adminDetail += 1
    const target = findFeedLog(handle, route, feedAdminDetailPattern)

    if (!target) {
      await json(route, 404, errorBody(404, '존재하지 않는 급여 기록입니다.'))
      return
    }

    await json(route, 200, {
      animalId: target.animalId,
      name: target.name,
      animalKind: target.animalKind,
      animalName: target.animalName,
      feedType: target.feedType,
      feedAmount: target.feedAmount,
      feedDateTime: target.feedDateTime,
    })
  })

  await page.route(feedOwnDetailPattern, async (route) => {
    handle.requests.ownDetail += 1
    const target = findFeedLog(handle, route, feedOwnDetailPattern)

    if (!target) {
      await json(route, 404, errorBody(404, '존재하지 않는 급여 기록입니다.'))
      return
    }

    await json(route, 200, {
      feedLogId: target.feedId,
      feedType: target.feedType,
      feedAmount: target.feedAmount,
      feedDateTime: target.feedDateTime,
      significant: target.significant,
    })
  })

  await page.route(animalManagePattern, async (route) => {
    handle.requests.animal += 1
    const animalId = Number(matchId(route, animalManagePattern))
    const target = handle.feedLogs.find((item) => item.animalId === animalId)

    if (!target) {
      await json(route, 404, errorBody(404, '존재하지 않는 개체입니다.'))
      return
    }

    await json(route, 200, {
      animalManageId: target.animalId,
      animalName: target.animalName,
      animalTaxonomic: target.animalTaxonomic,
      kindName: target.animalKind,
    })
  })

  return handle
}

function toListItem(item: MockFeedLog) {
  return {
    feedId: item.feedId,
    animalKind: item.animalKind,
    animalName: item.animalName,
  }
}

function findFeedLog(
  handle: FeedApiHandle,
  route: Route,
  pattern: RegExp,
): MockFeedLog | undefined {
  const feedId = Number(matchId(route, pattern))
  return handle.feedLogs.find((item) => item.feedId === feedId)
}

function matchId(route: Route, pattern: RegExp): string {
  return pattern.exec(route.request().url())?.[1] ?? ''
}

export function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-09-16T09:30:00.000000',
    description: '에러 설명',
  }
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function delay(ms: number) {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}
