import styled from '@emotion/styled'

export type Meridiem = 'AM' | 'PM'

export interface TimeParts {
  hour: string
  minute: string
  meridiem: Meridiem
}

interface OperatingTimeFieldProps {
  label: string
  value: TimeParts
  onChange?: (value: TimeParts) => void
  readOnly?: boolean
}

export function OperatingTimeField({
  label,
  value,
  onChange,
  readOnly = false,
}: OperatingTimeFieldProps) {
  function updateNumber(part: 'hour' | 'minute', nextValue: string) {
    onChange?.({
      ...value,
      [part]: nextValue.replace(/\D/g, '').slice(0, 2),
    })
  }

  function normalizeNumber(part: 'hour' | 'minute') {
    const nextValue = value[part]
    if (!nextValue) return
    onChange?.({ ...value, [part]: nextValue.padStart(2, '0') })
  }

  return (
    <Card role="group" aria-label={label} aria-readonly={readOnly}>
      <Label>{label}</Label>
      <TimeRow>
        <TimeInput
          aria-label={`${label} 시`}
          inputMode="numeric"
          maxLength={2}
          readOnly={readOnly}
          value={value.hour}
          onBlur={() => normalizeNumber('hour')}
          onChange={(event) => updateNumber('hour', event.target.value)}
        />
        <TimeInput
          aria-label={`${label} 분`}
          inputMode="numeric"
          maxLength={2}
          readOnly={readOnly}
          value={value.minute}
          onBlur={() => normalizeNumber('minute')}
          onChange={(event) => updateNumber('minute', event.target.value)}
        />
        <PeriodGroup role="group" aria-label={`${label} 오전 오후 선택`}>
          <PeriodButton
            type="button"
            aria-pressed={value.meridiem === 'AM'}
            $selected={value.meridiem === 'AM'}
            disabled={readOnly}
            onClick={() => onChange?.({ ...value, meridiem: 'AM' })}
          >
            오전
          </PeriodButton>
          <PeriodButton
            type="button"
            aria-pressed={value.meridiem === 'PM'}
            $selected={value.meridiem === 'PM'}
            disabled={readOnly}
            onClick={() => onChange?.({ ...value, meridiem: 'PM' })}
          >
            오후
          </PeriodButton>
        </PeriodGroup>
      </TimeRow>
    </Card>
  )
}

const Card = styled.div`
  display: flex;
  width: 426px;
  min-width: 0;
  min-height: 184px;
  flex-direction: column;
  gap: 12px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    width: 100%;
  }
`

const Label = styled.div`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  text-decoration: underline;
`

const TimeRow = styled.div`
  display: flex;
  width: 346px;
  max-width: 100%;
  gap: 12px;
`

const TimeInput = styled.input`
  width: 0;
  min-width: 0;
  height: 68px;
  flex: 1 1 0;
  padding: 0;
  border: 0;
  border-radius: 8px;
  outline: 0;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;

  &:focus-visible {
    outline: 4px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 4px;
  }
`

const PeriodGroup = styled.div`
  display: flex;
  width: 56px;
  height: 68px;
  flex: 0 0 56px;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
`

const PeriodButton = styled.button<{ $selected: boolean }>`
  display: flex;
  min-height: 0;
  flex: 1 1 50%;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.text : theme.colors.textFaint};
  cursor: pointer;
  font: inherit;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;

  &:focus-visible {
    outline: 4px solid ${({ theme }) => theme.colors.primary};
    outline-offset: calc(-1 * 4px);
  }

  &:disabled {
    cursor: default;
  }
`
