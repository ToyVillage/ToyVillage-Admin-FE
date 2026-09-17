import type { TaskStatus } from '@/entities/task'

export interface DashboardKpi {
  feeds: number
  individuals: number
  taskReports: number
  workLogs: number
}

export interface DashboardCloseSchedule {
  id: string
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
  title: string
}

export type DashboardTaskStatusCounts = Record<TaskStatus, number>

export interface DashboardFeed {
  id: string
  species: string
  animalName: string
  /** YYYY-MM-DDTHH:mm[:ss] */
  fedAt: string
}

export interface DashboardObservation {
  id: string
  content: string
  /** YYYY-MM-DDTHH:mm[:ss] */
  recordedAt: string
}
