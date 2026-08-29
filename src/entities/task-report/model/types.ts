import type { TaskPriority, TaskStatus } from '@/entities/task'

// 보고 심사 상태. 목록 탭이 이 값을 기준으로 나뉜다(spec: 탭이 유일한 심사 상태 표현).
export const taskReportReviewStatuses = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'RESUBMITTED',
] as const
export type TaskReportReviewStatus = (typeof taskReportReviewStatuses)[number]

export interface TaskReport {
  id: string
  /** 이 보고가 속한 업무. 업무 상세의 `업무 보고 상세조회` 진입에 쓴다. 없으면 업무 목록 밖의 보고다. */
  taskId?: string
  assigneeId: string
  title: string
  content: string
  reviewStatus: TaskReportReviewStatus
  /** 표의 `상태` 컬럼과 상세 메타의 `상태:` 는 원 업무 상태다(spec 결정 사항). */
  taskStatus: TaskStatus
  priority: TaskPriority
  /** YYYY-MM-DD */
  dueDate: string
  /** 공개범위. Figma 표기를 그대로 둔다(업무관리와 같은 규칙). */
  visibility: string
  attachments?: string[]
}

export type TaskReportListItem = Pick<
  TaskReport,
  'id' | 'title' | 'priority' | 'dueDate' | 'visibility'
> & {
  assigneeName: string
  taskStatus: TaskStatus
}
