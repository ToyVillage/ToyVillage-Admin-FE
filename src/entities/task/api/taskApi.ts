import { api } from '@/shared/api/axios'
import {
  taskPriorities,
  taskReportStatuses,
  taskStatuses,
} from '../model/types'
import type {
  Task,
  TaskListItem,
  TaskPriority,
  TaskReportStatus,
  TaskStatus,
} from '../model/types'
import type {
  TaskCreateRequest,
  TaskCreateResponse,
  TaskDeleteRequest,
  TaskDeleteResponse,
  TaskQueryAllRequest,
  TaskQueryAllResponse,
  TaskQueryAllResponseItem,
  TaskQueryAssigneeResponse,
  TaskQueryFileResponse,
  TaskQueryProgressResponse,
  TaskQueryReportResponse,
  TaskQueryRequest,
  TaskQueryResponse,
  TaskUpdateRequest,
  TaskUpdateResponse,
} from './types'

export interface TaskListPage {
  items: TaskListItem[]
  /** 총 페이지 수 */
  totalPageSize: number
}

export async function getTasks({
  page,
  size,
  status,
}: TaskQueryAllRequest): Promise<TaskListPage> {
  if (!Number.isSafeInteger(page) || page < 0) {
    throw new Error('업무지시 목록 페이지 번호가 올바르지 않습니다.')
  }

  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error('업무지시 목록 페이지 크기가 올바르지 않습니다.')
  }

  // `전체 업무` 탭은 status 를 보내지 않는다. sort 는 서버 기본값(id,DESC)을 쓴다.
  const params = status ? { page, size, status } : { page, size }
  const { data } = await api.get<unknown>('/tasks', { params })

  if (!isTaskQueryAllResponse(data)) {
    throw new Error('업무지시 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    items: data.tasks.map((task) => ({
      id: String(task.id),
      title: task.title,
      // 목록 셀은 대표 담당자 한 명만 쓴다. 나머지 인원은 assigneeCount 로 센다.
      assigneeName: task.assignees[0]?.name ?? '',
      assigneeExtraCount: Math.max(task.assigneeCount - 1, 0),
      status: task.status,
      priority: task.priority,
      dueDate: task.finishDate,
    })),
    totalPageSize: data.totalPageSize,
  }
}

export async function getTask({ id }: TaskQueryRequest): Promise<Task> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('업무지시 ID가 올바르지 않습니다.')
  }

  const { data } = await api.get<unknown>(`/tasks/${id}`)

  if (!isTaskQueryResponse(data)) {
    throw new Error('업무지시 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    id: String(data.id),
    title: data.title,
    content: data.content,
    assignees: data.assignees,
    assigneeCount: data.assigneeCount,
    status: data.status,
    priority: data.priority,
    dueDate: data.finishDate,
    attachments: data.files.map(({ fileName }) => fileName),
    attachmentFiles: data.files,
    // 담당자 전원이 한 줄씩 온다. 미제출이면 `workReportId` 가 null 이라
    // 열 보고가 없다는 뜻이므로 id 도 null 로 남긴다.
    reports: data.reports.map((report) => ({
      reportId:
        report.workReportId === null ? null : String(report.workReportId),
      assigneeId: report.appAdminId,
      name: report.name,
      status: toTaskReportStatus(report.status, report.workReportId),
    })),
    // 집계는 서버 값을 그대로 쓴다. reports 로 다시 세지 않는다.
    progress: data.progress,
  }
}

export async function createTask(
  input: TaskCreateRequest,
): Promise<TaskCreateResponse> {
  const { data, status } = await api.post<unknown>('/tasks', input)

  if (status !== 201) {
    throw new Error('업무지시 생성 응답 상태가 올바르지 않습니다.')
  }

  if (!isTaskMessageResponse(data)) {
    throw new Error('업무지시 생성 응답 형식이 올바르지 않습니다.')
  }

  return data
}

export async function updateTask({
  id,
  input,
}: {
  id: number
  input: TaskUpdateRequest
}): Promise<TaskUpdateResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('업무지시 수정 요청 ID가 올바르지 않습니다.')
  }

  const { data, status } = await api.put<unknown>(`/tasks/${id}`, input)

  if (status !== 200) {
    throw new Error('업무지시 수정 응답 상태가 올바르지 않습니다.')
  }

  if (!isTaskMessageResponse(data)) {
    throw new Error('업무지시 수정 응답 형식이 올바르지 않습니다.')
  }

  return data
}

