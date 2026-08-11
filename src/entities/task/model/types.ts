// 상태는 목록 표시 전용 파생값이다(spec: 변경 UI 없음).
export type TaskStatus = 'IN_PROGRESS' | 'DONE' | 'REJECTED'

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Task {
  id: string
  assigneeId: string
  title: string
  content: string
  status: TaskStatus
  priority: TaskPriority
  /** YYYY-MM-DD */
  dueDate: string
  /** 공개범위. 목록 표기와 폼 옵션을 각각 Figma 그대로 둔다(spec 결정 사항). */
  visibility: string
  attachments?: string[]
}

export type TaskListItem = Pick<
  Task,
  'id' | 'title' | 'status' | 'priority' | 'dueDate' | 'visibility'
> & {
  assigneeName: string
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
