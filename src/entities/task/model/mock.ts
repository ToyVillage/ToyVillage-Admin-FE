import { taskPriorities, taskStatuses } from './types'
import type {
  CreateTaskInput,
  Task,
  TaskAssignee,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
} from './types'

export const taskStorageKey = 'toyvillage:tasks'
export const deletedTaskStorageKey = 'toyvillage:tasks:deleted'

// 담당자 드롭다운 옵션. 목록 `담당자` 셀은 name, 드롭다운은 label 을 쓴다.
export const taskAssignees: TaskAssignee[] = [
  { id: 'emp-1', name: '이승현', label: '이승현 사원' },
  { id: 'emp-2', name: '김수인', label: '김수인 사원' },
  { id: 'emp-3', name: '이지아', label: '이지아 사원' },
]

// 생성·수정 폼의 공개범위 옵션(Figma 3851:5193). 목록 표기와는 별개 값이다(spec 결정 사항).
export const taskVisibilityOptions = ['전체 직원', '팀이름 1', '팀이름 2']

const figmaContent = '상세 업무 내용이 입력되어있음'

// 슬라이스용 mock. 추후 TanStack Query + Axios로 대체.
// 1~4번은 Figma 3056:2599 기준 행이다.
export const mockTasks: Task[] = [
  {
    id: '1',
    assigneeId: 'emp-1',
    title: '업무 제목',
    content: figmaContent,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2026-07-03',
    visibility: '전체 공개',
    attachments: ['당일 지침.pdf', '휴관안내.png', '휴관안내.jpg'],
  },
  {
    id: '2',
    assigneeId: 'emp-2',
    title: '업무 제목',
    content: figmaContent,
    status: 'DONE',
    priority: 'LOW',
    dueDate: '2026-07-01',
    visibility: '특정 파트',
  },
  {
    id: '3',
    assigneeId: 'emp-3',
    title: '업무 제목',
    content: figmaContent,
    status: 'DONE',
    priority: 'HIGH',
    dueDate: '2026-07-20',
    visibility: '특정 직원',
  },
  {
    id: '4',
    assigneeId: 'emp-1',
    title: '업무 제목',
    content: figmaContent,
    status: 'REJECTED',
    priority: 'MEDIUM',
    dueDate: '2026-07-28',
    visibility: '전체 공개',
  },
  {
    id: '5',
    assigneeId: 'emp-2',
    title: '여름 프로그램 준비',
    content: '여름 프로그램 물품과 일정을 정리해주세요.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: '2026-12-05',
    visibility: '전체 공개',
  },
  {
    id: '6',
    assigneeId: 'emp-3',
    title: '사육장 점검 보고',
    content: '사육장 점검 결과를 정리해 보고해주세요.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2026-12-11',
    visibility: '특정 파트',
  },
  {
    id: '7',
    assigneeId: 'emp-1',
    title: '단체예약 응대 정리',
    content: '이번 달 단체예약 응대 내역을 정리해주세요.',
    status: 'DONE',
    priority: 'LOW',
    dueDate: '2026-12-18',
    visibility: '특정 직원',
  },
  {
    id: '8',
    assigneeId: 'emp-2',
    title: '휴관 안내문 게시',
    content: '휴관 안내문을 게시하고 결과를 알려주세요.',
    status: 'REJECTED',
    priority: 'MEDIUM',
    dueDate: '2026-12-24',
    visibility: '전체 공개',
  },
  {
    id: '9',
    assigneeId: 'emp-3',
    title: '자료실 파일 정리',
    content: '자료실의 오래된 파일을 정리해주세요.',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    dueDate: '2027-01-08',
    visibility: '특정 파트',
  },
  {
    id: '10',
    assigneeId: 'emp-1',
    title: '연간 운영 계획 초안',
    content: '내년 운영 계획 초안을 작성해주세요.',
    status: 'DONE',
    priority: 'HIGH',
    dueDate: '2027-01-20',
    visibility: '전체 공개',
  },
]

