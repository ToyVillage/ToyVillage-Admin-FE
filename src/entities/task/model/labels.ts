import type { TaskPriority, TaskStatus } from './types'

export const taskStatusLabels: Record<TaskStatus, string> = {
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  EXPIRED: '지연',
}

export const taskPriorityLabels: Record<TaskPriority, string> = {
  HIGH: '상',
  MEDIUM: '중',
  LOW: '하',
}
