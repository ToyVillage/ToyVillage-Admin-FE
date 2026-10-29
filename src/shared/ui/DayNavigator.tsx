import { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import {
  formatIsoDateWithWeekday,
  shiftIsoDate,
  todayCalendarDate,
  toIsoDate,
} from '../lib/calendarDate'
import calendarIcon from './assets/calendar.svg'
import chevronIcon from './assets/chevron-left-rounded.svg'
import { MonthCalendar } from './MonthCalendar'

interface DayNavigatorProps {
  /** YYYY-MM-DD */
  value: string
  onChange: (isoDate: string) => void
}

// Figma `날짜 선택`(3039:25290) — 이전 · 날짜 칸 · 다음 · 오늘. 날짜 칸을 누르면 달력(3071:27258)이 열린다.
export function DayNavigator({ value, onChange }: DayNavigatorProps) {
  const [open, setOpen] = useState(false)
  const fieldAreaRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLButtonElement>(null)

  const today = toIsoDate(todayCalendarDate())
  const isToday = value === today

  // 달력 바깥을 누르거나 Escape 를 누르면 날짜를 바꾸지 않고 닫는다.
  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!fieldAreaRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      fieldRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleSelect(isoDate: string) {
    setOpen(false)
    onChange(isoDate)
  }

  return (
    <Navigator>
      <RoundButton
        type="button"
        aria-label="이전 날짜"
        onClick={() => onChange(shiftIsoDate(value, -1))}
      >
        <img src={chevronIcon} alt="" aria-hidden="true" />
      </RoundButton>

      <FieldArea ref={fieldAreaRef}>
        <DateField
          ref={fieldRef}
          type="button"
          aria-label="날짜 선택"
          aria-haspopup="dialog"
          aria-expanded={open}
          $open={open}
          onClick={() => setOpen((current) => !current)}
        >
          <img src={calendarIcon} alt="" aria-hidden="true" />
          <DateText>{formatIsoDateWithWeekday(value)}</DateText>
        </DateField>
        {open && (
          <Popover>
            <MonthCalendar value={value} onSelect={handleSelect} />
          </Popover>
        )}
      </FieldArea>

      <RoundButton
        type="button"
        aria-label="다음 날짜"
        data-direction="next"
        onClick={() => onChange(shiftIsoDate(value, 1))}
      >
        <img src={chevronIcon} alt="" aria-hidden="true" />
      </RoundButton>

      <TodayButton
        type="button"
        aria-pressed={isToday}
        $active={isToday}
        onClick={() => onChange(today)}
      >
        오늘
      </TodayButton>
    </Navigator>
  )
}

const Navigator = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const RoundButton = styled.button`
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  place-items: center;

  img {
    width: 28px;
    height: 28px;
  }

  &[data-direction='next'] img {
    transform: rotate(180deg);
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const FieldArea = styled.div`
  position: relative;
`

const DateField = styled.button<{ $open: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  box-sizing: border-box;
  padding: 0 20px;
  border: ${({ theme, $open }) =>
    $open
      ? `2px solid ${theme.colors.accent}`
      : `1px solid ${theme.colors.tableHeaderStrong}`};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font: inherit;

  img {
    width: 28px;
    height: 28px;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const DateText = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`

const Popover = styled.div`
  position: absolute;
  z-index: 20;
  top: calc(100% + 12px);
  left: -2px;
`

const TodayButton = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.accent : theme.colors.tableHeaderStrong};
  border-radius: 100px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.accentBg : theme.colors.surface};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.accent : theme.colors.textValue};
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`
