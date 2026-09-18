import type { Page, Route } from '@playwright/test'

// 먹이 급여 관리 화면이 쓰는 API mock.
// 대상: GET /feed-log/admin(date · animalTaxonomic · page · size),
//       GET /feed-log/admin/{feedLogId}, GET /feed-log/admin/history/{animalManageId}.
// 실제 서버는 호출하지 않으며, 각 spec 은 필요한 응답만 page.route 로 덮어쓴다
// (Playwright 는 나중에 등록한 route 를 먼저 매칭한다).

export const feedListPattern = /^https:\/\/[^/]+\/feed-log\/admin(?:\?.*)?$/
export const feedHistoryPattern =
  /^https:\/\/[^/]+\/feed-log\/admin\/history\/(\d+)(?:\?.*)?$/
export const feedAdminDetailPattern =
  /^https:\/\/[^/]+\/feed-log\/admin\/(\d+)(?:\?.*)?$/

export type MockTaxonomic = 'MAMMALS' | 'REPTILES' | 'BIRDS' | 'FISH'

export interface MockFeedLog {
  feedLogId: number
  animalId: number
  animalKind: string
  animalName: string
  animalTaxonomic: MockTaxonomic
  feedType: string
  feedAmount: number
  /** 급여자명 */
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
  feedLog(1, 1, '표범', '레오', 'MAMMALS', '생닭', 1.2, '김수인', `${todayIsoDate()}T09:30:00`, '평소보다 식욕이 왕성함. 잔반 없음.'),
  feedLog(2, 2, '사자', '심바', 'MAMMALS', '소고기', 3, '박도현', `${todayIsoDate()}T09:10:00`, '정상'),
  feedLog(3, 3, '호랑이', '라라', 'MAMMALS', '닭가슴살', 2.5, '김수인', `${todayIsoDate()}T08:40:00`, '잔반 없음'),
  feedLog(4, 4, '곰', '우니', 'MAMMALS', '사료', 1.8, '이서준', `${todayIsoDate()}T08:20:00`, '정상'),
  feedLog(5, 5, '이구아나', '동식이', 'REPTILES', '채소', 0.3, '김수인', `${todayIsoDate()}T08:00:00`, '활동량이 많아 보임.'),
  feedLog(6, 6, '앵무', '초코', 'BIRDS', '견과', 0.1, '이서준', `${todayIsoDate()}T07:40:00`, '정상'),
  // 페이지 크기가 10 이라 오늘치가 두 페이지에 걸치도록 6건을 더 둔다.
  feedLog(20, 20, '치타', '바람', 'MAMMALS', '생닭', 1.1, '김수인', `${todayIsoDate()}T07:20:00`, '정상'),
  feedLog(21, 21, '늑대', '달', 'MAMMALS', '소고기', 2.2, '박도현', `${todayIsoDate()}T07:10:00`, '정상'),
  feedLog(22, 22, '여우', '노을', 'MAMMALS', '사료', 0.9, '이서준', `${todayIsoDate()}T07:00:00`, '정상'),
  feedLog(23, 23, '너구리', '구름', 'MAMMALS', '사료', 0.7, '김수인', `${todayIsoDate()}T06:50:00`, '정상'),
  feedLog(24, 24, '거북', '바위', 'REPTILES', '채소', 0.2, '박도현', `${todayIsoDate()}T06:40:00`, '정상'),
  feedLog(25, 25, '올빼미', '밤', 'BIRDS', '견과', 0.1, '이서준', `${todayIsoDate()}T06:30:00`, '정상'),
  feedLog(7, 1, '표범', '레오', 'MAMMALS', '닭가슴살', 2.5, '김수인', `${shiftedIsoDate(-1)}T17:20:00`, '잔반 없음'),
  feedLog(8, 1, '표범', '레오', 'MAMMALS', '소고기', 3, '박도현', `${shiftedIsoDate(-2)}T09:15:00`, '정상'),
]

function feedLog(
  feedLogId: number,
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
    feedLogId,
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
  history: number
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
    requests: { list: 0, adminDetail: 0, history: 0 },
    listQueries: [],
  }

  await page.route(feedListPattern, async (route) => {
    handle.requests.list += 1
    const query = new URL(route.request().url()).searchParams
    handle.listQueries.push(query)
    await delay(listDelayMs)

    const date = query.get('date')
    const taxonomic = query.get('animalTaxonomic')
    const size = Number(query.get('size') ?? 10)
    // 급여 목록은 1-based 로 요청한다.
    const number = Number(query.get('page') ?? 1)

    const matched = handle.feedLogs.filter(
      (item) =>
        item.feedDateTime.startsWith(`${date}T`) &&
        (taxonomic === null || item.animalTaxonomic === taxonomic),
    )

    await json(route, 200, {
      feedLogs: matched
        .slice((number - 1) * size, number * size)
        .map(toListItem),
      totalPageSize: Math.ceil(matched.length / size),
    })
  })

  await page.route(feedHistoryPattern, async (route) => {
    handle.requests.history += 1
    const animalId = Number(matchId(route, feedHistoryPattern))
    const feeds = handle.feedLogs.filter((item) => item.animalId === animalId)

    await json(route, 200, { feedLogs: feeds.map(toHistoryItem) })
  })

  await page.route(feedAdminDetailPattern, async (route) => {
    handle.requests.adminDetail += 1
    const feedLogId = Number(matchId(route, feedAdminDetailPattern))
    const target = handle.feedLogs.find((item) => item.feedLogId === feedLogId)

    if (!target) {
      await json(route, 404, errorBody(404, '존재하지 않는 급여 기록입니다.'))
      return
    }

    await json(route, 200, {
      animalId: target.animalId,
      staffName: target.name,
      animalKind: target.animalKind,
      animalName: target.animalName,
      animalImageUrl: { fileName: 'leo.png', fileKey: 'animal/leo.png' },
      feedType: target.feedType,
      feedAmount: target.feedAmount,
      feedDateTime: target.feedDateTime,
      significant: target.significant,
    })
  })

  return handle
}

function toListItem(item: MockFeedLog) {
  return {
    feedLogId: item.feedLogId,
    staffName: item.name,
    animalKind: item.animalKind,
    animalName: item.animalName,
    feedType: item.feedType,
    feedAmount: item.feedAmount,
    feedDateTime: item.feedDateTime,
  }
}

function toHistoryItem(item: MockFeedLog) {
  return {
    feedLogId: item.feedLogId,
    staffName: item.name,
    feedType: item.feedType,
    feedAmount: item.feedAmount,
    feedDateTime: item.feedDateTime,
    significant: item.significant,
  }
}

export function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-09-16T09:30:00.000000',
    description: '에러 설명',
  }
}

function matchId(route: Route, pattern: RegExp): string {
  return pattern.exec(route.request().url())?.[1] ?? ''
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
