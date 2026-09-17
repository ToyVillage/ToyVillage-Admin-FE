import type { TaskPriority } from '@/entities/task'
import type { TaskReportReviewStatus } from '../model/types'

export interface TaskReportQueryAllRequest {
  /** 1부터 시작한다. */
  page: number
  size: number
  /** 상태 필터. 목록 화면은 탭 값을 항상 보내고, 대시보드는 생략해 전체를 조회한다. */
  status?: TaskReportReviewStatus
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
