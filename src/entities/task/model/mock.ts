import { taskPriorities, taskProgressStatuses } from './types'
import type {
  CreateTaskInput,
  Task,
  TaskMember,
  TaskPriority,
  TaskProgressStatus,
  TaskTeam,
  UpdateTaskInput,
} from './types'

export const taskStorageKey = 'toyvillage:tasks'
export const deletedTaskStorageKey = 'toyvillage:tasks:deleted'

// localStorage mock 은 즉시 끝나므로 진행 중 상태를 관찰할 수 없다.
// 아래 두 키는 테스트 제어점이다. 실제 API 로 교체할 때 함께 제거한다.
// - delay: 값(ms)만큼 완료를 늦춰 `저장 중` 상태를 유지시킨다.
// - log: 요청이 실제로 몇 번 전송됐는지 확인한다.
export const taskMutationDelayStorageKey = 'toyvillage:tasks:mutation-delay'
export const taskMutationLogStorageKey = 'toyvillage:tasks:mutation-log'

type TaskMutationKind = 'create' | 'update'

// 담당자 팀 트리(yot `1:3694` 담당자 섹션). 전체 18명이고 팀 인원은 Figma 카운트를 따른다.
// Figma 실측은 사육팀 4명(이승현·홍길동·김민수·최유진)뿐이고 나머지는 보충한 mock 이다
// (task-create.spec.md 결정 사항). 실제 직원 데이터가 들어오면 교체한다.
export const taskTeams: TaskTeam[] = [
  { id: 'team-1', name: '동물 관리팀' },
  { id: 'team-2', name: '창고팀' },
  { id: 'team-3', name: '사육장 청소팀' },
  { id: 'team-4', name: '사육팀' },
]

// 목록·상세의 `담당자` 셀은 name, 트리 행은 label 을 쓴다.
export const taskMembers: TaskMember[] = [
  { id: 'emp-2', teamId: 'team-1', name: '김수인', label: '김수인 사원' },
  { id: 'emp-4', teamId: 'team-1', name: '박지훈', label: '박지훈 사원' },
  { id: 'emp-5', teamId: 'team-1', name: '정해나', label: '정해나 대리' },
  { id: 'emp-6', teamId: 'team-1', name: '오세영', label: '오세영 사원' },
  { id: 'emp-7', teamId: 'team-1', name: '한도윤', label: '한도윤 과장' },
  { id: 'emp-3', teamId: 'team-2', name: '이지아', label: '이지아 대리' },
  { id: 'emp-8', teamId: 'team-2', name: '서준호', label: '서준호 사원' },
  { id: 'emp-9', teamId: 'team-2', name: '문가온', label: '문가온 사원' },
  { id: 'emp-10', teamId: 'team-3', name: '김유영', label: '김유영 사원' },
  { id: 'emp-11', teamId: 'team-3', name: '배수민', label: '배수민 사원' },
  { id: 'emp-12', teamId: 'team-3', name: '신재원', label: '신재원 사원' },
  { id: 'emp-13', teamId: 'team-3', name: '임하늘', label: '임하늘 대리' },
  { id: 'emp-1', teamId: 'team-4', name: '이승현', label: '이승현 사원' },
  { id: 'emp-14', teamId: 'team-4', name: '홍길동', label: '홍길동 과장' },
  { id: 'emp-15', teamId: 'team-4', name: '김민수', label: '김민수 사원' },
  { id: 'emp-16', teamId: 'team-4', name: '최유진', label: '최유진 사원' },
  { id: 'emp-17', teamId: 'team-4', name: '강태오', label: '강태오 사원' },
  { id: 'emp-18', teamId: 'team-4', name: '윤소린', label: '윤소린 대리' },
]

const figmaContent = '상세 업무 내용이 입력되어있음'

