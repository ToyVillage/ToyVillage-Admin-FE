import {
  clampCalendarDate,
  toCalendarDate,
  toIsoDate,
  todayCalendarDate,
} from '@/shared/lib'

export type ExportPeriodPreset =
  | 'all'
  | 'today'
  | 'week'
  | 'month'
  | 'quarter'
  | 'custom'

export interface ExportPeriod {
  preset: ExportPeriodPreset
  /** YYYY-MM-DD. 비어 있으면 null. */
  startDate: string | null
  /** YYYY-MM-DD. 비어 있으면 null. */
  endDate: string | null
}

// Figma `period presets`(2995:25237) 순서.
export const exportPeriodPresetOptions: {
  value: ExportPeriodPreset
  label: string
}[] = [
  { value: 'all', label: '전체 기간' },
  { value: 'today', label: '오늘' },
  { value: 'week', label: '최근 1주' },
  { value: 'month', label: '최근 1개월' },
  { value: 'quarter', label: '최근 3개월' },
  { value: 'custom', label: '직접 선택' },
]

export function todayIsoDate(): string {
  return toIsoDate(todayCalendarDate())
}

export function initialExportPeriod(today = todayIsoDate()): ExportPeriod {
  return applyPeriodPreset('month', null, today)
}

// 기간 버튼을 누르면 시작일·종료일을 바로 바꾼다. `직접 선택`은 시작일만 남긴다.
export function applyPeriodPreset(
  preset: ExportPeriodPreset,
  currentStartDate: string | null,
  today = todayIsoDate(),
): ExportPeriod {
  switch (preset) {
    case 'all':
      return { preset, startDate: null, endDate: null }
    case 'today':
      return { preset, startDate: today, endDate: today }
    case 'week':
      return { preset, startDate: shiftDays(today, -7), endDate: today }
    case 'month':
      return { preset, startDate: shiftMonths(today, -1), endDate: today }
    case 'quarter':
      return { preset, startDate: shiftMonths(today, -3), endDate: today }
    case 'custom':
      return { preset, startDate: currentStartDate, endDate: null }
  }
}

/** YYYY-MM-DD → `YYYY. MM. DD` */
export function formatPeriodDate(isoDate: string): string {
  return isoDate.replaceAll('-', '. ')
}

export function formatPeriodSummary(period: ExportPeriod): string {
  if (period.preset === 'all') return '전체 기간'
  const start = period.startDate ? formatPeriodDate(period.startDate) : ''
  const end = period.endDate ? formatPeriodDate(period.endDate) : ''
  return `${start} ~ ${end}`.trim()
}

/** YYYY-MM-DD ↔ 달력 값 `yyyy.mm.dd` */
export function toCalendarValue(isoDate: string | null): string {
  return isoDate ? isoDate.replaceAll('-', '.') : ''
}

export function fromCalendarValue(value: string): string {
  return value.replaceAll('.', '-')
}

function shiftDays(isoDate: string, days: number): string {
  const { year, month, day } = toCalendarDate(isoDate)
  const shifted = new Date(year, month - 1, day + days)
  return toIsoDate({
    year: shifted.getFullYear(),
    month: shifted.getMonth() + 1,
    day: shifted.getDate(),
  })
}

// 같은 날이 없는 달은 그 달의 마지막 날로 맞춘다(5월 31일의 석 달 전 → 2월 28일).
function shiftMonths(isoDate: string, months: number): string {
  const { year, month, day } = toCalendarDate(isoDate)
  const monthIndex = year * 12 + (month - 1) + months
  return toIsoDate(
    clampCalendarDate({
      year: Math.floor(monthIndex / 12),
      month: (monthIndex % 12) + 1,
      day,
    }),
  )
}
