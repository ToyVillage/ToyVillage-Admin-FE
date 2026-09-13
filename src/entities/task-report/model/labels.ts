import type { TaskReportReviewStatus } from './types'

// 목록 탭 라벨. 표·상세의 배지 문구(`승인`)와는 다르다(`TaskReportReviewBadge`).
export const taskReportReviewStatusLabels: Record<
  TaskReportReviewStatus,
  string
> = {
  PENDING: '심사대기',
  APPROVED: '완료',
  REJECTED: '반려',
}
