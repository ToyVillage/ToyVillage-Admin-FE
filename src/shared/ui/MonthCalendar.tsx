import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { toIsoDate } from '../lib/calendarDate'
import chevronIcon from './assets/chevron-left.svg'

interface MonthCalendarProps {
  /** YYYY-MM-DD */
  value: string
  onSelect: (isoDate: string) => void
}

interface DayCell {
  isoDate: string
  year: number
  month: number
  day: number
  inMonth: boolean
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

// Figma `calender` 인스턴스(3071:27258, 392×506) — 날짜 이동 칸 아래 팝오버 달력.
// 앞뒤 달 날짜까지 채워 주 단위로 그리고, 선택한 날짜는 파란 원으로 표시한다.
export function MonthCalendar({ value, onSelect }: MonthCalendarProps) {
  const [selectedYear, selectedMonth] = value.split('-').map(Number)
  const [view, setView] = useState({ year: selectedYear, month: selectedMonth })

  const cells = useMemo(() => buildMonthCells(view.year, view.month), [view])

  function moveMonth(delta: number) {
    setView((current) => {
      const index = current.year * 12 + (current.month - 1) + delta
      return { year: Math.floor(index / 12), month: (index % 12) + 1 }
    })
  }

  return (
    <Calendar role="dialog" aria-label="달력">
      <Header>
        <MonthButton
          type="button"
          aria-label="이전 달"
          onClick={() => moveMonth(-1)}
        >
          <img src={chevronIcon} alt="" aria-hidden="true" />
        </MonthButton>
        <MonthTitle aria-live="polite">
          {view.year}년 {String(view.month).padStart(2, '0')}월
        </MonthTitle>
        <MonthButton
          type="button"
          aria-label="다음 달"
          data-direction="next"
          onClick={() => moveMonth(1)}
        >
          <img src={chevronIcon} alt="" aria-hidden="true" />
        </MonthButton>
      </Header>

      <Grid>
        {weekdays.map((weekday) => (
          <Weekday key={weekday}>{weekday}</Weekday>
        ))}
        {cells.map((cell) => {
          const selected = cell.isoDate === value
          return (
            <DayButton
              key={cell.isoDate}
              type="button"
              aria-label={`${cell.year}년 ${cell.month}월 ${cell.day}일`}
              aria-pressed={selected}
              $inMonth={cell.inMonth}
              onClick={() => onSelect(cell.isoDate)}
            >
              <DayNumber $selected={selected}>{cell.day}</DayNumber>
            </DayButton>
          )
        })}
      </Grid>
    </Calendar>
  )
}

function buildMonthCells(year: number, month: number): DayCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const lastDay = new Date(year, month, 0).getDate()
  const cellCount = Math.ceil((firstWeekday + lastDay) / 7) * 7

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(year, month - 1, 1 - firstWeekday + index)
    const cellYear = date.getFullYear()
    const cellMonth = date.getMonth() + 1
    const cellDay = date.getDate()
    return {
      isoDate: toIsoDate({ year: cellYear, month: cellMonth, day: cellDay }),
      year: cellYear,
      month: cellMonth,
      day: cellDay,
      inMonth: cellMonth === month,
    }
  })
}

const Calendar = styled.div`
  width: 392px;
  box-sizing: border-box;
  padding: 20px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  box-shadow: 0 8px 24px rgba(54, 54, 64, 0.16);
  font-family: ${({ theme }) => theme.font.body};
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
`

const MonthButton = styled.button`
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  place-items: center;

  &[data-direction='next'] img {
    transform: rotate(180deg);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const MonthTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 50px);
  grid-auto-rows: 72px;
  margin-top: 26px;
  justify-content: space-between;
`

const Weekday = styled.span`
  height: 44px;
  padding-top: 6px;
  box-sizing: border-box;
  color: ${({ theme }) => theme.colors.optionMuted};
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
`

const DayButton = styled.button<{ $inMonth: boolean }>`
  display: flex;
  justify-content: center;
  padding: 6px 0 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: ${({ theme, $inMonth }) =>
    $inMonth ? theme.colors.textStrong : theme.colors.textFaint};
  cursor: pointer;
  font: inherit;

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
  }
`

const DayNumber = styled.span<{ $selected: boolean }>`
  display: grid;
  min-width: 24px;
  height: 24px;
  border-radius: 22px;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.accent : 'transparent'};
  color: ${({ theme, $selected }) => ($selected ? theme.colors.surface : 'inherit')};
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  place-items: center;
`
