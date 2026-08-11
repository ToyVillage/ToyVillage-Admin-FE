import type { TaskReportReviewStatus } from './types'

export const taskReportReviewStatusLabels: Record<
  TaskReportReviewStatus,
  string
> = {
  PENDING: '심사대기',
  APPROVED: '완료',
  REJECTED: '반려',
  RESUBMITTED: '재제출',
}
