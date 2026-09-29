import { daysInMonth, todayCalendarDate, toIsoDate } from './calendarDate'
import type { CalendarDate } from './calendarDate'

// 목록 화면의 조회 조건(날짜·페이지·검색어)은 URL 이 소유한다.
// 상세에 다녀오거나 새로고침해도 그대로 남게 하려는 것이다 — 지역 상태로 두면
// 화면이 다시 마운트될 때 오늘 날짜·1페이지·검색어 없음으로 되돌아간다.

// 1보다 작거나 숫자가 아니면 첫 페이지로 본다.
export function readPageParam(params: URLSearchParams, key = 'page'): number {
  const value = Number(params.get(key))
  return Number.isSafeInteger(value) && value > 0 ? value : 1
}

// 형식만 보면 `2026-02-31`·`2026-13-01` 같은 없는 날짜가 통과해 서버로 나간다.
// 실제 달력에 있는 날인지까지 확인하고, 아니면 오늘로 둔다.
export function readIsoDateParam(
  params: URLSearchParams,
  key = 'date',
): string {
  const value = params.get(key)
  return value && isCalendarIsoDate(value)
    ? value
    : toIsoDate(todayCalendarDate())
}

export function readKeywordParam(
  params: URLSearchParams,
  key = 'keyword',
): string {
  return params.get(key)?.trim() ?? ''
}

export function isCalendarIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)
}

export function toCalendarDate(isoDate: string): CalendarDate {
  const [year, month, day] = isoDate.split('-').map(Number)
  return { year, month, day }
}
