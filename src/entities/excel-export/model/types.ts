// 엑셀로 내보낼 수 있는 페이지. 실제 API 계약 전까지 화면 기준 이름이다.
export type ExcelExportTarget =
  | 'animals'
  | 'feeds'
  | 'tasks'
  | 'task-reports'
  | 'work-logs'
  | 'reservations'
  | 'close-schedules'
  | 'notices'
  | 'staff-accounts'

export interface ExcelExportTargetOption {
  id: ExcelExportTarget
  /** 항목 이름. 예: `개체관리` */
  name: string
  /** 기간이 걸리는 날짜. 예: `관찰일 기준` */
  basis: string
}

export interface ExcelExportRequest {
  targets: ExcelExportTarget[]
  /** YYYY-MM-DD. `전체 기간`이면 null. */
  startDate: string | null
  /** YYYY-MM-DD. `전체 기간`이면 null. */
  endDate: string | null
}
