import type { Page, Route } from '@playwright/test'

// 전체 활동 API mock(`all-activities-controller`).
// 대상: GET /all-activities/feed-log/fourth-floor · /all-activities/feed-log/fifth-floor · /all-activities/animal-observation — date.
// 실제 서버는 호출하지 않는다. 기본 데이터는 퍼블리싱 mock 이던 2026-10-20 기록(4층 22건 · 5층 24건 · 관찰일지 5건)이고
// 다른 날짜는 빈 배열이다.

export const floorFourFeedPattern =
  /^https:\/\/[^/]+\/all-activities\/feed-log\/fourth-floor(?:\?.*)?$/
export const floorFiveFeedPattern =
  /^https:\/\/[^/]+\/all-activities\/feed-log\/fifth-floor(?:\?.*)?$/
export const observationPattern =
  /^https:\/\/[^/]+\/all-activities\/animal-observation(?:\?.*)?$/

export const activityMockDate = '2026-10-20'

export interface RecordedRequest {
  url: URL
  authorization: string | undefined
}

interface ListMock {
  /** 날짜별 응답 배열. 없는 날짜는 빈 배열이다. */
  itemsByDate?: Record<string, unknown[]>
  /** 성공 대신 이 상태와 공통 오류 body 를 돌려준다. */
  status?: number
  /** 200 으로 이 body 를 그대로 돌려준다(응답 형식 오류 시나리오). */
  rawBody?: unknown
}

export interface ActivityApiOptions {
  floorFour?: ListMock
  floorFive?: ListMock
  observation?: ListMock
}

export async function mockActivityApi(
  page: Page,
  options: ActivityApiOptions = {},
) {
  const requests = {
    floorFour: [] as RecordedRequest[],
    floorFive: [] as RecordedRequest[],
    observation: [] as RecordedRequest[],
  }
  await page.route(floorFourFeedPattern, (route) =>
    respond(route, requests.floorFour, {
      itemsByDate: { [activityMockDate]: defaultFloorFourLogs },
      ...options.floorFour,
    }),
  )
  await page.route(floorFiveFeedPattern, (route) =>
    respond(route, requests.floorFive, {
      itemsByDate: { [activityMockDate]: defaultFloorFiveLogs },
      ...options.floorFive,
    }),
  )
  await page.route(observationPattern, (route) =>
    respond(route, requests.observation, {
      itemsByDate: { [activityMockDate]: defaultObservations },
      ...options.observation,
    }),
  )
  return requests
}

async function respond(
  route: Route,
  recorded: RecordedRequest[],
  mock: ListMock,
) {
  const request = route.request()
  if (request.method() !== 'GET') return route.fallback()
  const url = new URL(request.url())
  recorded.push({ url, authorization: request.headers().authorization })

  if (mock.status) {
    return route.fulfill({
      status: mock.status,
      json: {
        message: '내부 서버 오류가 발생했습니다.',
        status: mock.status,
        timestamp: '2026-10-27T10:00:00',
        description: '내부 서버 오류가 발생했습니다.',
      },
    })
  }
  if (mock.rawBody !== undefined) {
    return route.fulfill({ status: 200, json: mock.rawBody })
  }

  return route.fulfill({
    status: 200,
    json: mock.itemsByDate?.[url.searchParams.get('date') ?? ''] ?? [],
  })
}

/** 4층 응답 한 건. 넘긴 값만 덮어쓴다. */
export function floorFourFeedLog(overrides: Record<string, unknown> = {}) {
  return {
    feedLogId: 1,
    staffName: '이승현',
    animalKind: '이구아나',
    animalName: '초록',
    animalDeleted: false,
    feedType: '청경채',
    feedAmount: 150,
    remainingAmount: 20,
    feedUnit: 'GML',
    feedDateTime: `${activityMockDate}T08:40:00`,
    significant: '탈피 진행 중',
    ...overrides,
  }
}

/** 5층 응답 한 건. 넘긴 값만 덮어쓴다. */
export function floorFiveFeedLog(overrides: Record<string, unknown> = {}) {
  return {
    feedLogId: 1,
    staffName: '박도현',
    animalKind: '아로와나',
    animalName: '아로',
    animalDeleted: false,
    feedType: '냉동새우',
    feedAmount: 30,
    feedUnit: 'GML',
    ...overrides,
  }
}

