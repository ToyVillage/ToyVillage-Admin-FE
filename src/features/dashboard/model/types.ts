import type { TaskStatus } from '@/entities/task'
import type { TaskReportReviewStatus } from '@/entities/task-report'

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
  /** YYYY-MM-DDTHH:mm */
  fedAt: string
}

export interface DashboardObservation {
  id: string
  content: string
  /** YYYY-MM-DDTHH:mm */
  recordedAt: string
}

export interface DashboardTaskReport {
  id: string
  title: string
  reviewStatus: TaskReportReviewStatus
}

export interface DashboardWorkLog {
  id: string
  formName: string
  authorName: string
}

export interface DashboardSummary {
  kpi: DashboardKpi
  closeSchedules: DashboardCloseSchedule[]
  taskStatusCounts: DashboardTaskStatusCounts
  feeds: DashboardFeed[]
  observations: DashboardObservation[]
  taskReports: DashboardTaskReport[]
  workLogs: DashboardWorkLog[]
}
