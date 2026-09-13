import { taskReportReviewStatuses } from './types'
import type { TaskReport, TaskReportReviewStatus } from './types'

export const taskReportReviewStorageKey = 'toyvillage:task-reports:reviews'

// 반려 사유는 심사 상태와 같은 mock 경계에 둔다(id → 사유).
// 실제 API 로 교체할 때 반려 요청 body 로 옮긴다.
export const taskReportRejectReasonStorageKey =
  'toyvillage:task-reports:reject-reasons'

// localStorage mock 은 즉시 끝나므로 진행 중 상태를 관찰할 수 없다.
// 아래 두 키는 테스트 제어점이다. 실제 API 로 교체할 때 함께 제거한다.
// - delay: 값(ms)만큼 완료를 늦춰 `처리 중` 상태를 유지시킨다.
// - log: 심사 요청이 실제로 몇 번 전송됐는지 확인한다.
export const taskReportMutationDelayStorageKey =
  'toyvillage:task-reports:mutation-delay'
export const taskReportMutationLogStorageKey =
  'toyvillage:task-reports:mutation-log'

// 결과 토스트의 실패 경로 검증용 실패 주입 플래그. mock 은 항상 성공하므로,
// 이 키에 'approve' | 'reject' 를 넣으면 해당 요청이 한 번 실패한다.
// 실제 API 로 교체할 때 함께 제거한다.
export const taskReportFailStorageKey = 'toyvillage:task-reports:fail'

const figmaContent = '상세 업무 내용이 입력되어있음'
const figmaAttachments = ['당일 지침.pdf', '휴관안내.png', '휴관안내.jpg']

// 슬라이스용 mock. 추후 TanStack Query + Axios로 대체.
// 1~3번은 Figma yot 1:3510 의 `심사대기` 1페이지 행이다.
// `심사대기` 를 7건 두어 Figma 페이지네이션(1·2·3)이 재현되게 한다. 나머지는 `완료` 3건, `반려` 2건.
export const mockTaskReports: TaskReport[] = [
  {
    id: 'r1',
    taskId: '4',
    assigneeId: 'emp-1',
    assigneeName: '이승현',
    title: '업무 제목',
    content: figmaContent,
    reviewStatus: 'PENDING',
    priority: 'HIGH',
    dueDate: '2026-07-03',
    attachments: figmaAttachments,
  },
  {
    id: 'r2',
    taskId: '2',
    assigneeId: 'emp-2',
    assigneeName: '김수인',
    title: '업무 제목',
    content: figmaContent,
    reviewStatus: 'PENDING',
    priority: 'LOW',
    dueDate: '2026-07-01',
  },
  {
    id: 'r3',
    taskId: '3',
    assigneeId: 'emp-3',
    assigneeName: '이지아',
    title: '업무 제목',
    content: figmaContent,
    reviewStatus: 'PENDING',
    priority: 'MEDIUM',
    dueDate: '2026-07-28',
  },
  {
    id: 'r4',
    taskId: '5',
    assigneeId: 'emp-2',
    assigneeName: '김수인',
    title: '여름 프로그램 준비 보고',
    content: '여름 프로그램 물품과 일정을 정리했습니다.',
    reviewStatus: 'PENDING',
    priority: 'MEDIUM',
    dueDate: '2026-12-05',
    attachments: ['여름 프로그램 일정.pdf'],
  },
  {
    id: 'r5',
    taskId: '1',
    assigneeId: 'emp-10',
    assigneeName: '김유영',
    title: '사육장 점검 보고',
    content: '사육장 점검 결과를 정리했습니다.',
    reviewStatus: 'PENDING',
    priority: 'HIGH',
    dueDate: '2026-12-11',
  },
  {
    id: 'r6',
    taskId: '7',
    assigneeId: 'emp-1',
    assigneeName: '이승현',
    title: '단체예약 응대 정리 보고',
    content: '이번 달 단체예약 응대 내역을 정리했습니다.',
    reviewStatus: 'PENDING',
    priority: 'LOW',
    dueDate: '2026-12-18',
  },
  {
    id: 'r7',
    taskId: '8',
    assigneeId: 'emp-2',
    assigneeName: '김수인',
    title: '휴관 안내문 게시 보고',
    content: '휴관 안내문을 게시했습니다.',
    reviewStatus: 'PENDING',
    priority: 'MEDIUM',
    dueDate: '2026-12-24',
  },
  {
    id: 'r8',
    taskId: '9',
    assigneeId: 'emp-3',
    assigneeName: '이지아',
    title: '자료실 파일 정리 보고',
    content: '자료실의 오래된 파일을 정리했습니다.',
    reviewStatus: 'APPROVED',
    priority: 'LOW',
    dueDate: '2027-01-08',
  },
  {
    id: 'r9',
    taskId: '1',
    assigneeId: 'emp-1',
    assigneeName: '이승현',
    title: '연간 운영 계획 초안 보고',
    content: '내년 운영 계획 초안을 작성했습니다.',
    reviewStatus: 'APPROVED',
    priority: 'HIGH',
    dueDate: '2027-01-20',
  },
  {
    id: 'r10',
    taskId: '1',
    assigneeId: 'emp-2',
    assigneeName: '김수인',
    title: '체험 프로그램 개선 보고',
    content: '체험 프로그램 운영 개선안을 정리했습니다.',
    reviewStatus: 'APPROVED',
    priority: 'MEDIUM',
    dueDate: '2027-02-02',
  },
  {
    id: 'r11',
    taskId: '1',
    assigneeId: 'emp-3',
    assigneeName: '이지아',
    title: '안전 점검 보고',
    content: '안전 점검 항목 일부가 누락되었습니다.',
    reviewStatus: 'REJECTED',
    priority: 'HIGH',
    dueDate: '2027-02-15',
  },
  {
    id: 'r12',
    assigneeId: 'emp-1',
    assigneeName: '이승현',
    title: '민원 응대 결과 보고',
    content: '민원 응대 결과 근거 자료가 빠졌습니다.',
    reviewStatus: 'REJECTED',
    priority: 'LOW',
    dueDate: '2027-02-27',
  },
]