export function findTaskAssignee(assigneeId: string): TaskAssignee | undefined {
  return taskAssignees.find((assignee) => assignee.id === assigneeId)
}

export async function getMockTasks(): Promise<Task[]> {
  const storedTasks = readStoredTasks()
  const storedById = new Map(storedTasks.map((task) => [task.id, task]))
  const deletedIds = readDeletedTaskIds()
  const mergedMocks = mockTasks
    .filter((task) => !deletedIds.has(task.id))
    .map((task) => storedById.get(task.id) ?? task)
  const createdTasks = storedTasks.filter(
    (task) => !mockTasks.some((mockTask) => mockTask.id === task.id),
  )

  return [...createdTasks, ...mergedMocks]
}

export async function getMockTask(id: string): Promise<Task | null> {
  const tasks = await getMockTasks()
  return tasks.find((task) => task.id === id) ?? null
}

export async function createMockTask(input: CreateTaskInput): Promise<Task> {
  const task: Task = {
    id: `created-${crypto.randomUUID()}`,
    ...input,
    status: 'IN_PROGRESS',
  }
  const storedTasks = readStoredTasks()

  localStorage.setItem(taskStorageKey, JSON.stringify([task, ...storedTasks]))

  return task
}

export async function updateMockTask({
  id,
  input,
}: {
  id: string
  input: UpdateTaskInput
}): Promise<Task> {
  const currentTask = await getMockTask(id)
  if (!currentTask) throw new Error('Task not found')

  const updatedTask: Task = {
    ...currentTask,
    ...input,
    attachments: input.attachments ?? [],
  }
  const storedTasks = readStoredTasks()
  const nextTasks = [
    updatedTask,
    ...storedTasks.filter((task) => task.id !== id),
  ]

  localStorage.setItem(taskStorageKey, JSON.stringify(nextTasks))
  return updatedTask
}

export async function deleteMockTask(id: string): Promise<void> {
  const currentTask = await getMockTask(id)
  if (!currentTask) throw new Error('Task not found')

  const nextTasks = readStoredTasks().filter((task) => task.id !== id)
  const deletedIds = readDeletedTaskIds()
  deletedIds.add(id)

  localStorage.setItem(taskStorageKey, JSON.stringify(nextTasks))
  localStorage.setItem(deletedTaskStorageKey, JSON.stringify([...deletedIds]))
}

function readStoredTasks(): Task[] {
  const rawTasks = localStorage.getItem(taskStorageKey)
  if (!rawTasks) return []

  try {
    const tasks: unknown = JSON.parse(rawTasks)
    return Array.isArray(tasks) ? tasks.filter(isTask) : []
  } catch {
    return []
  }
}

function readDeletedTaskIds(): Set<string> {
  const rawIds = localStorage.getItem(deletedTaskStorageKey)
  if (!rawIds) return new Set()

  try {
    const ids: unknown = JSON.parse(rawIds)
    return new Set(
      Array.isArray(ids)
        ? ids.filter((id): id is string => typeof id === 'string')
        : [],
    )
  } catch {
    return new Set()
  }
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false

  const task = value as Record<string, unknown>
  return (
    typeof task.id === 'string' &&
    typeof task.assigneeId === 'string' &&
    typeof task.title === 'string' &&
    typeof task.content === 'string' &&
    isTaskStatus(task.status) &&
    isTaskPriority(task.priority) &&
    typeof task.dueDate === 'string' &&
    typeof task.visibility === 'string' &&
    (task.attachments === undefined ||
      (Array.isArray(task.attachments) &&
        task.attachments.every((name) => typeof name === 'string')))
  )
}

// 열거형 밖의 값이 통과하면 taskStatusLabels·taskPriorityLabels 조회가 빈 값이 된다.
function isTaskStatus(value: unknown): value is TaskStatus {
  return taskStatuses.some((status) => status === value)
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return taskPriorities.some((priority) => priority === value)
}
