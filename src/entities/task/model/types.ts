// 서버가 계산해 내려주는 업무 상태. 클라이언트는 파생하지 않는다.
// `COMPLETED` 는 담당자 전원이 APPROVED 인 경우, `EXPIRED` 는 미완료 + 완료기한 초과다.
export const taskStatuses = ['IN_PROGRESS', 'COMPLETED', 'EXPIRED'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const taskPriorities = ['HIGH', 'MEDIUM', 'LOW'] as const
export type TaskPriority = (typeof taskPriorities)[number]

export interface TaskAssignee {
  id: number
  name: string
  position: string | null
}

export interface TaskAttachmentFile {
  fileName: string
  fileKey: string
}

export interface Task {
  id: string
  title: string
  content: string
  /** 담당자 목록. 수정 화면의 담당자 체크 복원이 이 id 를 쓴다. */
  assignees: TaskAssignee[]
  /** 담당자 총원. `외 N명` 은 assigneeCount - 1 이다. */
  assigneeCount: number
  status: TaskStatus
  priority: TaskPriority
  /** YYYY-MM-DD (`finishDate`) */
  dueDate: string
  /** 첨부 파일명. 표시용이다. */
  attachments: string[]
  /** 첨부 파일명과 저장소 키. 수정 시 기존 첨부를 그대로 재전송하는 데 쓴다. */
  attachmentFiles: TaskAttachmentFile[]
}

export type TaskListItem = Pick<
  Task,
  'id' | 'title' | 'status' | 'priority' | 'dueDate'
> & {
  /** 대표 담당자 이름 */
  assigneeName: string
  /** 대표를 제외한 나머지 담당자 수. 0 이면 `외 N명` 을 렌더하지 않는다. */
  assigneeExtraCount: number
}
