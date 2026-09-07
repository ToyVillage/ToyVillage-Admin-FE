// 상태는 목록 표시 전용 파생값이다(spec: 변경 UI 없음).
// 저장소 값 검증(mock.ts)과 레이블(labels.ts)이 같은 목록을 쓰도록 값으로 둔다.
export const taskStatuses = ['IN_PROGRESS', 'DONE', 'REJECTED'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const taskPriorities = ['HIGH', 'MEDIUM', 'LOW'] as const
export type TaskPriority = (typeof taskPriorities)[number]

export interface Task {
  id: string
  /**
   * 담당자 (1명 이상). 목록·상세의 `외 N명` 은 이 배열 길이에서 파생된다.
   * yot 폼이 팀 트리 다중 선택으로 바뀌면서 단일 `assigneeId` 를 대체했다.
   */
  assigneeIds: string[]
  title: string
  content: string
  status: TaskStatus
  priority: TaskPriority
  /** YYYY-MM-DD */
  dueDate: string
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
  'priority' | 'dueDate' | 'assigneeIds' | 'title' | 'content' | 'attachments'
>

export type UpdateTaskInput = CreateTaskInput

export interface TaskTeam {
  id: string
  /** 담당자 트리의 팀 행 표기 */
  name: string
}

export interface TaskMember {
  id: string
  teamId: string
  /** 목록·상세의 `담당자` 표기 */
  name: string
  /** 담당자 트리의 직원 행 표기 (직급 포함) */
  label: string
}