// 슬라이스용 mock. 추후 TanStack Query + Axios로 대체.
// 1~4번은 Figma yot 1:3267 목록 표의 4행이다(이승현 외 5명 / 김수인 / 이지아 / 이승현 외 3명).
// 5번 이후는 페이지네이션과 빈 상태를 재현하기 위한 추가 행이다.
// 완료기한: Figma 캡처가 2026-07 이라 그대로 두면 1페이지 4행이 전부 기한 초과(위험색)로 보인다.
// 초과/정상을 한 화면에서 함께 확인할 수 있도록 3·4번만 미래 날짜로 옮겼다.
// 1·2번은 Figma 값(2026-07-03 / 2026-07-01)을 유지해 초과 표시를 남긴다.
export const mockTasks: Task[] = [
  {
    id: '1',
    assigneeIds: ['emp-1', 'emp-2', 'emp-3', 'emp-10', 'emp-14', 'emp-15'],
    title: '업무 제목',
    content: figmaContent,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2026-07-03',
    attachments: ['당일 지침.pdf', '휴관안내.png', '휴관안내.jpg'],
  },
  {
    id: '2',
    assigneeIds: ['emp-2'],
    title: '업무 제목',
    content: figmaContent,
    status: 'DONE',
    priority: 'LOW',
    dueDate: '2026-07-01',
  },
  {
    id: '3',
    assigneeIds: ['emp-3'],
    title: '업무 제목',
    content: figmaContent,
    status: 'DONE',
    priority: 'HIGH',
    dueDate: '2027-02-20',
  },
  {
    id: '4',
    assigneeIds: ['emp-1', 'emp-14', 'emp-15', 'emp-16'],
    title: '업무 제목',
    content: figmaContent,
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: '2026-08-14',
  },
  {
    id: '5',
    assigneeIds: ['emp-2'],
    title: '여름 프로그램 준비',
    content: '여름 프로그램 물품과 일정을 정리해주세요.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: '2027-04-10',
  },
  {
    id: '6',
    assigneeIds: ['emp-3'],
    title: '사육장 점검 보고',
    content: '사육장 점검 결과를 정리해 보고해주세요.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2027-04-17',
  },
  {
    id: '7',
    assigneeIds: ['emp-1'],
    title: '단체예약 응대 정리',
    content: '이번 달 단체예약 응대 내역을 정리해주세요.',
    status: 'DONE',
    priority: 'LOW',
    dueDate: '2026-12-18',
  },
  {
    id: '8',
    assigneeIds: ['emp-2'],
    title: '휴관 안내문 게시',
    content: '휴관 안내문을 게시하고 결과를 알려주세요.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: '2026-09-02',
  },
  {
    id: '9',
    assigneeIds: ['emp-3'],
    title: '자료실 파일 정리',
    content: '자료실의 오래된 파일을 정리해주세요.',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    dueDate: '2027-01-08',
  },
  {
    id: '10',
    assigneeIds: ['emp-1'],
    title: '연간 운영 계획 초안',
    content: '내년 운영 계획 초안을 작성해주세요.',
    status: 'DONE',
    priority: 'HIGH',
    dueDate: '2027-01-20',
  },
  {
    id: '11',
    assigneeIds: ['emp-11'],
    title: '동절기 급수설비 점검',
    content: '동파 우려 구역의 급수설비를 점검하고 결과를 보고해주세요.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2027-01-28',
  },
  {
    id: '12',
    assigneeIds: ['emp-5'],
    title: '체험학습 안전교육',
    content: '체험학습 인솔자 대상 안전교육을 진행해주세요.',
    status: 'DONE',
    priority: 'MEDIUM',
    dueDate: '2027-02-05',
  },
  {
    id: '13',
    assigneeIds: ['emp-8', 'emp-9'],
    title: '사료 재고 정리',
    content: '창고 사료 재고를 실사하고 부족분을 정리해주세요.',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    dueDate: '2027-02-12',
  },
  {
    id: '14',
    assigneeIds: ['emp-13'],
    title: '봄맞이 시설 보수',
    content: '개장 전 노후 시설을 확인하고 보수 계획을 세워주세요.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: '2027-03-02',
  },
]

export function findTaskMember(memberId: string): TaskMember | undefined {
  return taskMembers.find((member) => member.id === memberId)
}

export function findTaskTeam(teamId: string): TaskTeam | undefined {
  return taskTeams.find((team) => team.id === teamId)
}

export async function getMockTasks(): Promise<Task[]> {
  const storedTasks = readStoredTasks()
  const storedById = new Map(storedTasks.map((task) => [task.id, task]))
  const deletedIds = readDeletedTaskIds()
  const mergedMocks = mockTasks
    .filter((task) => !deletedIds.has(task.id))
    .map((task) => storedById.get(task.id) ?? task)
  const createdTasks = storedTasks.filter(
    (task) =>
      !deletedIds.has(task.id) &&
      !mockTasks.some((mockTask) => mockTask.id === task.id),
  )

  return [...createdTasks, ...mergedMocks]
}

// 목록은 아직 mock 이라 서버의 삭제 결과를 모른다. 삭제 성공을 로컬에 기록해
// 다음 조회에서 제외한다. 실제 목록 조회 API 로 교체할 때 이 기록도 함께 제거한다.
export function recordDeletedMockTask(id: string): void {
  const deletedIds = readDeletedTaskIds()
  deletedIds.add(id)
  localStorage.setItem(deletedTaskStorageKey, JSON.stringify([...deletedIds]))
}

export async function getMockTask(id: string): Promise<Task | null> {
  const tasks = await getMockTasks()
  return tasks.find((task) => task.id === id) ?? null
}

export async function createMockTask(input: CreateTaskInput): Promise<Task> {
  await startMockMutation('create')

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
  await startMockMutation('update')

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

// 요청 시점을 기록한 뒤, 설정된 지연만큼 완료를 늦춘다.
async function startMockMutation(kind: TaskMutationKind): Promise<void> {
  recordMockMutation(kind)

  const delay = Number(localStorage.getItem(taskMutationDelayStorageKey))
  if (!Number.isFinite(delay) || delay <= 0) return

  await new Promise((resolve) => setTimeout(resolve, delay))
}

function recordMockMutation(kind: TaskMutationKind): void {
  localStorage.setItem(
    taskMutationLogStorageKey,
    JSON.stringify([...readMockMutationLog(), kind]),
  )
}

function readMockMutationLog(): string[] {
  const rawLog = localStorage.getItem(taskMutationLogStorageKey)
  if (!rawLog) return []

  try {
    const log: unknown = JSON.parse(rawLog)
    return Array.isArray(log)
      ? log.filter((entry): entry is string => typeof entry === 'string')
      : []
  } catch {
    return []
  }
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
    Array.isArray(task.assigneeIds) &&
    task.assigneeIds.every((id) => typeof id === 'string') &&
    typeof task.title === 'string' &&
    typeof task.content === 'string' &&
    isTaskProgressStatus(task.status) &&
    isTaskPriority(task.priority) &&
    typeof task.dueDate === 'string' &&
    (task.attachments === undefined ||
      (Array.isArray(task.attachments) &&
        task.attachments.every((name) => typeof name === 'string')))
  )
}

// 열거형 밖의 값이 통과하면 taskStatusLabels·taskPriorityLabels 조회가 빈 값이 된다.
// 저장값은 진행 상태(`IN_PROGRESS`/`DONE`)뿐이다 — `OVERDUE` 는 완료기한에서 파생된다.
function isTaskProgressStatus(value: unknown): value is TaskProgressStatus {
  return taskProgressStatuses.some((status) => status === value)
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return taskPriorities.some((priority) => priority === value)
}
