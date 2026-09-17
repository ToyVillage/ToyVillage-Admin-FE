import type { Page, Route } from '@playwright/test'

// 대시보드가 쓰는 조회 API mock.
// 대상: GET /dashboard/count · /dashboard/overall-operations · /dashboard/feed-logs ·
//       /dashboard/animal-observations, 재사용 GET /close-day · /work-report · /work-log.
// 실제 서버는 호출하지 않는다. 기본 데이터는 퍼블리싱 mock(Figma 1385:15048) 값과 같다.

export type DashboardEndpoint =
  | 'count'
  | 'overallOperations'
  | 'feedLogs'
  | 'animalObservations'
  | 'closeDays'
  | 'workReports'
  | 'workLogs'

export const dashboardPatterns: Record<DashboardEndpoint, RegExp> = {
  count: /^https:\/\/[^/]+\/dashboard\/count(?:\?.*)?$/,
  overallOperations:
    /^https:\/\/[^/]+\/dashboard\/overall-operations(?:\?.*)?$/,
  feedLogs: /^https:\/\/[^/]+\/dashboard\/feed-logs(?:\?.*)?$/,
  animalObservations:
    /^https:\/\/[^/]+\/dashboard\/animal-observations(?:\?.*)?$/,
  closeDays: /^https:\/\/[^/]+\/close-day(?:\?.*)?$/,
  workReports: /^https:\/\/[^/]+\/work-report(?:\?.*)?$/,
  workLogs: /^https:\/\/[^/]+\/work-log(?:\?.*)?$/,
}

export interface MockDashboardFeedLog {
  feedLogId: number
  animalKind: string
  animalName: string
  feedDateTime: string
}

export interface MockDashboardObservation {
  animalObservationId: number
  animalId: number
  title: string
  createdAt: string
}

export interface MockDashboardCloseDay {
  id: number
  title: string
  startCloseTime: string
  endCloseTime: string
}

export interface MockDashboardWorkReport {
  id: number
  taskId: number
  name: string
  title: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  finishDate: string
}

export interface MockDashboardWorkLog {
  workLogId: number
  writer: string
  writeAt: string
  templateTitle: string
}

export interface DashboardMockData {
  count: {
    feedLogCount: number
    animalCount: number
    workReportCount: number
    workLogCount: number
  }
  overallOperations: {
    TOTAL: number
    IN_PROGRESS: number
    COMPLETED: number
    EXPIRED: number
  }
  feedLogs: MockDashboardFeedLog[]
  animalObservations: MockDashboardObservation[]
  closeDays: MockDashboardCloseDay[]
  workReports: MockDashboardWorkReport[]
  workLogs: MockDashboardWorkLog[]
}

export function createDashboardMockData(): DashboardMockData {
  return {
    count: {
      feedLogCount: 3,
      animalCount: 12,
      workReportCount: 3,
      workLogCount: 9,
    },
    overallOperations: { TOTAL: 30, IN_PROGRESS: 9, COMPLETED: 15, EXPIRED: 6 },
    feedLogs: [
      {
        feedLogId: 1,
        animalKind: '표범',
        animalName: '레오',
        feedDateTime: '2026-09-03T09:30:00',
      },
      {
        feedLogId: 2,
        animalKind: '사자',
        animalName: '심바',
        feedDateTime: '2026-09-03T09:10:00',
      },
      {
        feedLogId: 3,
        animalKind: '호랑이',
        animalName: '라라',
        feedDateTime: '2026-09-02T17:40:00',
      },
    ],
    animalObservations: [
      {
        animalObservationId: 1,
        animalId: 5,
        title: '얼굴 콧잔등 부위 약 3cm 긁힌 상처 있음',
        createdAt: '2026-09-03T09:30:00',
      },
      {
        animalObservationId: 2,
        animalId: 6,
        title: '배변상태 평소보다 조금 묽음',
        createdAt: '2026-09-02T08:00:00',
      },
      {
        animalObservationId: 3,
        animalId: 7,
        title: '식욕 정상, 활동량 양호',
        createdAt: '2026-08-31T08:00:00',
      },
    ],
    closeDays: [
      {
        id: 1,
        title: '김정욱 생일',
        startCloseTime: '2026-09-09',
        endCloseTime: '2026-09-09',
      },
      {
        id: 2,
        title: '토이빌리지 동물 정기검진',
        startCloseTime: '2026-09-14',
        endCloseTime: '2026-09-15',
      },
      {
        id: 3,
        title: '이승현 생일',
        startCloseTime: '2026-09-14',
        endCloseTime: '2026-09-14',
      },
    ],
    workReports: [
      workReport(1, '업무 제목', 'PENDING'),
      workReport(2, '업무 제목', 'APPROVED'),
      workReport(3, '업무 제목', 'REJECTED'),
    ],
    workLogs: [
      workLog(1, '마감일지', '김수인'),
      workLog(2, '사육장점검일지', '이승현'),
      workLog(3, '마감일지', '이승현'),
    ],
  }
}

