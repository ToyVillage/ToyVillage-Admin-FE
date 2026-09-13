import type { TaskPriority } from '@/entities/task'

// 보고 심사 상태. 목록 탭과 표의 `상태` 칸이 이 값을 쓴다(yot 에서 `재제출` 탭이 사라졌다).
export const taskReportReviewStatuses = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const
export type TaskReportReviewStatus = (typeof taskReportReviewStatuses)[number]

export interface TaskReport {
  id: string
  /** 이 보고가 속한 업무. 없으면 업무 목록 밖의 보고다. */
  taskId?: string
  assigneeId: string
  /** 담당자 이름. 업무보고 API 연동 시 응답 필드로 대체된다. */
  assigneeName: string
  title: string
  content: string
  reviewStatus: TaskReportReviewStatus
  priority: TaskPriority
  /** YYYY-MM-DD */
  dueDate: string
  attachments?: string[]
}

export type TaskReportListItem = Pick<
  TaskReport,
  'id' | 'assigneeName' | 'reviewStatus' | 'priority' | 'dueDate'
>
