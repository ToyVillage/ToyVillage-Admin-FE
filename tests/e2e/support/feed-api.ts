import type { Page, Route } from '@playwright/test'

// 먹이 급여 관리 화면이 쓰는 API mock.
// 대상: GET /feed-log/admin(date · animalTaxonomic · page · size),
//       GET /feed-log/admin/{feedLogId}, GET /feed-log/admin/history/{animalManageId},
//       PUT /feed-log/admin/{feedLogId}(관리자 급여일지 수정),
//       DELETE /feed-log/admin/{feedLogId}(관리자 급여일지 삭제 — 성공하면 목록 데이터에서 뺀다).
//       5층: GET /feed-log/fifth-floor/admin(date · page · size), GET·PUT·DELETE /feed-log/fifth-floor/admin/{feedLogId},
//       GET /feed-log/fifth-floor/admin/history/{animalManageId}. 수정·삭제 응답 옵션은 4층과 같이 쓴다.
// 실제 서버는 호출하지 않으며, 각 spec 은 필요한 응답만 page.route 로 덮어쓴다
// (Playwright 는 나중에 등록한 route 를 먼저 매칭한다).

export const feedListPattern = /^https:\/\/[^/]+\/feed-log\/admin(?:\?.*)?$/
export const feedHistoryPattern =
  /^https:\/\/[^/]+\/feed-log\/admin\/history\/(\d+)(?:\?.*)?$/
export const feedAdminDetailPattern =
  /^https:\/\/[^/]+\/feed-log\/admin\/(\d+)(?:\?.*)?$/

export const fifthFloorFeedListPattern =
  /^https:\/\/[^/]+\/feed-log\/fifth-floor\/admin(?:\?.*)?$/
export const fifthFloorFeedHistoryPattern =
  /^https:\/\/[^/]+\/feed-log\/fifth-floor\/admin\/history\/(\d+)(?:\?.*)?$/
export const fifthFloorFeedDetailPattern =
  /^https:\/\/[^/]+\/feed-log\/fifth-floor\/admin\/(\d+)(?:\?.*)?$/

export type MockTaxonomic = 'MAMMALS' | 'REPTILES' | 'BIRDS' | 'FISH'

export interface MockFeedLog {
  feedLogId: number
  animalId: number
  animalKind: string
  animalName: string
  animalTaxonomic: MockTaxonomic
  feedType: string
  feedAmount: number
  /** 잔량(kg). 잔량 도입 전 기록처럼 null 일 수 있다. */
  remainingAmount: number | null
  /** 급여자명 */
  name: string
  /** `YYYY-MM-DDTHH:mm:ss` */
  feedDateTime: string
  significant: string
  /** 급여량·잔량 단위. 없으면 `KGL` 로 응답한다. */
  feedUnit?: 'GML' | 'KGL'
}

