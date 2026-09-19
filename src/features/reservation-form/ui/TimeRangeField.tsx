import { useId } from 'react'
import styled from '@emotion/styled'
import arrowRight from '@/shared/ui/assets/arrow-right.svg'
import clockIcon from '@/shared/ui/assets/clock.svg'
import { LabeledField } from './fields'
import { TimeSegment } from './TimeSegment'

interface TimeRangeFieldProps {
  label: string
  required?: boolean
  /** 입장/퇴장 중 먼저 걸린 에러 하나만 보인다(한 필드이므로). */
  error?: string
  enterTime: string
  exitTime: string
  onEnterTimeChange: (value: string) => void
  onExitTimeChange: (value: string) => void
}

// Figma 2098:17385 — 입장·퇴장 시각을 한 박스(392x66)에서 24시간제로 직접 입력한다.
// 시계 아이콘 + 시작 시각 → 화살표 → 종료 시각.
export function TimeRangeField({
  label,
  required,
  error,
  enterTime,
  exitTime,
  onEnterTimeChange,
  onExitTimeChange,
}: TimeRangeFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <LabeledField
      label={label}
      required={required}
      error={error}
      htmlFor={id}
      errorId={error ? errorId : undefined}
    >
      <Box $error={Boolean(error)}>
        <Start>
          <ClockImg src={clockIcon} alt="" aria-hidden="true" />
          <TimeSegment
            inputId={id}
            ariaPrefix={`${label} 입장시간`}
            errorId={error ? errorId : undefined}
            time={enterTime}
            onTimeChange={onEnterTimeChange}
          />
        </Start>
        <ArrowImg src={arrowRight} alt="" aria-hidden="true" />
        <TimeSegment
          ariaPrefix={`${label} 퇴장시간`}
          errorId={error ? errorId : undefined}
          time={exitTime}
          onTimeChange={onExitTimeChange}
        />
      </Box>
    </LabeledField>
  )
}

// Figma: h66, radius 8, gray/10 배경, 좌 20 / 우 24 패딩.
const Box = styled.div<{ $error: boolean }>`
  display: flex;
  box-sizing: border-box;
  height: 66px;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px 0 20px;
  border: 1px solid
    ${({ theme, $error }) => ($error ? theme.colors.danger : 'transparent')};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
`

const Start = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const ClockImg = styled.img`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`

const ArrowImg = styled.img`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`
