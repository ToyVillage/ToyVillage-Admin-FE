import type { WorkLogDate } from './types'

// 조회날짜 년 선택지는 현재 연도 기준 최근 5개 연도다(spec).
export const workLogYearSpan = 5

export function todayWorkLogDate(): WorkLogDate {
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

// 년/월을 바꿔 선택된 일이 그 달에 없으면 그 달의 마지막 날로 보정한다(spec).
export function clampWorkLogDate(date: WorkLogDate): WorkLogDate {
  const lastDay = daysInMonth(date.year, date.month)
  return date.day <= lastDay ? date : { ...date, day: lastDay }
}

/** YYYY-MM-DD */
export function toIsoDate(date: WorkLogDate): string {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`
}

/** YYYY.MM.DD — 표의 `날짜` 열 표기 */
export function formatWorkLogDate(isoDate: string): string {
  return isoDate.replaceAll('-', '.')
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