/** 테스트용 급여 기록 한 건. 넘긴 값만 덮어쓴다. */
export function mockFeedLog(overrides: Partial<MockFeedLog>): MockFeedLog {
  return {
    feedLogId: 1,
    animalId: 1,
    animalKind: '카피바라',
    animalName: '동식이',
    animalTaxonomic: 'MAMMALS',
    feedType: '염소사료',
    feedAmount: 200,
    remainingAmount: 100,
    name: '이승현',
    feedDateTime: `${todayIsoDate()}T09:30:00`,
    significant: '평소보다 식욕이 왕성함.',
    feedUnit: 'GML',
    ...overrides,
  }
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
    1.2,
    0,
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
    0,
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
    2.5,
    0.3,
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
    1.8,
    0.2,
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
    0.3,
    0,
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
    0.1,
    0,
    '이서준',
    `${todayIsoDate()}T07:40:00`,
    '정상',
  ),
  // 페이지 크기가 10 이라 오늘치가 두 페이지에 걸치도록 6건을 더 둔다.
  feedLog(
    20,
    20,
    '치타',
    '바람',
    'MAMMALS',
    '생닭',
    1.1,
    0,
    '김수인',
    `${todayIsoDate()}T07:20:00`,
    '정상',
  ),
  feedLog(
    21,
    21,
    '늑대',
    '달',
    'MAMMALS',
    '소고기',
    2.2,
    0,
    '박도현',
    `${todayIsoDate()}T07:10:00`,
    '정상',
  ),
  feedLog(
    22,
    22,
    '여우',
    '노을',
    'MAMMALS',
    '사료',
    0.9,
    0,
    '이서준',
    `${todayIsoDate()}T07:00:00`,
    '정상',
  ),
  feedLog(
    23,
    23,
    '너구리',
    '구름',
    'MAMMALS',
    '사료',
    0.7,
    0,
    '김수인',
    `${todayIsoDate()}T06:50:00`,
    '정상',
  ),
  feedLog(
    24,
    24,
    '거북',
    '바위',
    'REPTILES',
    '채소',
    0.2,
    0,
    '박도현',
    `${todayIsoDate()}T06:40:00`,
    '정상',
  ),
  feedLog(
    25,
    25,
    '올빼미',
    '밤',
    'BIRDS',
    '견과',
    0.1,
    0,
    '이서준',
    `${todayIsoDate()}T06:30:00`,
    '정상',
  ),
  feedLog(
    7,
    1,
    '표범',
    '레오',
    'MAMMALS',
    '닭가슴살',
    2.5,
    0,
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
    0.2,
    '박도현',
    `${shiftedIsoDate(-2)}T09:15:00`,
    '정상',
  ),
]

function feedLog(
  feedLogId: number,
  animalId: number,
  animalKind: string,
  animalName: string,
  animalTaxonomic: MockTaxonomic,
  feedType: string,
  feedAmount: number,
  remainingAmount: number | null,
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
    remainingAmount,
    name,
    feedDateTime,
    significant,
  }
}

/** 5층 급여 기록. 5층은 급여 날짜만 있고 잔량·특이사항이 없다. */
export interface MockFifthFloorFeedLog {
  feedLogId: number
  animalId: number
  animalKind: string
  animalName: string
  animalDeleted: boolean
  feedType: string
  feedAmount: number
  feedUnit: 'GML' | 'KGL'
  staffName: string
  /** `YYYY-MM-DD` */
  feedDate: string
}

/** 테스트용 5층 급여 기록 한 건. 기본은 오늘 오스카 · 오돌이(개체 10)다. */
export function mockFifthFloorFeedLog(
  overrides: Partial<MockFifthFloorFeedLog>,
): MockFifthFloorFeedLog {
  return {
    feedLogId: 10,
    animalId: 10,
    animalKind: '오스카',
    animalName: '오돌이',
    animalDeleted: false,
    feedType: '펠렛',
    feedAmount: 15,
    feedUnit: 'GML',
    staffName: '박도현',
    feedDate: todayIsoDate(),
    ...overrides,
  }
}

