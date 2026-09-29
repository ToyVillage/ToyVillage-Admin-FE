import type { Page, Route } from '@playwright/test'

// 업무보고 퍼블리싱 시나리오가 쓰는 API mock.
// 목록·상세·승인·반려를 메모리 상태로 흉내 낸다. 실제 서버는 호출하지 않으며,
// 각 spec 은 필요한 응답만 page.route 로 덮어쓴다(Playwright 는 나중에 등록한 route 를 먼저 매칭한다).

export const workReportListPattern = /^https:\/\/[^/]+\/work-report(?:\?.*)?$/
export const workReportDetailPattern =
  /^https:\/\/[^/]+\/work-report\/detail\/[^/?]+(?:\?.*)?$/
export const workReportApprovePattern =
  /^https:\/\/[^/]+\/work-report\/approve\/[^/?]+(?:\?.*)?$/
export const workReportRejectPattern =
  /^https:\/\/[^/]+\/work-report\/reject\/[^/?]+(?:\?.*)?$/

export type MockWorkReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type MockWorkReportPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface MockWorkReportFile {
  fileName: string
  fileKey: string
}

export interface MockWorkReport {
  id: number
  taskId: number
  name: string
  title: string
  content: string
  note: string
  status: MockWorkReportStatus
  priority: MockWorkReportPriority
  finishDate: string
  files: MockWorkReportFile[]
  rejectionReason: string | null
}

const figmaContent = '상세 업무 내용이 입력되어있음'

const figmaFiles: MockWorkReportFile[] = [
  { fileName: '당일 지침.pdf', fileKey: 'work-report/2026/07/guide.pdf' },
  { fileName: '휴관안내.png', fileKey: 'work-report/2026/07/notice.png' },
  { fileName: '휴관안내.jpg', fileKey: 'work-report/2026/07/notice.jpg' },
]

function report(
  id: number,
  name: string,
  status: MockWorkReportStatus,
  priority: MockWorkReportPriority,
  finishDate: string,
  overrides: Partial<MockWorkReport> = {},
): MockWorkReport {
  return {
    id,
    taskId: id,
    name,
    title: '업무 제목',
    content: figmaContent,
    note: '',
    status,
    priority,
    finishDate,
    files: [],
    rejectionReason: status === 'REJECTED' ? '근거 자료가 빠졌습니다.' : null,
    ...overrides,
  }
}

// 한 페이지는 10행이다. 페이지네이션이 보이도록 `심사대기` 12건(2페이지), `완료` 3건, `반려` 2건을 둔다.
// 1번은 Figma yot 1:3510 `심사대기` 첫 행과 상세(1:7503) 내용이다.
export const mockWorkReports: MockWorkReport[] = [
  report(1, '이승현', 'PENDING', 'HIGH', '2026-07-03', { files: figmaFiles }),
  report(2, '김수인', 'PENDING', 'LOW', '2026-07-01'),
  report(3, '이지아', 'PENDING', 'MEDIUM', '2026-07-28'),
  report(4, '김수인', 'PENDING', 'MEDIUM', '2026-08-05'),
  report(5, '김유영', 'PENDING', 'HIGH', '2026-08-11'),
  report(6, '이승현', 'PENDING', 'LOW', '2026-08-18'),
  report(7, '김수인', 'PENDING', 'MEDIUM', '2026-08-24'),
  report(8, '이지아', 'PENDING', 'LOW', '2026-09-01'),
  report(9, '김유영', 'PENDING', 'HIGH', '2026-09-08'),
  report(10, '이승현', 'PENDING', 'MEDIUM', '2026-09-15'),
  report(11, '김수인', 'PENDING', 'MEDIUM', '2026-12-05'),
  report(12, '김유영', 'PENDING', 'HIGH', '2026-12-11'),
  report(13, '이지아', 'APPROVED', 'LOW', '2027-01-08'),
  report(14, '이승현', 'APPROVED', 'HIGH', '2027-01-20'),
  report(15, '김수인', 'APPROVED', 'MEDIUM', '2027-02-02'),
  report(16, '이지아', 'REJECTED', 'HIGH', '2027-02-15'),
  report(17, '이승현', 'REJECTED', 'LOW', '2027-02-27'),
]

export interface WorkReportApiRequests {
  list: number
  detail: number
  approve: number
  reject: number
}

export interface WorkReportApiHandle {
  reports: MockWorkReport[]
  requests: WorkReportApiRequests
  listQueries: URLSearchParams[]
  rejectBodies: unknown[]
}

