import styled from '@emotion/styled'
import type { DashboardCloseSchedule } from '../model/types'
import {
  buildMonthWeeks,
  formatMonthTitle,
  isCloseDay,
  toIsoDay,
} from '../model/format'

interface HolidayMiniCalendarProps {
  year: number
  /** 1-12 */
  month: number
  schedules: DashboardCloseSchedule[]
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

type DayTone = 'default' | 'sunday' | 'prevMonth' | 'nextMonth'

// Figma `mini calendar`(1906:17374) — 조회 전용. 연속 휴관일은 가로로 이어 그린다.
export function HolidayMiniCalendar({
  year,
  month,
  schedules,
}: HolidayMiniCalendarProps) {
  const weeks = buildMonthWeeks(year, month)
  const title = formatMonthTitle(year, month)

  return (
    <Calendar>
      <Caption>{title}</Caption>
      <thead>
        <tr>
          {weekdays.map((weekday) => (
            <Weekday key={weekday} scope="col">
              {weekday}
            </Weekday>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={toIsoDay(week[0].date)}>
            {week.map(({ date, inMonth }, index) => {
              const isoDay = toIsoDay(date)
              const closed = inMonth && isCloseDay(isoDay, schedules)
              const joinsPrev =
                closed &&
                index > 0 &&
                week[index - 1].inMonth &&
                isCloseDay(toIsoDay(week[index - 1].date), schedules)
              const joinsNext =
                closed &&
                index < 6 &&
                week[index + 1].inMonth &&
                isCloseDay(toIsoDay(week[index + 1].date), schedules)
              const day = date.getDate()

              return (
                <DayCell key={isoDay}>
                  <Day
                    $tone={dayTone(inMonth, date, year, month)}
                    $closed={closed}
                    $joinsPrev={joinsPrev}
                    $joinsNext={joinsNext}
                    aria-label={closed ? `${day}일 휴관일` : undefined}
                  >
                    {day}
                  </Day>
                </DayCell>
              )
            })}
          </tr>
        ))}
      </tbody>
    </Calendar>
  )
}

function dayTone(
  inMonth: boolean,
  date: Date,
  year: number,
  month: number,
): DayTone {
  if (!inMonth) {
    return date < new Date(year, month - 1, 1) ? 'prevMonth' : 'nextMonth'
  }
  return date.getDay() === 0 ? 'sunday' : 'default'
}

const Calendar = styled.table`
  width: 406px;
  flex-shrink: 0;
  border-collapse: collapse;
  table-layout: fixed;
`

const Caption = styled.caption`
  height: 40px;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: 40px;
  text-align: left;
`

const Weekday = styled.th`
  height: 32px;
  padding: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 15px;
  font-weight: 500;
`

const DayCell = styled.td`
  height: 44px;
  padding: 0;
  text-align: center;
`

const Day = styled.span<{
  $tone: DayTone
  $closed: boolean
  $joinsPrev: boolean
  $joinsNext: boolean
}>`
  position: relative;
  display: inline-flex;
  width: 54px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: ${({ $joinsPrev, $joinsNext }) =>
    `${$joinsPrev ? 0 : 10}px ${$joinsNext ? 0 : 10}px ${$joinsNext ? 0 : 10}px ${$joinsPrev ? 0 : 10}px`};
  background: ${({ theme, $closed }) => ($closed ? theme.colors.dangerSoftBg : 'transparent')};
  color: ${({ theme, $tone, $closed }) => {
    if ($closed || $tone === 'sunday') return theme.colors.danger
    if ($tone === 'prevMonth') return theme.colors.textGuide
    if ($tone === 'nextMonth') return theme.colors.textFaint
    return theme.colors.textStrong
  }};
  font-size: 16px;
  font-weight: 500;
  line-height: normal;

  /* Figma range bridge — 붙은 두 칸 사이 4px 를 채운다. */
  &::before {
    position: absolute;
    top: 0;
    left: -4px;
    display: ${({ $joinsPrev }) => ($joinsPrev ? 'block' : 'none')};
    width: 4px;
    height: 40px;
    background: ${({ theme }) => theme.colors.dangerSoftBg};
    content: '';
  }
`
