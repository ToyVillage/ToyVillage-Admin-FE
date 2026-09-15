// 업무일지 조회날짜 헬퍼는 공용 달력 날짜 유틸(shared/lib)로 옮겼다.
// 기존 호출부 이름을 유지하기 위한 얇은 재노출이다.
export {
  calendarYearSpan as workLogYearSpan,
  clampCalendarDate as clampWorkLogDate,
  daysInMonth,
  formatIsoDate as formatWorkLogDate,
  toIsoDate,
  todayCalendarDate as todayWorkLogDate,
} from '@/shared/lib'