export interface DashboardApiRequest {
  url: URL
  authorization: string | undefined
}

export type DashboardApiRequests = Record<
  DashboardEndpoint,
  DashboardApiRequest[]
>

export interface DashboardApiOptions {
  data?: Partial<DashboardMockData>
  /** 지정한 endpoint 는 이 status 와 공통 오류 본문으로 응답한다. */
  status?: Partial<Record<DashboardEndpoint, number>>
  /** 지정한 endpoint 는 200 과 이 본문을 그대로 돌려준다(형식 오류 검증용). */
  rawBody?: Partial<Record<DashboardEndpoint, unknown>>
  /** 지정한 endpoint 응답을 ms 만큼 늦춘다. */
  delayMs?: Partial<Record<DashboardEndpoint, number>>
}

export async function mockDashboardApi(
  page: Page,
  options: DashboardApiOptions = {},
): Promise<DashboardApiRequests> {
  const data = { ...createDashboardMockData(), ...options.data }
  const requests = Object.fromEntries(
    Object.keys(dashboardPatterns).map((key) => [key, []]),
  ) as unknown as DashboardApiRequests

  const bodies: Record<DashboardEndpoint, (url: URL) => unknown> = {
    count: () => data.count,
    overallOperations: () => data.overallOperations,
    feedLogs: (url) => springPage(data.feedLogs, url),
    animalObservations: (url) => springPage(data.animalObservations, url),
    closeDays: () => data.closeDays,
    workReports: () => ({
      reports: data.workReports,
      totalPageSize: 1,
      pendingCount: countStatus(data.workReports, 'PENDING'),
      approvedCount: countStatus(data.workReports, 'APPROVED'),
      rejectedCount: countStatus(data.workReports, 'REJECTED'),
    }),
    workLogs: () => ({
      content: data.workLogs,
      totalPages: 1,
      totalElements: data.workLogs.length,
      size: 3,
      number: 0,
      numberOfElements: data.workLogs.length,
      first: true,
      last: true,
      empty: data.workLogs.length === 0,
    }),
  }

  for (const endpoint of Object.keys(
    dashboardPatterns,
  ) as DashboardEndpoint[]) {
    await page.route(dashboardPatterns[endpoint], async (route) => {
      const request = route.request()
      if (request.method() !== 'GET') return route.fallback()

      const url = new URL(request.url())
      requests[endpoint].push({
        url,
        authorization: request.headers().authorization,
      })

      const delay = options.delayMs?.[endpoint]
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay))

      const status = options.status?.[endpoint]
      if (status) {
        return json(route, status, errorBody(status))
      }

      if (options.rawBody && endpoint in options.rawBody) {
        return json(route, 200, options.rawBody[endpoint])
      }

      return json(route, 200, bodies[endpoint](url))
    })
  }

  return requests
}

// Spring Page. 요청 page 는 1부터, 응답 number 는 0부터다. content 는 그대로 돌려준다.
function springPage<T>(content: T[], url: URL) {
  const size = Number(url.searchParams.get('size') ?? 10)
  const number = Number(url.searchParams.get('page') ?? 1) - 1
  const sort = { empty: false, sorted: true, unsorted: false }

  return {
    content,
    pageable: {
      pageNumber: number,
      pageSize: size,
      sort,
      offset: number * size,
      paged: true,
      unpaged: false,
    },
    last: true,
    totalPages: 1,
    totalElements: content.length,
    size,
    number,
    sort,
    first: number === 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  }
}

function workReport(
  id: number,
  title: string,
  status: MockDashboardWorkReport['status'],
): MockDashboardWorkReport {
  return {
    id,
    taskId: 100 + id,
    name: '김수인',
    title,
    status,
    priority: 'MEDIUM',
    finishDate: '2026-09-10',
  }
}

function workLog(
  workLogId: number,
  templateTitle: string,
  writer: string,
): MockDashboardWorkLog {
  return { workLogId, writer, writeAt: '2026-09-03', templateTitle }
}

function countStatus(
  reports: MockDashboardWorkReport[],
  status: MockDashboardWorkReport['status'],
) {
  return reports.filter((report) => report.status === status).length
}

function errorBody(status: number) {
  const message =
    status === 400 ? '잘못된 요청입니다.' : '내부 서버 오류가 발생했습니다.'
  return {
    message,
    status,
    timestamp: '2026-09-17T20:30:00',
    description: message,
  }
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
