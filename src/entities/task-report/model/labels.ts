import type { TaskReportReviewStatus } from './types'

// 목록 탭 라벨. 표·상세의 배지 문구(`TaskReportReviewBadge`)도 같은 `완료` 를 쓴다.
export const taskReportReviewStatusLabels: Record<
  TaskReportReviewStatus,
  string
> = {
  PENDING: '심사대기',
  APPROVED: '완료',
  REJECTED: '반려',
}
