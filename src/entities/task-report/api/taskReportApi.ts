import { api } from '@/shared/api/axios'
import { taskPriorities, type TaskPriority } from '@/entities/task'
import {
  taskReportRejectionReasonMaxLength,
  taskReportReviewStatuses,
} from '../model/types'
import type {
  TaskReport,
  TaskReportListItem,
  TaskReportReviewStatus,
} from '../model/types'
import type {
  TaskReportApproveRequest,
  TaskReportApproveResponse,
  TaskReportQueryAllRequest,
  TaskReportQueryAllResponse,
  TaskReportQueryAllResponseItem,
  TaskReportQueryRequest,
  TaskReportQueryResponse,
  TaskReportRejectRequest,
  TaskReportRejectResponse,
} from './types'

export interface TaskReportListPage {
  items: TaskReportListItem[]
  /** 총 페이지 수 */
  totalPageSize: number
  /** 상태 탭 건수. status 필터와 무관한 서버 집계다. */
  counts: Record<TaskReportReviewStatus, number>
}

export async function getTaskReports({
  page,
  size,
  status,
}: TaskReportQueryAllRequest): Promise<TaskReportListPage> {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error('업무보고 목록 페이지 번호가 올바르지 않습니다.')
  }

  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error('업무보고 목록 페이지 크기가 올바르지 않습니다.')
  }

  // sort 는 서버 기본값(id,DESC)을 쓴다.
  const { data } = await api.get<unknown>('/work-report', {
    params: { page, size, status },
  })

  if (!isTaskReportQueryAllResponse(data)) {
    throw new Error('업무보고 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    items: data.reports.map((report) => ({
      id: String(report.id),
      assigneeName: report.name,
      reviewStatus: report.status,
      priority: report.priority,
      dueDate: report.finishDate,
    })),
    totalPageSize: data.totalPageSize,
    counts: {
      PENDING: data.pendingCount,
      APPROVED: data.approvedCount,
      REJECTED: data.rejectedCount,
    },
  }
}

export async function getTaskReport({
  id,
}: TaskReportQueryRequest): Promise<TaskReport> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('업무보고 ID가 올바르지 않습니다.')
  }

  const { data } = await api.get<unknown>(`/work-report/detail/${id}`)

  if (!isTaskReportQueryResponse(data)) {
    throw new Error('업무보고 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    id: String(data.id),
    assigneeName: data.name,
    title: data.title,
    content: data.content,
    reviewStatus: data.status,
    priority: data.priority,
    dueDate: data.finishDate,
    attachmentFiles: data.files.map(({ fileName, fileKey }) => ({
      fileName,
      fileKey,
    })),
  }
}

export async function approveTaskReport({
  id,
}: TaskReportApproveRequest): Promise<TaskReportApproveResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('업무보고 승인 요청 ID가 올바르지 않습니다.')
  }

  const { data, status } = await api.patch<unknown>(
    `/work-report/approve/${id}`,
  )

  if (status !== 200) {
    throw new Error('업무보고 승인 응답 상태가 올바르지 않습니다.')
  }

  if (!isTaskReportMessageResponse(data)) {
    throw new Error('업무보고 승인 응답 형식이 올바르지 않습니다.')
  }

  return data
}

export async function rejectTaskReport({
  id,
  input,
}: {
  id: number
  input: TaskReportRejectRequest
}): Promise<TaskReportRejectResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('업무보고 반려 요청 ID가 올바르지 않습니다.')
  }

  const { rejectionReason } = input
  if (
    rejectionReason.length === 0 ||
    rejectionReason.length > taskReportRejectionReasonMaxLength
  ) {
    throw new Error('업무보고 반려 사유가 올바르지 않습니다.')
  }

  const { data, status } = await api.patch<unknown>(
    `/work-report/reject/${id}`,
    { rejectionReason },
  )

  if (status !== 200) {
    throw new Error('업무보고 반려 응답 상태가 올바르지 않습니다.')
  }

  if (!isTaskReportMessageResponse(data)) {
    throw new Error('업무보고 반려 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isTaskReportQueryAllResponse(
  value: unknown,
): value is TaskReportQueryAllResponse {
  if (typeof value !== 'object' || value === null) return false

  const response = value as Record<string, unknown>

  return (
    Array.isArray(response.reports) &&
    response.reports.every(isTaskReportQueryAllResponseItem) &&
    Number.isInteger(response.totalPageSize) &&
    Number.isInteger(response.pendingCount) &&
    Number.isInteger(response.approvedCount) &&
    Number.isInteger(response.rejectedCount)
  )
}

function isTaskReportQueryAllResponseItem(
  value: unknown,
): value is TaskReportQueryAllResponseItem {
  if (typeof value !== 'object' || value === null) return false

  const report = value as Record<string, unknown>

  return (
    Number.isInteger(report.id) &&
    Number.isInteger(report.taskId) &&
    typeof report.name === 'string' &&
    typeof report.title === 'string' &&
    isTaskReportReviewStatus(report.status) &&
    isTaskPriority(report.priority) &&
    typeof report.finishDate === 'string'
  )
}

// 화면이 쓰는 필드만 검사한다. `taskId`·`note`·`fileKey`·`rejectionReason` 은 표시하지 않고,
// `note` 는 null 가능 여부도 명세에 없어 여기서 막으면 상세 화면을 괜히 잃는다.
function isTaskReportQueryResponse(
  value: unknown,
): value is TaskReportQueryResponse {
  if (typeof value !== 'object' || value === null) return false

  const report = value as Record<string, unknown>

  return (
    Number.isInteger(report.id) &&
    typeof report.title === 'string' &&
    isTaskPriority(report.priority) &&
    typeof report.finishDate === 'string' &&
    typeof report.name === 'string' &&
    typeof report.content === 'string' &&
    Array.isArray(report.files) &&
    report.files.every(isTaskReportFile) &&
    isTaskReportReviewStatus(report.status)
  )
}

// 다운로드가 fileKey 로 파일 서버에서 받으므로 키도 확인한다.
function isTaskReportFile(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false

  const file = value as Record<string, unknown>
  return typeof file.fileName === 'string' && typeof file.fileKey === 'string'
}

function isTaskReportMessageResponse(
  value: unknown,
): value is TaskReportApproveResponse | TaskReportRejectResponse {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as Record<string, unknown>).message === 'string'
}

// 열거형 밖의 값이 통과하면 배지·탭 라벨 조회가 빈 값이 된다.
function isTaskReportReviewStatus(
  value: unknown,
): value is TaskReportReviewStatus {
  return taskReportReviewStatuses.some((status) => status === value)
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return taskPriorities.some((priority) => priority === value)
}
