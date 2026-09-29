import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import styled from '@emotion/styled'
import calendarIcon from '@/shared/ui/assets/calendar.svg'
import { DateCalendar } from './DateCalendar'
import {
  formatDateInput,
  formatDigits,
  formatMoney,
  formatPhone,
} from '../model/format'

type FieldFormat = 'digits' | 'money' | 'phone'

const formatters: Record<FieldFormat, (raw: string) => string> = {
  digits: formatDigits,
  money: formatMoney,
  phone: formatPhone,
}

// 라벨(+필수 *) + 컨트롤 + 인라인 에러. (Figma: 라벨 Medium 20 #36363F, gap 12)
export function LabeledField({
  label,
  required,
  error,
  htmlFor,
  errorId,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  htmlFor?: string
  // 인라인 에러 텍스트의 id. 입력의 aria-describedby와 연결한다(스크린리더 연관).
  errorId?: string
  children: ReactNode
}) {
  return (
    <FieldBlock data-field-error={error ? 'true' : undefined}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <Req> *</Req>}
      </Label>
      {children}
      {error && (
        <ErrorRow role="alert" id={errorId}>
          <ErrorDot aria-hidden="true">!</ErrorDot>
          {error}
        </ErrorRow>
      )}
    </FieldBlock>
  )
}

// 텍스트/숫자 입력. 접미사(명/원)와 숫자 전용 서식 지원.
export function TextInputField({
  label,
  required,
  error,
  value,
  onChange,
  placeholder,
  suffix,
  format,
  ariaLabel,
}: {
  label: string
  required?: boolean
  error?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suffix?: string
  format?: FieldFormat
  ariaLabel?: string
}) {
  const id = useId()
  const errorId = `${id}-error`
  const inputMode =
    format === 'phone' ? 'tel' : format ? 'numeric' : undefined
  return (
    <LabeledField
      label={label}
      required={required}
      error={error}
      htmlFor={id}
      errorId={error ? errorId : undefined}
    >
      <ControlBox $error={Boolean(error)}>
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          aria-label={ariaLabel ?? label}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) =>
            onChange(
              format
                ? formatters[format](event.target.value)
                : event.target.value,
            )
          }
        />
        {suffix && <Suffix>{suffix}</Suffix>}
      </ControlBox>
    </LabeledField>
  )
}

// 날짜 — 커스텀 캘린더 없이 아이콘 + 숫자 입력 시 yyyy.mm.dd 자동 서식.
export function DateField({
  label,
  required,
  error,
  value,
  onChange,
  placeholder = '연도. 월. 일',
}: {
  label: string
  required?: boolean
  error?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const id = useId()
  const errorId = `${id}-error`
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 바깥 클릭 시 달력을 닫는다.
  useEffect(() => {
    if (!open) return
    function onDocClick(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <LabeledField
      label={label}
      required={required}
      error={error}
      htmlFor={id}
      errorId={error ? errorId : undefined}
    >
      <DateWrap ref={wrapRef}>
        <ControlBox $error={Boolean(error)} $open={open}>
          {/* 포커스하면 달력 팝업. 직접 입력도 가능(yyyy.mm.dd 자동 서식). */}
          <Input
            id={id}
            value={value}
            placeholder={placeholder}
            inputMode="numeric"
            // 브라우저 자동완성 목록이 달력 위에 겹쳐 뜬다. 달력이 입력 수단이므로 끈다.
            autoComplete="off"
            aria-label={label}
            aria-describedby={error ? errorId : undefined}
            onFocus={() => setOpen(true)}
            onChange={(event) => onChange(formatDateInput(event.target.value))}
          />
          <IconImg src={calendarIcon} alt="" aria-hidden="true" />
        </ControlBox>
        {/* 날짜를 골라도 닫지 않는다 — 바깥 여백 클릭 시에만 닫힘. */}
        {open && <DateCalendar value={value} onSelect={onChange} />}
      </DateWrap>
    </LabeledField>
  )
}

const FieldBlock = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Req = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`

const ControlBox = styled.div<{ $error?: boolean; $open?: boolean }>`
  display: flex;
  height: 66px;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
  border: 1px solid
    ${({ theme, $error }) => ($error ? theme.colors.danger : 'transparent')};
  border-radius: ${({ $open }) => ($open ? '8px 8px 0 0' : '8px')};
  background: ${({ theme }) => theme.colors.background};
`

// 날짜 필드: 달력 팝업을 컨트롤 기준 absolute로 띄우기 위한 relative 래퍼.
const DateWrap = styled.div`
  position: relative;
`

const Input = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 22px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
  }
`

const Suffix = styled.span`
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 28px;
  font-weight: 500;
`

const IconImg = styled.img`
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
`

const ErrorRow = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
`

const ErrorDot = styled.span`
  display: inline-flex;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.danger};
  color: #fff;
  font-size: 13px;
  font-weight: 700;
`