// 오늘 5층 급여 12건(10번 = 오스카 · 오돌이, 개체 10)과 오돌이의 어제 급여 1건(101번 — 이력에만 나온다).
// 개체 id 는 4층 개체(1~)와 겹치지 않게 500번대로 두고, 오돌이만 개체 상세 mock(10 = 딸기)과 맞춘다.
export const mockFifthFloorFeedLogs: MockFifthFloorFeedLog[] = [
  ...(
    [
      [1, '아로와나', '아로', '냉동새우', 30, '박도현'],
      [2, '메가로도라스', '메가', '침강사료', 15, '박도현'],
      [3, '보도워드', '보도', '침강사료', 10, '박도현'],
      [4, '플라워혼', '혹돌이', '펠렛', 10, '박도현'],
      [5, '오란다', '란이', '플레이크', 5, '박도현'],
      [6, '케이브피쉬', '케이', '플레이크', 3, '박도현'],
      [7, '블랙고스트(대)', '블랙', '냉동장구벌레', 5, '박도현'],
      [8, '수생거북', '수돌이', '거북사료', 20, '박도현'],
      [9, '수생거북', '거북이', '거북사료', 15, '이서준'],
      [10, '오스카', '오돌이', '펠렛', 15, '박도현'],
      [11, '오스카', '오순이', '펠렛', 15, '이서준'],
      [12, '자이언트구라미', '자이언', '펠렛', 1.2, '이서준'],
    ] as const
  ).map(
    ([feedLogId, animalKind, animalName, feedType, feedAmount, staffName]) =>
      mockFifthFloorFeedLog({
        feedLogId,
        animalId: feedLogId === 10 ? 10 : 500 + feedLogId,
        animalKind,
        animalName,
        feedType,
        feedAmount,
        // 마지막 개체는 kg 단위로 기록했다.
        feedUnit: feedLogId === 12 ? 'KGL' : 'GML',
        staffName,
      }),
  ),
  mockFifthFloorFeedLog({
    feedLogId: 101,
    staffName: '이서준',
    feedDate: shiftedIsoDate(-1),
  }),
]

export interface FeedApiRequests {
  list: number
  adminDetail: number
  history: number
}

export interface FeedDeleteRequestRecord {
  feedLogId: number
  authorization: string | undefined
}

export interface FeedUpdateRequestRecord {
  feedLogId: number
  body: unknown
  authorization: string | undefined
}

export interface FeedApiHandle {
  feedLogs: MockFeedLog[]
  requests: FeedApiRequests
  listQueries: URLSearchParams[]
  /** PUT /feed-log/admin/{feedLogId} 요청 기록 */
  updates: FeedUpdateRequestRecord[]
  /** DELETE /feed-log/admin/{feedLogId} 요청 기록 */
  deletes: FeedDeleteRequestRecord[]
  fifthFloor: {
    feedLogs: MockFifthFloorFeedLog[]
    requests: FeedApiRequests
    listQueries: URLSearchParams[]
    /** PUT /feed-log/fifth-floor/admin/{feedLogId} 요청 기록 */
    updates: FeedUpdateRequestRecord[]
    /** DELETE /feed-log/fifth-floor/admin/{feedLogId} 요청 기록 */
    deletes: FeedDeleteRequestRecord[]
  }
}

export interface FeedApiOptions {
  /** 초기 급여 기록. 기본은 시나리오용 8건이다. */
  feedLogs?: MockFeedLog[]
  /** 초기 5층 급여 기록. 기본은 `mockFifthFloorFeedLogs` 다. */
  fifthFloorFeedLogs?: MockFifthFloorFeedLog[]
  /** 목록 응답 지연(ms). 로딩 상태를 관찰할 때 쓴다. */
  listDelayMs?: number
  /** 수정 응답. 기본 200 `{ message }` */
  updateStatus?: number
  updateBody?: unknown
  /** 수정 응답 지연(ms). 중복 제출 확인용 */
  updateDelayMs?: number
  /** 삭제 응답. 기본 200 본문 없음 */
  deleteStatus?: number
  /** 삭제 응답 지연(ms). 중복 삭제 확인용 */
  deleteDelayMs?: number
}