// [일반명, 개체명, 급여시간, 먹이 종류, 급여량, 잔량, 특이사항, 급여자]
const floorFourRows: [
  string,
  string,
  string,
  string,
  number,
  number,
  string,
  string,
][] = [
  ['이구아나', '초록', '08:40', '청경채', 150, 20, '탈피 진행 중', '이승현'],
  ['왈라비', '왈리', '09:02', '염소사료', 300, 50, '', '이승현'],
  ['토끼(♀)', '솜이', '09:24', '기타사료', 30, 0, '', '이승현'],
  ['설가타육지거북', '단단이', '09:46', '육지거북사료', 50, 30, '', '이승현'],
  ['토끼(♂)', '콩이', '10:08', '기타사료', 30, 10, '', '이승현'],
  ['청금강', '파랑이', '10:30', '청금강사료', 80, 0, '', '이승현'],
  ['친칠라', '치치', '10:52', '기타사료', 40, 5, '', '박도현'],
  ['친칠라', '칠이', '10:58', '기타사료', 40, 0, '', '박도현'],
  ['서벌캣', '세리', '11:14', '고양이사료', 100, 180, '식욕 저하', '박도현'],
  ['수달', '달이', '11:36', '수달사료', 200, 0, '', '박도현'],
  ['슈가글라이더', '슈슈', '12:20', '기타사료', 20, 5, '', '박도현'],
  ['사막여우', '모래', '12:42', '개사료', 30, 0, '', '박도현'],
  ['알락꼬리여우원숭이', '링고', '13:04', '기타사료', 100, 40, '', '이서준'],
  ['카피바라', '동식이', '13:26', '염소사료', 200, 100, '', '이서준'],
  ['라쿤(♂)', '보리', '13:48', '개사료', 80, 0, '', '이서준'],
  ['라쿤(♀)', '보미', '14:10', '개사료', 80, 120, '앞발 절뚝임', '이서준'],
  ['코아티', '코코', '14:32', '개사료', 60, 10, '', '이서준'],
  ['미어캣', '미미', '14:54', '슈퍼밀웜', 120, 0, '', '이서준'],
  ['미어캣', '캣츠', '15:02', '귀뚜라미', 90, 0, '', '김유영'],
  ['나무늘보', '느림이', '15:16', '쥬키니', 250, 30, '', '김유영'],
  ['킨카주', '키키', '16:00', '냉동과일(망고)', 200, 15, '', '김유영'],
  ['물범', '바다', '16:22', '고등어', 2500, 0, '콧잔등 상처', '김유영'],
]

// [일반명, 개체명, 먹이 종류, 급여량, 급여자]
const floorFiveRows: [string, string, string, number, string][] = [
  ['아로와나', '아로', '냉동새우', 30, '박도현'],
  ['메가로도라스', '메가', '침강사료', 15, '박도현'],
  ['보도워드', '보도', '침강사료', 10, '박도현'],
  ['플라워혼', '혹돌이', '펠렛', 10, '박도현'],
  ['오란다', '란이', '플레이크', 5, '박도현'],
  ['케이브피쉬', '케이', '플레이크', 3, '박도현'],
  ['블랙고스트(대)', '블랙', '냉동장구벌레', 5, '박도현'],
  ['수생거북', '수돌이', '거북사료', 20, '박도현'],
  ['수생거북', '거북이', '거북사료', 15, '이서준'],
  ['오스카', '오돌이', '펠렛', 15, '박도현'],
  ['오스카', '오순이', '펠렛', 15, '이서준'],
  ['블랙고스트(소)', '블소', '냉동장구벌레', 3, '박도현'],
  ['클라라', '클라', '침강사료', 8, '박도현'],
  ['나비비파', '나비', '플레이크', 2, '박도현'],
  ['씨클리드', '씨클', '펠렛', 6, '박도현'],
  ['씨클리드', '씨리', '펠렛', 5, '이서준'],
  ['알비노구라미', '알비', '플레이크', 3, '이서준'],
  ['잉어+금붕어', '잉금이', '부상사료', 40, '이서준'],
  ['금붕어-ㄱ', '금붕이', '부상사료', 10, '이서준'],
  ['금붕어-중앙', '금중이', '부상사료', 12, '이서준'],
  ['혈앵무', '혈앵이', '펠렛', 8, '이서준'],
  ['시클리드', '시클이', '펠렛', 6, '이서준'],
  ['자이언트구라미', '자이언', '펠렛', 20, '이서준'],
  ['징기스칸', '징징이', '펠렛', 10, '이서준'],
]

export const defaultFloorFourLogs = floorFourRows.map(
  (
    [
      animalKind,
      animalName,
      time,
      feedType,
      feedAmount,
      remainingAmount,
      significant,
      staffName,
    ],
    index,
  ) =>
    floorFourFeedLog({
      feedLogId: index + 1,
      animalKind,
      animalName,
      feedDateTime: `${activityMockDate}T${time}:00`,
      feedType,
      feedAmount,
      remainingAmount,
      significant: significant || null,
      staffName,
    }),
)

export const defaultFloorFiveLogs = floorFiveRows.map(
  ([animalKind, animalName, feedType, feedAmount, staffName], index) =>
    floorFiveFeedLog({
      feedLogId: index + 1,
      animalKind,
      animalName,
      feedType,
      feedAmount,
      staffName,
    }),
)

/** 관찰일지 응답 한 건. 넘긴 값만 덮어쓴다. */
export function observation(overrides: Record<string, unknown> = {}) {
  return {
    animalObservationId: 1,
    animalManageId: 1,
    animalKind: '이구아나',
    animalName: '초록',
    animalDeleted: false,
    createdAt: `${activityMockDate}T09:10:00`,
    title: '탈피 진행 상황',
    authorName: '이승현',
    fileCount: 1,
    ...overrides,
  }
}

// [작성시간, 일반명, 개체명, 제목, 관찰자, 첨부 수]
const observationRows: [string, string, string, string, string, number][] = [
  ['09:10', '이구아나', '초록', '탈피 진행 상황', '이승현', 1],
  ['10:40', '서벌캣', '세리', '식욕 저하 관찰', '박도현', 0],
  ['11:20', '라쿤', '보미', '왼쪽 앞발 절뚝임', '이서준', 2],
  ['13:30', '카피바라', '동식이', '합사 적응 상태', '이서준', 0],
  ['15:50', '물범', '바다', '콧잔등 상처', '김유영', 1],
]

export const defaultObservations = observationRows.map(
  ([time, animalKind, animalName, title, authorName, fileCount], index) =>
    observation({
      animalObservationId: index + 1,
      animalManageId: index + 1,
      animalKind,
      animalName,
      createdAt: `${activityMockDate}T${time}:00`,
      title,
      authorName,
      fileCount,
    }),
)
