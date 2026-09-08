// 저장되는 진행 상태. `지연` 은 완료기한에서 파생되므로 여기에 없다.
export const taskProgressStatuses = ['IN_PROGRESS', 'DONE'] as const
export type TaskProgressStatus = (typeof taskProgressStatuses)[number]

// 화면에 찍히는 상태. 완료되지 않은 업무의 완료기한이 지나면 `OVERDUE`(지연)다.
// 목록에서 상태를 바꾸는 UI 는 없다(spec). `resolveTaskStatus` 가 유일한 산출 경로다.
export const taskStatuses = ['IN_PROGRESS', 'DONE', 'OVERDUE'] as const
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
  status: TaskProgressStatus
  priority: TaskPriority
  /** YYYY-MM-DD */
  dueDate: string
  attachments?: string[]
}

export type TaskListItem = Pick<
  Task,
  'id' | 'title' | 'priority' | 'dueDate'
> & {
  /** 화면 표기용 상태(`resolveTaskStatus` 결과). 저장값과 달리 `OVERDUE` 를 포함한다. */
  status: TaskStatus
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