export interface WorkReportApiOptions {
  /** 초기 목록. 기본은 퍼블리싱 시나리오용 17건이다. */
  reports?: MockWorkReport[]
  /** 승인·반려 응답 지연(ms). 진행 중 상태를 관찰할 때 쓴다. */
  mutationDelayMs?: number
  /** 승인 응답 status. 200 이 아니면 상태를 바꾸지 않는다. */
  approveStatus?: number
  /** 반려 응답 status. 200 이 아니면 상태를 바꾸지 않는다. */
  rejectStatus?: number
}

export async function mockWorkReportApi(
  page: Page,
  options: WorkReportApiOptions = {},
): Promise<WorkReportApiHandle> {
  const {
    reports = mockWorkReports.map((item) => ({ ...item })),
    mutationDelayMs = 0,
    approveStatus = 200,
    rejectStatus = 200,
  } = options

  const handle: WorkReportApiHandle = {
    reports,
    requests: { list: 0, detail: 0, approve: 0, reject: 0 },
    listQueries: [],
    rejectBodies: [],
  }

  await page.route(workReportListPattern, async (route) => {
    handle.requests.list += 1
    const query = new URL(route.request().url()).searchParams
    handle.listQueries.push(query)

    const page1 = Number(query.get('page') ?? 1)
    const size = Number(query.get('size') ?? 10)
    const status = query.get('status')
    const filtered = status
      ? handle.reports.filter((item) => item.status === status)
      : handle.reports

    await json(route, 200, {
      reports: filtered.slice((page1 - 1) * size, page1 * size).map(toListItem),
      totalPageSize: Math.ceil(filtered.length / size),
      pendingCount: countBy(handle.reports, 'PENDING'),
      approvedCount: countBy(handle.reports, 'APPROVED'),
      rejectedCount: countBy(handle.reports, 'REJECTED'),
    })
  })

  await page.route(workReportDetailPattern, async (route) => {
    handle.requests.detail += 1
    const target = findReport(handle, route)

    if (!target) {
      await json(route, 404, errorBody(404, '존재하지 않는 업무관리입니다.'))
      return
    }

    await json(route, 200, target)
  })

  await page.route(workReportApprovePattern, async (route) => {
    handle.requests.approve += 1
    await delay(mutationDelayMs)
    const target = findReport(handle, route)

    if (approveStatus !== 200) {
      await json(route, approveStatus, errorBody(approveStatus, '승인 실패'))
      return
    }

    if (!target) {
      await json(route, 404, errorBody(404, '존재하지 않는 업무관리입니다.'))
      return
    }

    target.status = 'APPROVED'
    await json(route, 200, { message: '업무 보고가 승인되었습니다.' })
  })

  await page.route(workReportRejectPattern, async (route) => {
    handle.requests.reject += 1
    const body = route.request().postDataJSON() as { rejectionReason: string }
    handle.rejectBodies.push(body)
    await delay(mutationDelayMs)
    const target = findReport(handle, route)

    if (rejectStatus !== 200) {
      await json(route, rejectStatus, errorBody(rejectStatus, '반려 실패'))
      return
    }

    if (!target) {
      await json(route, 404, errorBody(404, '존재하지 않는 업무관리입니다.'))
      return
    }

    target.status = 'REJECTED'
    target.rejectionReason = body.rejectionReason
    await json(route, 200, { message: '업무 보고가 반려되었습니다.' })
  })

  return handle
}

/** 승인·반려 요청 합계. 처리 요청이 몇 번 나갔는지 확인할 때 쓴다. */
export function reviewRequestCount(handle: WorkReportApiHandle) {
  return handle.requests.approve + handle.requests.reject
}

function findReport(handle: WorkReportApiHandle, route: Route) {
  const rawId = new URL(route.request().url()).pathname.split('/').at(-1)
  return handle.reports.find((item) => item.id === Number(rawId))
}

function toListItem(item: MockWorkReport) {
  return {
    id: item.id,
    taskId: item.taskId,
    name: item.name,
    title: item.title,
    status: item.status,
    priority: item.priority,
    finishDate: item.finishDate,
  }
}

function countBy(reports: MockWorkReport[], status: MockWorkReportStatus) {
  return reports.filter((item) => item.status === status).length
}

function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-09-13T19:56:53.62201',
    description: '에러 설명',
  }
}

async function delay(ms: number) {
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms))
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
