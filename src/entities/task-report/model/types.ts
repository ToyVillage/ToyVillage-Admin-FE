import type { TaskPriority } from '@/entities/task'

// 보고 심사 상태. 목록 탭과 표의 `상태` 칸이 이 값을 쓰고, 배열 순서가 곧 탭 순서다.
// `RESUBMIT` 은 반려된 보고를 직원이 다시 제출한 상태다(`재심사대기`, #218).
export const taskReportReviewStatuses = [
  'PENDING',
  'RESUBMIT',
  'APPROVED',
  'REJECTED',
] as const
export type TaskReportReviewStatus = (typeof taskReportReviewStatuses)[number]

/** 아직 심사 대상인 상태. 심사가 끝난 `완료`·`반려` 보고는 승인·반려를 다시 받지 않는다(#159). */
export function isTaskReportReviewable(status: TaskReportReviewStatus) {
  return status === 'PENDING' || status === 'RESUBMIT'
}

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
  /** 첨부 파일명과 저장소 키. 다운로드는 키로 파일 서버에서 받는다. */
  attachmentFiles: TaskReportAttachmentFile[]
}

export interface TaskReportAttachmentFile {
  fileName: string
  fileKey: string
}

export type TaskReportListItem = Pick<
  TaskReport,
  'id' | 'assigneeName' | 'title' | 'reviewStatus' | 'priority' | 'dueDate'
>
