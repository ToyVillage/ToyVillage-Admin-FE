import { useEffect, useId, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { DateCalendar } from '@/shared/ui'
import {
  exportPeriodPresetOptions,
  fromCalendarValue,
  toCalendarValue,
  type ExportPeriod,
  type ExportPeriodPreset,
} from '../lib/exportPeriod'
import { ExportDateButton } from './ExportDateButton'

type OpenCalendar = 'start' | 'end' | null

interface ExportPeriodFieldProps {
  period: ExportPeriod
  onPresetChange: (preset: ExportPeriodPreset) => void
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
}

// Figma `기간 선택`(2995:25235) — 기간 버튼 6개와 시작일·종료일 달력.
export function ExportPeriodField({
  period,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
}: ExportPeriodFieldProps) {
  const titleId = useId()
  const radioName = useId()
  const [openCalendar, setOpenCalendar] = useState<OpenCalendar>(null)
  const rangeRef = useRef<HTMLDivElement>(null)
  const startButtonRef = useRef<HTMLButtonElement>(null)
  const endButtonRef = useRef<HTMLButtonElement>(null)

  const datesDisabled = period.preset === 'all'

  // 날짜 영역 밖을 누르면 값을 바꾸지 않고 달력을 닫는다.
  // Esc 는 포커스가 기간 버튼 등 달력 밖에 있어도 닫고 그 날짜 버튼으로 포커스를 옮긴다.
  // 달력 안의 Esc 는 DateCalendar 가 먼저 받아 전파를 멈춘다.
  useEffect(() => {
    if (!openCalendar) return
    const button =
      openCalendar === 'start' ? startButtonRef.current : endButtonRef.current
    function handleMouseDown(event: MouseEvent) {
      if (!rangeRef.current?.contains(event.target as Node)) {
        setOpenCalendar(null)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpenCalendar(null)
      button?.focus()
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openCalendar])

  function changePreset(preset: ExportPeriodPreset) {
    onPresetChange(preset)
    // `직접 선택`은 시작일 달력을 바로 연다(Figma 2995:25375).
    setOpenCalendar(preset === 'custom' ? 'start' : null)
  }

  function toggleCalendar(target: Exclude<OpenCalendar, null>) {
    setOpenCalendar((current) => (current === target ? null : target))
  }

  // 닫으면 포커스를 그 날짜 버튼으로 돌려 키보드 사용자가 위치를 잃지 않게 한다.
  function closeCalendar() {
    const button =
      openCalendar === 'start' ? startButtonRef.current : endButtonRef.current
    setOpenCalendar(null)
    button?.focus()
  }

  return (
    <Card aria-labelledby={titleId}>
      <Title id={titleId}>기간</Title>
      <Presets role="radiogroup" aria-labelledby={titleId}>
        {exportPeriodPresetOptions.map((option) => (
          <PresetLabel key={option.value}>
            <PresetInput
              type="radio"
              name={radioName}
              value={option.value}
              checked={period.preset === option.value}
              onChange={() => changePreset(option.value)}
            />
            <Pill>{option.label}</Pill>
          </PresetLabel>
        ))}
      </Presets>
      <Range ref={rangeRef}>
        <ExportDateButton
          label="시작일"
          value={period.startDate}
          open={openCalendar === 'start'}
          disabled={datesDisabled}
          onClick={() => toggleCalendar('start')}
          buttonRef={startButtonRef}
        >
          {openCalendar === 'start' && !datesDisabled && (
            <DateCalendar
              variant="popover"
              label="시작일 선택"
              value={toCalendarValue(period.startDate)}
              onSelect={(value) => {
                onStartDateChange(fromCalendarValue(value))
                closeCalendar()
              }}
              onClose={closeCalendar}
            />
          )}
        </ExportDateButton>
        <Tilde aria-hidden="true">~</Tilde>
        <ExportDateButton
          label="종료일"
          value={period.endDate}
          open={openCalendar === 'end'}
          disabled={datesDisabled}
          onClick={() => toggleCalendar('end')}
          buttonRef={endButtonRef}
        >
          {openCalendar === 'end' && !datesDisabled && (
            <DateCalendar
              variant="popover"
              label="종료일 선택"
              value={toCalendarValue(period.endDate)}
              minDate={toCalendarValue(period.startDate) || undefined}
              onSelect={(value) => {
                onEndDateChange(fromCalendarValue(value))
                closeCalendar()
              }}
              onClose={closeCalendar}
            />
          )}
        </ExportDateButton>
      </Range>
    </Card>
  )
}

const Card = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

const Presets = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const PresetLabel = styled.label`
  position: relative;
  display: inline-flex;
  cursor: pointer;
`

// 투명한 radio 가 pill 전체를 덮어 클릭을 직접 받는다(PillRadioGroup 과 같은 방식).
const PresetInput = styled.input`
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
`

// Figma 선택 pill 은 1.5px 테두리만큼 커진다. 옆 pill 이 밀리지 않게 늘 투명 테두리를 둔다.
const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 13px 18px;
  border: 1.5px solid transparent;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textValue};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;

  input:checked + & {
    border-color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme }) => theme.colors.accentBg};
    color: ${({ theme }) => theme.colors.accent};
  }

  input:focus-visible + & {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Range = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;

  @media (max-width: 980px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const Tilde = styled.span`
  padding-bottom: 14px;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;

  @media (max-width: 980px) {
    display: none;
  }
`
