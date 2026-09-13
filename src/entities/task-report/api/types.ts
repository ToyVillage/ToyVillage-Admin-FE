import type { TaskPriority } from '@/entities/task'
import type { TaskReportReviewStatus } from '../model/types'

export interface TaskReportQueryAllRequest {
  /** 1부터 시작한다. */
  page: number
  size: number
  /** 상태 탭. 항상 보낸다(`전체` 탭 없음). */
  status: TaskReportReviewStatus
}

export interface TaskReportQueryAllResponseItem {
  id: number
  taskId: number
  name: string
  /** 업무지시 제목 */
  title: string
  status: TaskReportReviewStatus
  priority: TaskPriority
  finishDate: string
}

export interface TaskReportQueryAllResponse {
  reports: TaskReportQueryAllResponseItem[]
  /** 총 페이지 수 */
  totalPageSize: number
  /** 상태별 건수는 status 필터와 무관하다. */
  pendingCount: number
  approvedCount: number
  rejectedCount: number
}

export interface TaskReportQueryAllErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface TaskReportQueryRequest {
  id: number
}

export interface TaskReportQueryFileResponse {
  fileName: string
  fileKey: string
}

export interface TaskReportQueryResponse {
  id: number
  /** 업무지시 제목 */
  title: string
  priority: TaskPriority
  finishDate: string
  taskId: number
  name: string
  content: string
  note: string
  files: TaskReportQueryFileResponse[]
  status: TaskReportReviewStatus
  rejectionReason: string | null
}

export interface TaskReportQueryErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface TaskReportApproveRequest {
  id: number
}

export interface TaskReportApproveResponse {
  message: string
}

export interface TaskReportApproveErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface TaskReportRejectRequest {
  /** 1000자 이하 */
  rejectionReason: string
}

export interface TaskReportRejectResponse {
  message: string
}

export interface TaskReportRejectErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