export async function getMockTaskReports(): Promise<TaskReport[]> {
  const reviews = readStoredReviews()

  return mockTaskReports.map((report) => {
    const reviewStatus = reviews.get(report.id)
    return reviewStatus ? { ...report, reviewStatus } : report
  })
}

export async function getMockTaskReport(
  id: string,
): Promise<TaskReport | null> {
  const reports = await getMockTaskReports()
  return reports.find((report) => report.id === id) ?? null
}

export async function reviewMockTaskReport({
  id,
  reviewStatus,
  rejectReason,
}: {
  id: string
  reviewStatus: TaskReportReviewStatus
  rejectReason?: string
}): Promise<TaskReport> {
  await startMockMutation(reviewStatus)

  if (consumeInjectedFailure(reviewStatus)) {
    throw new Error('Injected task report review failure')
  }

  const currentReport = await getMockTaskReport(id)
  if (!currentReport) throw new Error('Task report not found')

  const reviews = readStoredReviews()
  reviews.set(id, reviewStatus)
  localStorage.setItem(
    taskReportReviewStorageKey,
    JSON.stringify(Object.fromEntries(reviews)),
  )

  if (rejectReason !== undefined) storeRejectReason(id, rejectReason)

  return { ...currentReport, reviewStatus }
}

// 주입된 실패가 이번 요청(승인/반려)과 맞을 때만 한 번 소비한다.
function consumeInjectedFailure(reviewStatus: TaskReportReviewStatus): boolean {
  const action = reviewStatus === 'REJECTED' ? 'reject' : 'approve'
  if (localStorage.getItem(taskReportFailStorageKey) !== action) return false

  localStorage.removeItem(taskReportFailStorageKey)
  return true
}

function storeRejectReason(id: string, rejectReason: string): void {
  const reasons = readStoredRejectReasons()
  reasons.set(id, rejectReason)
  localStorage.setItem(
    taskReportRejectReasonStorageKey,
    JSON.stringify(Object.fromEntries(reasons)),
  )
}

function readStoredRejectReasons(): Map<string, string> {
  const rawReasons = localStorage.getItem(taskReportRejectReasonStorageKey)
  if (!rawReasons) return new Map()

  try {
    const reasons: unknown = JSON.parse(rawReasons)
    if (!reasons || typeof reasons !== 'object') return new Map()

    return new Map(
      Object.entries(reasons as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
  } catch {
    return new Map()
  }
}

// 요청 시점을 기록한 뒤, 설정된 지연만큼 완료를 늦춘다.
async function startMockMutation(
  reviewStatus: TaskReportReviewStatus,
): Promise<void> {
  recordMockMutation(reviewStatus)

  const delay = Number(localStorage.getItem(taskReportMutationDelayStorageKey))
  if (!Number.isFinite(delay) || delay <= 0) return

  await new Promise((resolve) => setTimeout(resolve, delay))
}

function recordMockMutation(reviewStatus: TaskReportReviewStatus): void {
  localStorage.setItem(
    taskReportMutationLogStorageKey,
    JSON.stringify([...readMockMutationLog(), reviewStatus]),
  )
}

function readMockMutationLog(): string[] {
  const rawLog = localStorage.getItem(taskReportMutationLogStorageKey)
  if (!rawLog) return []

  try {
    const log: unknown = JSON.parse(rawLog)
    return Array.isArray(log)
      ? log.filter((entry): entry is string => typeof entry === 'string')
      : []
  } catch {
    return []
  }
}

// 열거형 밖의 값이 통과하면 taskReportReviewStatusLabels 조회가 빈 값이 된다.
function readStoredReviews(): Map<string, TaskReportReviewStatus> {
  const rawReviews = localStorage.getItem(taskReportReviewStorageKey)
  if (!rawReviews) return new Map()

  try {
    const reviews: unknown = JSON.parse(rawReviews)
    if (!reviews || typeof reviews !== 'object') return new Map()

    return new Map(
      Object.entries(reviews as Record<string, unknown>).filter(
        (entry): entry is [string, TaskReportReviewStatus] =>
          isTaskReportReviewStatus(entry[1]),
      ),
    )
  } catch {
    return new Map()
  }
}

function isTaskReportReviewStatus(
  value: unknown,
): value is TaskReportReviewStatus {
  return taskReportReviewStatuses.some((status) => status === value)
}