export async function mockFeedApi(
  page: Page,
  options: FeedApiOptions = {},
): Promise<FeedApiHandle> {
  const {
    feedLogs = mockFeedLogs.map((item) => ({ ...item })),
    fifthFloorFeedLogs = mockFifthFloorFeedLogs.map((item) => ({ ...item })),
    listDelayMs = 0,
    updateStatus = 200,
    updateBody,
    updateDelayMs = 0,
    deleteStatus = 200,
    deleteDelayMs = 0,
  } = options

  const handle: FeedApiHandle = {
    feedLogs,
    requests: { list: 0, adminDetail: 0, history: 0 },
    listQueries: [],
    updates: [],
    deletes: [],
    fifthFloor: {
      feedLogs: fifthFloorFeedLogs,
      requests: { list: 0, adminDetail: 0, history: 0 },
      listQueries: [],
      updates: [],
      deletes: [],
    },
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
    const feedLogId = Number(matchId(route, feedAdminDetailPattern))

    if (route.request().method() === 'DELETE') {
      handle.deletes.push({
        feedLogId,
        authorization: route.request().headers().authorization,
      })
      await delay(deleteDelayMs)
      if (deleteStatus !== 200) {
        await json(
          route,
          deleteStatus,
          errorBody(deleteStatus, '존재하지 않는 급여일지입니다.'),
        )
        return
      }
      const index = handle.feedLogs.findIndex(
        (item) => item.feedLogId === feedLogId,
      )
      if (index !== -1) handle.feedLogs.splice(index, 1)
      await route.fulfill({ status: 200 })
      return
    }

    if (route.request().method() === 'PUT') {
      handle.updates.push({
        feedLogId,
        body: route.request().postDataJSON(),
        authorization: route.request().headers().authorization,
      })
      await delay(updateDelayMs)
      // 기본 성공 응답이면 받은 값을 기록에 반영해 이후 목록·상세 조회가 수정된 값을 돌려준다.
      if (updateStatus === 200 && updateBody === undefined) {
        const target = handle.feedLogs.find(
          (item) => item.feedLogId === feedLogId,
        )
        const body = route.request().postDataJSON() as Partial<MockFeedLog>
        if (target) {
          if (typeof body.feedType === 'string') target.feedType = body.feedType
          if (typeof body.feedAmount === 'number')
            target.feedAmount = body.feedAmount
          if (typeof body.remainingAmount === 'number')
            target.remainingAmount = body.remainingAmount
          if (typeof body.significant === 'string')
            target.significant = body.significant
        }
      }
      await json(
        route,
        updateStatus,
        updateBody ??
          (updateStatus === 200
            ? { message: '급여일지가 수정되었습니다.' }
            : errorBody(updateStatus, '요청을 처리하지 못했습니다.')),
      )
      return
    }

    handle.requests.adminDetail += 1
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
      remainingAmount: target.remainingAmount,
      feedUnit: target.feedUnit ?? 'KGL',
      feedDateTime: target.feedDateTime,
      significant: target.significant,
    })
  })

  await mockFifthFloorRoutes(page, handle.fifthFloor, {
    listDelayMs,
    updateStatus,
    updateBody,
    updateDelayMs,
    deleteStatus,
    deleteDelayMs,
  })

  return handle
}

