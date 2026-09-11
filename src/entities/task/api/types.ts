import type { TaskPriority, TaskStatus } from '../model/types'

export interface TaskQueryAllRequest {
  /** 0부터 시작한다. */
  page: number
  size: number
  /** 상태 탭. `전체 업무` 는 보내지 않는다. */
  status?: TaskStatus
}

export interface TaskQueryAssigneeResponse {
  id: number
  name: string
  position: string | null
}

export interface TaskQueryAllResponseItem {
  id: number
  title: string
  /** 담당자 목록. 목록 화면은 대표(첫 번째) 이름만 쓴다. */
  assignees: TaskQueryAssigneeResponse[]
  assigneeCount: number
  status: TaskStatus
  priority: TaskPriority
  finishDate: string
}

export interface TaskQueryAllResponse {
  tasks: TaskQueryAllResponseItem[]
  /** 총 페이지 수 */
  totalPageSize: number
}

export interface TaskQueryAllErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface TaskQueryRequest {
  id: number
}

export interface TaskQueryFileResponse {
  fileName: string
  fileKey: string
}

export type TaskQueryReportStatus = 'APPROVED' | 'REJECTED' | 'MISSING'

export interface TaskQueryReportResponse {
  /** 미제출이면 null 이다. */
  workReportId: number | null
  appAdminId: number
  name: string
  status: TaskQueryReportStatus
}

export interface TaskQueryProgressResponse {
  total: number
  approved: number
  rejected: number
  pending: number
  missing: number
}

export interface TaskQueryResponse {
  id: number
  title: string
  content: string
  assignees: TaskQueryAssigneeResponse[]
  assigneeCount: number
  status: TaskStatus
  priority: TaskPriority
  finishDate: string
  createdAt: string
  files: TaskQueryFileResponse[]
  reports: TaskQueryReportResponse[]
  progress: TaskQueryProgressResponse
}

export interface TaskQueryErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface TaskCreateRequest {
  title: string
  content: string
  assigneeIds: number[]
  /** yyyy-MM-dd */
  finishDate: string
  priority: TaskPriority
  /** 첨부파일 키 목록. 첨부가 없으면 빈 배열이다. */
  files: string[]
}

export interface TaskCreateResponse {
  message: string
}

export interface TaskCreateErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export type TaskUpdateRequest = TaskCreateRequest

export interface TaskUpdateResponse {
  message: string
}

export interface TaskUpdateErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface TaskDeleteRequest {
  id: number
}

export interface TaskDeleteResponse {
  message: string
}

export interface TaskDeleteErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
