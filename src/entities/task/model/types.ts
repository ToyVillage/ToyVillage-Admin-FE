// 상태는 목록 표시 전용 파생값이다(spec: 변경 UI 없음).
// 저장소 값 검증(mock.ts)과 레이블(labels.ts)이 같은 목록을 쓰도록 값으로 둔다.
export const taskStatuses = ['IN_PROGRESS', 'DONE', 'REJECTED'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const taskPriorities = ['HIGH', 'MEDIUM', 'LOW'] as const
export type TaskPriority = (typeof taskPriorities)[number]

export interface Task {
  id: string
  assigneeId: string
  title: string
  content: string
  status: TaskStatus
  priority: TaskPriority
  /** YYYY-MM-DD */
  dueDate: string
  /** 공개범위. 폼 옵션으로만 남는다 — 새 Figma 목록 표에는 공개범위 컬럼이 없다. */
  visibility: string
  /**
   * 대표 담당자를 제외한 추가 담당자 수. 목록 `외 N명` 표기 전용 표시값이다.
   * `assigneeId` → `assignees[]` 모델 전환은 task-create·task-edit·API 계약과 함께 처리한다
   * (task-list spec 미결 사항).
   */
  additionalAssigneeCount?: number
  attachments?: string[]
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

export type CreateTaskInput = Pick<
  Task,
  | 'priority'
  | 'dueDate'
  | 'visibility'
  | 'assigneeId'
  | 'title'
  | 'content'
  | 'attachments'
>

export type UpdateTaskInput = CreateTaskInput

export interface TaskAssignee {
  id: string
  /** 목록 `담당자` 셀 표기 */
  name: string
  /** 담당자 드롭다운 옵션 표기 */
  label: string
}