export async function deleteTask({
  id,
}: TaskDeleteRequest): Promise<TaskDeleteResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('업무지시 삭제 요청 ID가 올바르지 않습니다.')
  }

  const { data, status } = await api.delete<unknown>(`/tasks/${id}`)

  if (status !== 200) {
    throw new Error('업무지시 삭제 응답 상태가 올바르지 않습니다.')
  }

  if (!isTaskMessageResponse(data)) {
    throw new Error('업무지시 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isTaskQueryAllResponse(
  value: unknown,
): value is TaskQueryAllResponse {
  if (typeof value !== 'object' || value === null) return false

  const response = value as Record<string, unknown>

  return (
    Array.isArray(response.tasks) &&
    response.tasks.every(isTaskQueryAllResponseItem) &&
    Number.isInteger(response.totalPageSize)
  )
}

function isTaskQueryAllResponseItem(
  value: unknown,
): value is TaskQueryAllResponseItem {
  if (typeof value !== 'object' || value === null) return false

  const task = value as Record<string, unknown>

  return (
    Number.isInteger(task.id) &&
    typeof task.title === 'string' &&
    Array.isArray(task.assignees) &&
    task.assignees.every(isTaskQueryAssignee) &&
    Number.isInteger(task.assigneeCount) &&
    isTaskStatus(task.status) &&
    isTaskPriority(task.priority) &&
    typeof task.finishDate === 'string'
  )
}

function isTaskQueryResponse(value: unknown): value is TaskQueryResponse {
  if (typeof value !== 'object' || value === null) return false

  const task = value as Record<string, unknown>

  return (
    Number.isInteger(task.id) &&
    typeof task.title === 'string' &&
    typeof task.content === 'string' &&
    Array.isArray(task.assignees) &&
    task.assignees.every(isTaskQueryAssignee) &&
    Number.isInteger(task.assigneeCount) &&
    isTaskStatus(task.status) &&
    isTaskPriority(task.priority) &&
    typeof task.finishDate === 'string' &&
    typeof task.createdAt === 'string' &&
    Array.isArray(task.files) &&
    task.files.every(isTaskQueryFile) &&
    Array.isArray(task.reports) &&
    task.reports.every(isTaskQueryReport) &&
    isTaskQueryProgress(task.progress)
  )
}

function isTaskQueryReport(value: unknown): value is TaskQueryReportResponse {
  if (typeof value !== 'object' || value === null) return false

  const report = value as Record<string, unknown>

  return (
    (report.workReportId === null || Number.isInteger(report.workReportId)) &&
    Number.isInteger(report.appAdminId) &&
    typeof report.name === 'string' &&
    typeof report.status === 'string'
  )
}

// 보고 상태는 아직 확정 전이다(task.backend-questions #5). 모르는 값이 와도 상세 화면을
// 살려야 하므로, 제출된 줄은 심사 대기로 미제출 줄은 `MISSING` 으로 낙관 처리한다.
function toTaskReportStatus(
  status: string,
  workReportId: number | null,
): TaskReportStatus {
  const known = taskReportStatuses.find((value) => value === status)
  if (known) return known

  return workReportId === null ? 'MISSING' : 'PENDING'
}

function isTaskQueryProgress(
  value: unknown,
): value is TaskQueryProgressResponse {
  if (typeof value !== 'object' || value === null) return false

  const progress = value as Record<string, unknown>

  return (
    ['total', 'approved', 'rejected', 'pending', 'missing'] as const
  ).every((key) => Number.isInteger(progress[key]))
}

function isTaskQueryAssignee(
  value: unknown,
): value is TaskQueryAssigneeResponse {
  if (typeof value !== 'object' || value === null) return false

  const assignee = value as Record<string, unknown>

  return (
    Number.isInteger(assignee.id) &&
    typeof assignee.name === 'string' &&
    (assignee.position === null || typeof assignee.position === 'string')
  )
}

function isTaskQueryFile(value: unknown): value is TaskQueryFileResponse {
  if (typeof value !== 'object' || value === null) return false

  const file = value as Record<string, unknown>
  return typeof file.fileName === 'string' && typeof file.fileKey === 'string'
}

function isTaskMessageResponse(
  value: unknown,
): value is TaskCreateResponse | TaskUpdateResponse | TaskDeleteResponse {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as Record<string, unknown>).message === 'string'
}

// 열거형 밖의 값이 통과하면 taskStatusLabels·taskPriorityLabels 조회가 빈 값이 된다.
function isTaskStatus(value: unknown): value is TaskStatus {
  return taskStatuses.some((status) => status === value)
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return taskPriorities.some((priority) => priority === value)
}
