import type { ExcelExportTargetOption } from './types'

// Figma `item grid`(2995:25186) 순서. 왼쪽 위부터 가로로 읽는다.
export const excelExportTargetOptions: ExcelExportTargetOption[] = [
  { id: 'animals', name: '개체관리', basis: '관찰일 기준' },
  { id: 'feeds', name: '먹이 급여 관리', basis: '급여일 기준' },
  { id: 'tasks', name: '업무관리', basis: '등록일 기준' },
  { id: 'task-reports', name: '업무보고', basis: '제출일 기준' },
  { id: 'work-logs', name: '업무일지관리', basis: '작성일 기준' },
  { id: 'reservations', name: '단체예약', basis: '방문일 기준' },
  { id: 'close-schedules', name: '휴관일 관리', basis: '휴관일 기준' },
  { id: 'notices', name: '공지사항', basis: '작성일 기준' },
  { id: 'staff-accounts', name: '직원 계정 관리', basis: '기간 미적용' },
]
