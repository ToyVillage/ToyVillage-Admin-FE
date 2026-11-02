import type { ExcelExportQuery } from '../api/types'
import type { ExcelExportRequest, ExcelExportTargetOption } from './types'

// Figma `item grid`(2995:25186) 순서. 왼쪽 위부터 가로로 읽는다.
export const excelExportTargetOptions: ExcelExportTargetOption[] = [
  { id: 'ANIMAL', name: '동물 리스트', basis: '기간 미적용', dated: false },
  {
    id: 'ANIMAL_OBSERVATION',
    name: '관찰일지',
    basis: '관찰일 기준',
    dated: true,
  },
  { id: 'FEED_LOG', name: '4층 먹이 급여', basis: '급여일 기준', dated: true },
  {
    id: 'FIFTH_FLOOR_FEED_LOG',
    name: '5층 먹이 급여',
    basis: '급여일 기준',
    dated: true,
  },
  { id: 'TASK', name: '업무관리', basis: '등록일 기준', dated: true },
  { id: 'WORK_REPORT', name: '업무보고', basis: '제출일 기준', dated: true },
  { id: 'WORK_LOG', name: '업무일지관리', basis: '작성일 기준', dated: true },
  { id: 'RESERVATION', name: '단체예약', basis: '방문일 기준', dated: true },
  { id: 'NOTICE', name: '공지사항', basis: '작성일 기준', dated: true },
  {
    id: 'TEAM_MEMBER',
    name: '직원 계정 관리',
    basis: '기간 미적용',
    dated: false,
  },
]

export function toExcelExportQuery({
  targets,
  startDate,
  endDate,
  mode,
}: ExcelExportRequest): ExcelExportQuery {
  return {
    types: targets,
    mode,
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  }
}
