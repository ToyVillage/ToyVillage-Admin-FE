export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  counts: () => [...dashboardQueryKeys.all, 'counts'] as const,
  taskStatus: () => [...dashboardQueryKeys.all, 'task-status'] as const,
  feeds: (page: number, size: number) =>
    [...dashboardQueryKeys.all, 'feeds', { page, size }] as const,
  observations: (page: number, size: number) =>
    [...dashboardQueryKeys.all, 'observations', { page, size }] as const,
  closeSchedules: () => [...dashboardQueryKeys.all, 'close-schedules'] as const,
  taskReports: (page: number, size: number) =>
    [...dashboardQueryKeys.all, 'task-reports', { page, size }] as const,
  workLogs: (date: string, page: number, size: number) =>
    [...dashboardQueryKeys.all, 'work-logs', { date, page, size }] as const,
}
