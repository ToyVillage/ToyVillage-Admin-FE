import type { ExcelExportMode, ExcelExportType } from '../api/types'

// 화면에서 고를 수 있는 항목. 항목 하나가 서버 `types` 값 하나다.
export type ExcelExportTarget = Exclude<ExcelExportType, 'DOCUMENT'>

export interface ExcelExportTargetOption {
  id: ExcelExportTarget
  /** 항목 이름. 예: `관찰일지` */
  name: string
  /** 기간이 걸리는 날짜. 예: `관찰일 기준` */
  basis: string
  /** 기간이 적용되는 항목인지. 파일 이름에 날짜를 붙일지 정한다. */
  dated: boolean
}

export interface ExcelExportRequest {
  targets: ExcelExportTarget[]
  /** YYYY-MM-DD. `전체 기간`이면 null. */
  startDate: string | null
  /** YYYY-MM-DD. `전체 기간`이면 null. */
  endDate: string | null
  mode: ExcelExportMode
}