async function mockFifthFloorRoutes(
  page: Page,
  fifth: FeedApiHandle['fifthFloor'],
  options: Required<
    Omit<FeedApiOptions, 'feedLogs' | 'fifthFloorFeedLogs' | 'updateBody'>
  > &
    Pick<FeedApiOptions, 'updateBody'>,
) {
  await page.route(fifthFloorFeedListPattern, async (route) => {
    fifth.requests.list += 1
    const query = new URL(route.request().url()).searchParams
    fifth.listQueries.push(query)
    await delay(options.listDelayMs)

    const size = Number(query.get('size') ?? 10)
    const number = Number(query.get('page') ?? 1)
    const matched = fifth.feedLogs.filter(
      (item) => item.feedDate === query.get('date'),
    )

    await json(route, 200, {
      feedLogs: matched
        .slice((number - 1) * size, number * size)
        .map(toFifthFloorListItem),
      totalPageSize: Math.ceil(matched.length / size),
    })
  })

  await page.route(fifthFloorFeedHistoryPattern, async (route) => {
    fifth.requests.history += 1
    const animalId = Number(matchId(route, fifthFloorFeedHistoryPattern))
    const feeds = fifth.feedLogs.filter((item) => item.animalId === animalId)

    if (feeds.length === 0) {
      await json(route, 404, errorBody(404, '존재하지 않는 개체입니다.'))
      return
    }

    await json(route, 200, {
      feedLogs: feeds.map((item) => ({
        feedLogId: item.feedLogId,
        staffName: item.staffName,
        feedType: item.feedType,
        feedAmount: item.feedAmount,
        feedUnit: item.feedUnit,
        feedDate: item.feedDate,
      })),
    })
  })

  await page.route(fifthFloorFeedDetailPattern, async (route) => {
    const feedLogId = Number(matchId(route, fifthFloorFeedDetailPattern))
    const method = route.request().method()
    const target = fifth.feedLogs.find((item) => item.feedLogId === feedLogId)

    if (method === 'DELETE') {
      fifth.deletes.push({
        feedLogId,
        authorization: route.request().headers().authorization,
      })
      await delay(options.deleteDelayMs)
      if (options.deleteStatus !== 200 || !target) {
        const status = options.deleteStatus !== 200 ? options.deleteStatus : 404
        await json(
          route,
          status,
          errorBody(status, '존재하지 않는 급여일지입니다.'),
        )
        return
      }
      fifth.feedLogs.splice(fifth.feedLogs.indexOf(target), 1)
      await route.fulfill({ status: 200 })
      return
    }

    if (method === 'PUT') {
      const body = route
        .request()
        .postDataJSON() as Partial<MockFifthFloorFeedLog>
      fifth.updates.push({
        feedLogId,
        body,
        authorization: route.request().headers().authorization,
      })
      await delay(options.updateDelayMs)
      // 기본 성공 응답이면 받은 값을 기록에 반영해 이후 조회가 수정된 값을 돌려준다.
      if (
        options.updateStatus === 200 &&
        options.updateBody === undefined &&
        target
      ) {
        if (typeof body.feedType === 'string') target.feedType = body.feedType
        if (typeof body.feedAmount === 'number')
          target.feedAmount = body.feedAmount
      }
      await json(
        route,
        options.updateStatus,
        options.updateBody ??
          (options.updateStatus === 200
            ? { message: '급여일지가 수정되었습니다.' }
            : errorBody(options.updateStatus, '요청을 처리하지 못했습니다.')),
      )
      return
    }

    fifth.requests.adminDetail += 1
    if (!target) {
      await json(route, 404, errorBody(404, '존재하지 않는 급여일지입니다.'))
      return
    }

    await json(route, 200, {
      animalId: target.animalId,
      staffName: target.staffName,
      animalKind: target.animalKind,
      animalName: target.animalName,
      animalDeleted: target.animalDeleted,
      animalImageUrl: { fileName: 'oscar.png', fileKey: 'animal/oscar.png' },
      feedType: target.feedType,
      feedAmount: target.feedAmount,
      feedUnit: target.feedUnit,
      feedDate: target.feedDate,
    })
  })
}

function toFifthFloorListItem(item: MockFifthFloorFeedLog) {
  return {
    feedLogId: item.feedLogId,
    staffName: item.staffName,
    animalKind: item.animalKind,
    animalName: item.animalName,
    animalDeleted: item.animalDeleted,
    feedType: item.feedType,
    feedAmount: item.feedAmount,
    feedUnit: item.feedUnit,
    feedDate: item.feedDate,
  }
}

function toListItem(item: MockFeedLog) {
  return {
    feedLogId: item.feedLogId,
    staffName: item.name,
    animalKind: item.animalKind,
    animalName: item.animalName,
    feedType: item.feedType,
    feedAmount: item.feedAmount,
    remainingAmount: item.remainingAmount,
    feedUnit: item.feedUnit ?? 'KGL',
    feedDateTime: item.feedDateTime,
    // Swagger 목록 응답에는 아직 없다(백엔드 추가 요청 중). 넣어 오는 경우를 흉내 낸다.
    significant: item.significant || null,
  }
}

function toHistoryItem(item: MockFeedLog) {
  return {
    feedLogId: item.feedLogId,
    staffName: item.name,
    feedType: item.feedType,
    feedAmount: item.feedAmount,
    remainingAmount: item.remainingAmount,
    feedUnit: item.feedUnit ?? 'KGL',
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
