import { useMemo, useState } from 'react'
import styled from '@emotion/styled'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// "yyyy.mm.dd" → {y,m,d} (유효할 때만). 직접 입력값과 달력을 잇는다.
function parseYmd(value: string) {
  const matched = value.match(/^(\d{4})\.(\d{2})\.(\d{2})$/)
  if (!matched) return null
  const y = Number(matched[1])
  const m = Number(matched[2])
  const d = Number(matched[3])
  if (m < 1 || m > 12 || d < 1 || d > 31) return null
  return { y, m, d }
}

const pad = (n: number) => String(n).padStart(2, '0')
const toYmd = (y: number, m: number, d: number) => `${y}.${pad(m)}.${pad(d)}`

interface Cell {
  y: number
  m: number
  d: number
  current: boolean
}

interface DateCalendarProps {
  value: string
  onSelect: (value: string) => void
}

export function DateCalendar({ value, onSelect }: DateCalendarProps) {
  const selected = parseYmd(value)
  const today = new Date()
  const [view, setView] = useState(() =>
    selected
      ? { y: selected.y, m: selected.m }
      : { y: today.getFullYear(), m: today.getMonth() + 1 },
  )

  // 인접 월 날짜까지 채워 주(week) 단위로 완성한다.
  const cells = useMemo<Cell[]>(() => {
    const firstWeekday = new Date(view.y, view.m - 1, 1).getDay()
    const daysInMonth = new Date(view.y, view.m, 0).getDate()
    const prevMonthDays = new Date(view.y, view.m - 1, 0).getDate()
    const prevM = view.m === 1 ? 12 : view.m - 1
    const prevY = view.m === 1 ? view.y - 1 : view.y
    const nextM = view.m === 12 ? 1 : view.m + 1
    const nextY = view.m === 12 ? view.y + 1 : view.y

    const list: Cell[] = []
    for (let i = 0; i < firstWeekday; i += 1) {
      list.push({
        y: prevY,
        m: prevM,
        d: prevMonthDays - firstWeekday + 1 + i,
        current: false,
      })
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      list.push({ y: view.y, m: view.m, d, current: true })
    }
    let nextDay = 1
    while (list.length % 7 !== 0) {
      list.push({ y: nextY, m: nextM, d: nextDay, current: false })
      nextDay += 1
    }
    return list
  }, [view])

  function move(delta: number) {
    setView((v) => {
      const idx = v.y * 12 + (v.m - 1) + delta
      return { y: Math.floor(idx / 12), m: (idx % 12) + 1 }
    })
  }

  const isToday = (c: Cell) =>
    today.getFullYear() === c.y &&
    today.getMonth() + 1 === c.m &&
    today.getDate() === c.d
  const isSelected = (c: Cell) =>
    Boolean(selected && selected.y === c.y && selected.m === c.m && selected.d === c.d)

  return (
    <Panel role="dialog" aria-label="날짜 선택">
      <Header>
        <NavButton
          type="button"
          aria-label="이전 달"
          onMouseDown={(event) => {
            event.preventDefault()
            move(-1)
          }}
        >
          ‹
        </NavButton>
        <Title>
          {view.y}년 {pad(view.m)}월
        </Title>
        <NavButton
          type="button"
          aria-label="다음 달"
          onMouseDown={(event) => {
            event.preventDefault()
            move(1)
          }}
        >
          ›
        </NavButton>
      </Header>
      <WeekRow>
        {WEEKDAYS.map((w) => (
          <Weekday key={w}>{w}</Weekday>
        ))}
      </WeekRow>
      <Grid>
        {cells.map((c) => (
          <Day
            key={`${c.y}-${c.m}-${c.d}`}
            type="button"
            $current={c.current}
            // mousedown 로 처리해 input blur보다 먼저 선택되게 한다.
            // 선택해도 닫지 않는다(바깥 클릭 시에만 닫힘).
            onMouseDown={(event) => {
              event.preventDefault()
              if (!c.current) setView({ y: c.y, m: c.m })
              onSelect(toYmd(c.y, c.m, c.d))
            }}
          >
            <Num $selected={isSelected(c)}>{c.d}</Num>
            {isToday(c) && !isSelected(c) && <TodayDot aria-hidden="true" />}
          </Day>
        ))}
      </Grid>
    </Panel>
  )
}

// 필드와 같은 회색 배경으로 바로 아래에 붙어 하나의 패널처럼 보인다.
const Panel = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  display: flex;
  width: 100%;
  min-width: 320px;
  flex-direction: column;
  gap: 16px;
  padding: 8px 20px 24px;
  border-radius: 0 0 8px 8px;
  background: ${({ theme }) => theme.colors.background};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
`

const Title = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
`

const NavButton = styled.button`
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textGuide};
  cursor: pointer;
  font-size: 28px;
  line-height: 1;
`

const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`

const Weekday = styled.span`
  padding: 4px 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
  text-align: center;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 8px;
`

const Day = styled.button<{ $current: boolean }>`
  position: relative;
  display: inline-flex;
  min-height: 56px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: ${({ theme, $current }) =>
    $current ? theme.colors.textStrong : theme.colors.textGuide};
  cursor: pointer;
  font: inherit;
`

const Num = styled.span<{ $selected: boolean }>`
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.accent : 'transparent'};
  color: ${({ theme, $selected }) => ($selected ? theme.colors.surface : 'inherit')};
  font-size: 20px;
  font-weight: 500;
  line-height: 1;
`

const TodayDot = styled.span`
  position: absolute;
  bottom: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.danger};
`
