import type { DashboardCloseSchedule } from './types'

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

export interface MonthCell {
  date: Date
  inMonth: boolean
}

// 오늘이 속한 주(일요일~토요일) — `이번주 · 2026.08.30 ~ 09.05`
export function formatWeekRange(today: Date): string {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  start.setDate(start.getDate() - start.getDay())
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `이번주 · ${start.getFullYear()}.${pad(start.getMonth() + 1)}.${pad(start.getDate())} ~ ${pad(end.getMonth() + 1)}.${pad(end.getDate())}`
}

/** `2026년 09월` */
export function formatMonthTitle(year: number, month: number): string {
  return `${year}년 ${pad(month)}월`
}

// 달력에 그릴 주 단위 칸. 첫 주 앞과 마지막 주 뒤는 이웃 달 날짜로 채운다.
export function buildMonthWeeks(year: number, month: number): MonthCell[][] {
  const first = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0).getDate()
  const weekCount = Math.ceil((first.getDay() + lastDay) / 7)
  const weeks: MonthCell[][] = []
  for (let w = 0; w < weekCount; w += 1) {
    const week: MonthCell[] = []
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(year, month - 1, 1 - first.getDay() + w * 7 + d)
      week.push({ date, inMonth: date.getMonth() === month - 1 })
    }
    weeks.push(week)
  }
  return weeks
}

export function toIsoDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function isCloseDay(
  isoDay: string,
  schedules: DashboardCloseSchedule[],
): boolean {
  return schedules.some(
    ({ startDate, endDate }) => startDate <= isoDay && isoDay <= endDate,
  )
}

// 이번 달에 걸친 휴관일을 시작일 순(같으면 긴 기간 먼저)으로 정렬한다.
export function closeSchedulesInMonth(
  schedules: DashboardCloseSchedule[],
  year: number,
  month: number,
): DashboardCloseSchedule[] {
  const monthStart = `${year}-${pad(month)}-01`
  const monthEnd = `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`
  return schedules
    .filter(
      ({ startDate, endDate }) =>
        startDate <= monthEnd && endDate >= monthStart,
    )
    .sort(
      (a, b) =>
        a.startDate.localeCompare(b.startDate) ||
        b.endDate.localeCompare(a.endDate),
    )
}

/** `7월 9일` / `7월 13일 ~ 7월 14일` */
export function formatCloseScheduleRange({
  startDate,
  endDate,
}: DashboardCloseSchedule): string {
  const start = formatMonthDay(startDate)
  return startDate === endDate ? start : `${start} ~ ${formatMonthDay(endDate)}`
}

/** YYYY-MM-DDTHH:mm → `2026.09.03 09:30` */
export function formatDateTime(isoDateTime: string): string {
  const [date, time = ''] = isoDateTime.split('T')
  return `${date.replaceAll('-', '.')} ${time.slice(0, 5)}`.trim()
}

// 24시간 이내는 `N시간 전`, 그 외는 `YYYY.MM.DD`.
export function formatRecentDate(isoDateTime: string, now: Date): string {
  const elapsed = now.getTime() - new Date(isoDateTime).getTime()
  if (elapsed >= 0 && elapsed < DAY_MS) {
    return `${Math.max(1, Math.floor(elapsed / HOUR_MS))}시간 전`
  }
  return isoDateTime.slice(0, 10).replaceAll('-', '.')
}

function formatMonthDay(isoDay: string): string {
  const [, month, day] = isoDay.split('-')
  return `${Number(month)}월 ${Number(day)}일`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
