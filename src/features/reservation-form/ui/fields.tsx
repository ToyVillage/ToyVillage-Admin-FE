import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import styled from '@emotion/styled'
import calendarIcon from '@/shared/ui/assets/calendar.svg'
import chevronDown from '@/shared/ui/assets/chevron-down.svg'
import { DateCalendar } from './DateCalendar'
import {
  formatDateInput,
  formatDigits,
  formatMoney,
  formatPhone,
} from '../model/format'
import type { AmPm } from '../model/types'

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

// 시간(HH·MM 두 칸 + 가운데 콜론) + am/pm 커스텀 드롭다운.
export function TimeAmPmField({
  label,
  required,
  error,
  time,
  ampm,
  onTimeChange,
  onAmPmChange,
}: {
  label: string
  required?: boolean
  error?: string
  time: string
  ampm: AmPm
  onTimeChange: (value: string) => void
  onAmPmChange: (value: AmPm) => void
}) {
  const id = useId()
  const errorId = `${id}-error`
  const [open, setOpen] = useState(false)
  const ampmRef = useRef<HTMLDivElement>(null)
  const hhRef = useRef<HTMLInputElement>(null)
  const mmRef = useRef<HTMLInputElement>(null)

  // time = 원시 자릿수(최대 4). 왼쪽부터 채운다: "1"→시 10, "12"→12, "123"→분 30 ...
  // 빈 값도 "00 : 00"으로 항상 표시하고(회색), 캐럿을 다음 입력 자리로 보낸다.
  const padded = time.padEnd(4, '0')
  const hh = padded.slice(0, 2)
  const mm = padded.slice(2, 4)
  const muted = time.length === 0

  function handleTimeKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault()
      if (time.length < 4) onTimeChange(time + event.key)
    } else if (event.key === 'Backspace') {
      event.preventDefault()
      onTimeChange(time.slice(0, -1))
    }
  }

  // 입력 자릿수에 따라 "다음에 입력될 칸"으로 포커스+캐럿을 보낸다(시 2자리 → 분).
  function focusActiveSlot() {
    const inHour = time.length < 2
    const el = inHour ? hhRef.current : mmRef.current
    if (!el) return
    el.focus()
    const pos = inHour ? time.length : Math.min(time.length - 2, 2)
    el.setSelectionRange(pos, pos)
  }
  useEffect(() => {
    const active = document.activeElement
    if (active !== hhRef.current && active !== mmRef.current) return
    focusActiveSlot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time])

  // 드롭다운은 AmPmWrap 기준 absolute 라 스크롤 시 버튼과 함께 네이티브로 움직인다(지연 없음).
  useEffect(() => {
    if (!open) return
    function onDocClick(event: MouseEvent) {
      if (!ampmRef.current?.contains(event.target as Node)) setOpen(false)
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
      <TimeRow>
        {/* 박스 어디를 클릭해도(여백·콜론 포함) 활성 칸으로 포커스된다. */}
        <TimeBox
          $error={Boolean(error)}
          onMouseDown={(event) => {
            event.preventDefault()
            focusActiveSlot()
          }}
        >
          <TimePart
            id={id}
            ref={hhRef}
            $muted={muted}
            value={hh}
            inputMode="numeric"
            maxLength={2}
            aria-label={`${label} 시`}
            aria-describedby={error ? errorId : undefined}
            onKeyDown={handleTimeKey}
            onChange={() => {}}
            onFocus={focusActiveSlot}
          />
          <Colon aria-hidden="true" $muted={muted}>
            :
          </Colon>
          <TimePart
            ref={mmRef}
            $muted={muted}
            value={mm}
            inputMode="numeric"
            maxLength={2}
            aria-label={`${label} 분`}
            aria-describedby={error ? errorId : undefined}
            onKeyDown={handleTimeKey}
            onChange={() => {}}
            onFocus={focusActiveSlot}
          />
        </TimeBox>
        <AmPmWrap ref={ampmRef}>
          <AmPmButton
            type="button"
            $open={open}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={`${label} 오전/오후`}
            onClick={() => setOpen((prev) => !prev)}
          >
            {ampm}
            <AmPmChevron src={chevronDown} alt="" aria-hidden="true" $open={open} />
          </AmPmButton>
          {open && (
            <AmPmList role="listbox">
              {(['am', 'pm'] as AmPm[]).map((option, index) => (
                <Fragment key={option}>
                  {index > 0 && <AmPmDivider aria-hidden="true" />}
                  <AmPmOption
                    type="button"
                    role="option"
                    aria-selected={ampm === option}
                    $selected={ampm === option}
                    onMouseDown={(event) => {
                      // mousedown 로 처리해 바깥 클릭 닫힘보다 먼저 선택되게 한다.
                      event.preventDefault()
                      onAmPmChange(option)
                      setOpen(false)
                    }}
                  >
                    {option}
                  </AmPmOption>
                </Fragment>
              ))}
            </AmPmList>
          )}
        </AmPmWrap>
      </TimeRow>
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

const TimeRow = styled.div`
  display: flex;
  gap: 8px;
`

// Figma: 시·분 텍스트가 박스 정중앙(세로/가로), 28px. 가운데 콜론.
const TimeBox = styled.div<{ $error?: boolean }>`
  display: flex;
  box-sizing: border-box;
  width: 284px;
  height: 66px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 24px;
  border: 1px solid
    ${({ theme, $error }) => ($error ? theme.colors.danger : 'transparent')};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
`

const TimePart = styled.input<{ $muted: boolean }>`
  width: 52px;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme, $muted }) =>
    $muted ? theme.colors.textGuide : theme.colors.textStrong};
  font: inherit;
  font-size: 28px;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  cursor: text;
`

// 일반 콜론 텍스트.
const Colon = styled.span<{ $muted: boolean }>`
  flex: 0 0 auto;
  color: ${({ theme, $muted }) =>
    $muted ? theme.colors.textGuide : theme.colors.textStrong};
  font: inherit;
  font-size: 28px;
  font-weight: 500;
  line-height: 1;
`

const AmPmWrap = styled.div`
  position: relative;
  flex: 0 0 100px;
`

// Figma: 값+chevron 정중앙. 열리면 1px #5C5C68 테두리 + 상단만 라운드.
const AmPmButton = styled.button<{ $open: boolean }>`
  display: flex;
  box-sizing: border-box;
  width: 100px;
  height: 66px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 24px;
  border: 1px solid ${({ $open }) => ($open ? '#5C5C68' : 'transparent')};
  border-radius: ${({ $open }) => ($open ? '8px 8px 0 0' : '8px')};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const AmPmChevron = styled.img<{ $open: boolean }>`
  width: 24px;
  height: 24px;
  transform: rotate(${({ $open }) => ($open ? '0deg' : '180deg')});
`

// Figma 4899:7670 기준: padding 24/17, gap 20, 옵션 텍스트는 왼쪽 정렬(선택=blue), 사이 구분선.
const AmPmList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: 20px;
  padding: 24px 17px;
  border-radius: 0 0 8px 8px;
  background: ${({ theme }) => theme.colors.background};
`

const AmPmOption = styled.button<{ $selected: boolean }>`
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.accent : theme.colors.textStrong};
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  text-align: left;
`

const AmPmDivider = styled.span`
  align-self: center;
  width: 80px;
  height: 1px;
  background: #dddde3;
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
