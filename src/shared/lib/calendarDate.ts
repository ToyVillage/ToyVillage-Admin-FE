// 년/월/일 셀렉트 3개로 고르는 달력 날짜. 도메인에 종속되지 않는 공용 값이다.
export interface CalendarDate {
  year: number
  /** 1-12 */
  month: number
  /** 1-31 */
  day: number
}

// 년 선택지는 현재 연도 기준 최근 5개 연도다.
export const calendarYearSpan = 5

export function todayCalendarDate(): CalendarDate {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  }
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// 년/월을 바꿔 선택된 일이 그 달에 없으면 그 달의 마지막 날로 보정한다.
export function clampCalendarDate(date: CalendarDate): CalendarDate {
  const lastDay = daysInMonth(date.year, date.month)
  return date.day <= lastDay ? date : { ...date, day: lastDay }
}

/** YYYY-MM-DD */
export function toIsoDate(date: CalendarDate): string {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`
}

/** YYYY-MM-DD → YYYY.MM.DD — 표의 `날짜` 열 표기 */
export function formatIsoDate(isoDate: string): string {
  return isoDate.replaceAll('-', '.')
}

/** YYYY-MM-DD 에 날수를 더한다. 달·해 경계를 넘으면 Date 가 맞춰 준다. */
export function shiftIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const shifted = new Date(year, month - 1, day + days)
  return toIsoDate({
    year: shifted.getFullYear(),
    month: shifted.getMonth() + 1,
    day: shifted.getDate(),
  })
}

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'] as const

/** YYYY-MM-DD → `2026. 10. 20 (화)` — 날짜 이동 칸 표기 */
export function formatIsoDateWithWeekday(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const weekday = weekdayLabels[new Date(year, month - 1, day).getDay()]
  return `${year}. ${pad(month)}. ${pad(day)} (${weekday})`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
