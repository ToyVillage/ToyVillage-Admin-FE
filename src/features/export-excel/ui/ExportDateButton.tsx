import { useId, type ReactNode, type Ref } from 'react'
import styled from '@emotion/styled'
import calendarIcon from '@/shared/ui/assets/calendar.svg'
import { formatPeriodDate } from '../lib/exportPeriod'

interface ExportDateButtonProps {
  label: string
  /** YYYY-MM-DD. 비어 있으면 null. */
  value: string | null
  open: boolean
  disabled: boolean
  onClick: () => void
  buttonRef?: Ref<HTMLButtonElement>
  /** 열렸을 때 버튼 아래 띄울 달력. */
  children?: ReactNode
}

// Figma `date field / 시작일`·`종료일`(2995:25251·25259). 누르면 아래에 달력을 연다.
export function ExportDateButton({
  label,
  value,
  open,
  disabled,
  onClick,
  buttonRef,
  children,
}: ExportDateButtonProps) {
  const id = useId()
  const labelId = `${id}-label`
  const valueId = `${id}-value`

  return (
    <Field>
      <Label id={labelId}>{label}</Label>
      <Button
        ref={buttonRef}
        type="button"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        data-open={open}
        onClick={onClick}
      >
        <Value id={valueId} $empty={!value}>
          {value ? formatPeriodDate(value) : '연도. 월. 일'}
        </Value>
        <CalendarIcon src={calendarIcon} alt="" aria-hidden="true" />
      </Button>
      {children}
    </Field>
  )
}

const Field = styled.div`
  position: relative;
  display: flex;
  min-width: 0;
  max-width: 352px;
  flex: 1 1 352px;
  flex-direction: column;
  gap: 10px;
`

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textValue};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

// Figma 는 열린 입력에만 안쪽 2px 테두리를 그린다. 크기가 변하지 않게 늘 투명 테두리를 둔다.
const Button = styled.button`
  display: flex;
  width: 100%;
  height: 66px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 22px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  cursor: pointer;
  font: inherit;
  text-align: left;

  &[data-open='true'] {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:disabled {
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Value = styled.span<{ $empty: boolean }>`
  min-width: 0;
  overflow: hidden;
  color: ${({ theme, $empty }) =>
    $empty ? theme.colors.textGuide : theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CalendarIcon = styled.img`
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
`
