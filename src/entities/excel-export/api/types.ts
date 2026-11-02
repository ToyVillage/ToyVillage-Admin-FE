// GET /excel 요청 값. harness/api/approvals/excel-export.contract.json 기준.
export type ExcelExportType =
  | 'NOTICE'
  | 'TASK'
  | 'WORK_REPORT'
  | 'RESERVATION'
  | 'TEAM_MEMBER'
  | 'ANIMAL'
  | 'WORK_LOG'
  | 'FEED_LOG'
  | 'FIFTH_FLOOR_FEED_LOG'
  | 'ANIMAL_OBSERVATION'
  | 'DOCUMENT'

export type ExcelExportMode = 'SHEET' | 'ZIP'

export interface ExcelExportQuery {
  types: ExcelExportType[]
  mode: ExcelExportMode
  /** YYYY-MM-DD. 없으면 하한 없음. */
  startDate?: string
  /** YYYY-MM-DD. 없으면 상한 없음. */
  endDate?: string
}
