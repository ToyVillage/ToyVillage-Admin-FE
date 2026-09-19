import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import styled from '@emotion/styled'
import { appendClockDigit } from '../model/format'

interface TimeSegmentProps {
  /** 스크린리더용 접두사(예: `방문 시간을 선택해주세요 입장시간`). */
  ariaPrefix: string
  /** 24시간제 원시 자릿수(최대 4). 빈 값이면 `00 : 00`을 흐리게 보인다. */
  time: string
  onTimeChange: (value: string) => void
  inputId?: string
  errorId?: string
}

// Figma 2098:17385 의 시각 한 칸. 24시간제(00:00~23:59)를 직접 입력한다:
// 숫자는 왼쪽부터 채우고 Backspace 로 지운다. 드롭다운도 오전/오후도 없다.
// 화면에 보이는 값이 곧 입력값이다 — `1` 만 눌러 `10 : 00` 이 보이면 10시 00분으로 제출된다.
export function TimeSegment({
  ariaPrefix,
  time,
  onTimeChange,
  inputId,
  errorId,
}: TimeSegmentProps) {
  const hourRef = useRef<HTMLInputElement>(null)
  const minuteRef = useRef<HTMLInputElement>(null)

  // time = 원시 자릿수. "1"→10시, "18"→18시, "183"→18시 30분 ...
  const padded = time.padEnd(4, '0')
  const hour = padded.slice(0, 2)
  const minute = padded.slice(2, 4)
  const muted = time.length === 0

  // 입력한 자릿수에 따라 "다음에 채워질 칸"으로 포커스와 캐럿을 보낸다.
  function focusActiveSlot() {
    const inHour = time.length < 2
    const element = inHour ? hourRef.current : minuteRef.current
    if (!element) return
    element.focus()
    const caret = inHour ? time.length : Math.min(time.length - 2, 2)
    element.setSelectionRange(caret, caret)
  }

  useEffect(() => {
    const active = document.activeElement
    if (active !== hourRef.current && active !== minuteRef.current) return
    focusActiveSlot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time])

  // 키 입력 외의 경로(붙여넣기·드래그&드롭·음성 입력·Delete 로 비우기)도 값에 반영한다.
  // 숫자 키 입력은 keydown 에서 막으므로 여기로 오지 않는다.
  function handleChange(part: 'hour' | 'minute', raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 2).padStart(2, '0')
    const next =
      part === 'hour' ? digits + padded.slice(2, 4) : padded.slice(0, 2) + digits

    // 범위를 벗어난 값(24시·60분)은 반영하지 않는다.
    if (Number(next.slice(0, 2)) > 23 || Number(next.slice(2, 4)) > 59) return

    onTimeChange(next)
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault()
      onTimeChange(appendClockDigit(time, event.key))
      return
    }
    if (event.key === 'Backspace') {
      event.preventDefault()
      onTimeChange(time.slice(0, -1))
    }
  }

  return (
    <Segment
      onMouseDown={(event) => {
        // 여백·콜론을 눌러도 지금 입력할 칸으로 캐럿이 간다.
        if (
          event.target === hourRef.current ||
          event.target === minuteRef.current
        ) {
          return
        }
        event.preventDefault()
        focusActiveSlot()
      }}
    >
      <Part
        id={inputId}
        ref={hourRef}
        $muted={muted}
        value={hour}
        inputMode="numeric"
        maxLength={2}
        autoComplete="off"
        aria-label={`${ariaPrefix} 시`}
        aria-describedby={errorId}
        onKeyDown={handleKeyDown}
        onChange={(event) => handleChange('hour', event.target.value)}
        onFocus={focusActiveSlot}
      />
      <Colon aria-hidden="true" $muted={muted}>
        :
      </Colon>
      <Part
        ref={minuteRef}
        $muted={muted}
        value={minute}
        inputMode="numeric"
        maxLength={2}
        autoComplete="off"
        aria-label={`${ariaPrefix} 분`}
        aria-describedby={errorId}
        onKeyDown={handleKeyDown}
        onChange={(event) => handleChange('minute', event.target.value)}
        onFocus={focusActiveSlot}
      />
    </Segment>
  )
}

// Figma: 120x40 칸 안에 시각 한 줄(22px Medium).
const Segment = styled.div`
  display: flex;
  width: 120px;
  height: 40px;
  flex: 0 0 120px;
  align-items: center;
  justify-content: center;
  gap: 4px;
`

const Part = styled.input<{ $muted: boolean }>`
  width: 32px;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme, $muted }) =>
    $muted ? theme.colors.textGuide : theme.colors.textStrong};
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  cursor: text;
`

const Colon = styled.span<{ $muted: boolean }>`
  flex: 0 0 auto;
  color: ${({ theme, $muted }) =>
    $muted ? theme.colors.textGuide : theme.colors.textStrong};
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1;
`
