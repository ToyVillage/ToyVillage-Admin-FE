import type { TaskPriority } from '@/entities/task'

// 보고 심사 상태. 목록 탭과 표의 `상태` 칸이 이 값을 쓴다(yot 에서 `재제출` 탭이 사라졌다).
export const taskReportReviewStatuses = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const
export type TaskReportReviewStatus = (typeof taskReportReviewStatuses)[number]

/** 반려 사유 최대 글자 수(APP_WORK_REPORT_REJECT `1000자 이하`). */
export const taskReportRejectionReasonMaxLength = 1000

export interface TaskReport {
  id: string
  /** 담당자 이름 */
  assigneeName: string
  /** 업무지시 제목 */
  title: string
  content: string
  reviewStatus: TaskReportReviewStatus
  priority: TaskPriority
  /** YYYY-MM-DD */
  dueDate: string
  attachments: string[]
}

export type TaskReportListItem = Pick<
  TaskReport,
  'id' | 'assigneeName' | 'reviewStatus' | 'priority' | 'dueDate'
>
