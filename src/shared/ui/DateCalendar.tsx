import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import styled from '@emotion/styled'
import chevronIcon from './assets/chevron-left.svg'

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

// 모션 최소화를 켠 사용자에게는 애니메이션 없이 바로 이동한다.
function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'
}

interface Cell {
  y: number
  m: number
  d: number
  current: boolean
}

type DateCalendarVariant = 'attached' | 'popover'

interface DateCalendarProps {
  value: string
  onSelect: (value: string) => void
  /** "yyyy.mm.dd". 이보다 앞선 날짜는 고를 수 없다. */
  minDate?: string
  /**
   * `attached` 는 입력 바로 아래 붙는 패널(단체예약 폼),
   * `popover` 는 입력 아래 띄우는 카드(Figma `date picker` 1:11295, 엑셀 다운로드)다.
   */
  variant?: DateCalendarVariant
  /** dialog 접근 가능한 이름. */
  label?: string
  /** Esc 를 누르면 호출한다. */
  onClose?: () => void
}

export function DateCalendar({
  value,
  onSelect,
  minDate,
  variant = 'attached',
  label = '날짜 선택',
  onClose,
}: DateCalendarProps) {
  const panelRef = useRef<HTMLDivElement>(null)
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

  // popover 가 닫히면 열기 전 스크롤 위치로 부드럽게 돌아간다.
  // 달력이 빠지면 문서가 짧아져 브라우저가 스크롤을 한 번에 끌어올리므로,
  // 돌아가는 동안만 문서 높이를 열려 있던 때로 붙잡아 둔다.
  // layout effect 의 정리는 달력이 DOM 에서 빠지기 전에 실행돼 지금 높이를 잴 수 있다.
  useLayoutEffect(() => {
    if (variant !== 'popover') return
    const root = document.documentElement
    const openedAt = window.scrollY
    return () => {
      // 사용자가 직접 더 위로 올렸으면 건드리지 않는다. 같은 위치여도 다시 호출해
      // 아직 진행 중인 열기 스크롤(아래로)이 닫힌 뒤에 이어지지 않게 멈춘다.
      if (window.scrollY < openedAt) return
      root.style.minHeight = `${root.scrollHeight}px`
      // 목표 위치에 도착해야 높이를 놓는다. 그 전에 놓으면 남은 거리를 한 번에 뛴다.
      // 사용자가 중간에 스크롤을 가로채 도착하지 않는 경우를 위해 시간 제한도 둔다.
      const timer = window.setTimeout(release, 3000)
      function release() {
        root.style.minHeight = ''
        window.removeEventListener('scroll', handleScroll)
        window.clearTimeout(timer)
      }
      function handleScroll() {
        if (window.scrollY <= openedAt + 1) release()
      }
      window.addEventListener('scroll', handleScroll, { passive: true })
      window.scrollTo({ top: openedAt, behavior: scrollBehavior() })
      if (window.scrollY <= openedAt + 1) release()
    }
  }, [variant])

  // popover 는 입력 아래로 길게 떠서 화면 밖으로 잘리기 쉽다. 열릴 때와 주(week) 수가 바뀔 때
  // 달력 전체가 보이도록 모자란 만큼만 스크롤한다(이미 다 보이면 움직이지 않음).
  useEffect(() => {
    if (variant !== 'popover') return
    panelRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: scrollBehavior(),
    })
  }, [variant, cells.length])

  function move(delta: number) {
    setView((v) => {
      const idx = v.y * 12 + (v.m - 1) + delta
      return { y: Math.floor(idx / 12), m: (idx % 12) + 1 }
    })
  }

  function select(c: Cell) {
    if (!c.current) setView({ y: c.y, m: c.m })
    onSelect(toYmd(c.y, c.m, c.d))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape' || !onClose) return
    event.stopPropagation()
    onClose()
  }

  const isToday = (c: Cell) =>
    today.getFullYear() === c.y &&
    today.getMonth() + 1 === c.m &&
    today.getDate() === c.d
  const isSelected = (c: Cell) =>
    Boolean(selected && selected.y === c.y && selected.m === c.m && selected.d === c.d)
  // "yyyy.mm.dd" 는 자릿수가 고정이라 문자열 비교로 날짜 순서를 비교할 수 있다.
  const isBeforeMin = (c: Cell) =>
    Boolean(minDate && toYmd(c.y, c.m, c.d) < minDate)

  return (
    <Panel
      ref={panelRef}
      role="dialog"
      aria-label={label}
      data-variant={variant}
      onKeyDown={handleKeyDown}
    >
      <Header>
        <NavButton
          type="button"
          aria-label="이전 달"
          onMouseDown={(event) => {
            event.preventDefault()
            move(-1)
          }}
          // 키보드(Enter·Space)로 누른 click 만 받는다. 마우스는 위 mousedown 이 처리한다.
          onClick={(event) => {
            if (event.detail === 0) move(-1)
          }}
        >
          {variant === 'popover' ? (
            <NavIcon src={chevronIcon} alt="" aria-hidden="true" />
          ) : (
            '‹'
          )}
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
          onClick={(event) => {
            if (event.detail === 0) move(1)
          }}
        >
          {variant === 'popover' ? (
            <NavIcon src={chevronIcon} alt="" aria-hidden="true" $next />
          ) : (
            '›'
          )}
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
            aria-label={`${c.y}년 ${c.m}월 ${c.d}일`}
            aria-pressed={isSelected(c)}
            disabled={isBeforeMin(c)}
            $current={c.current}
            // mousedown 로 처리해 input blur보다 먼저 선택되게 한다.
            // 단체예약 폼은 선택해도 닫지 않는다(바깥 클릭 시에만 닫힘).
            onMouseDown={(event) => {
              event.preventDefault()
              select(c)
            }}
            onClick={(event) => {
              if (event.detail === 0) select(c)
            }}
          >
            <Num $selected={isSelected(c)}>{c.d}</Num>
            {variant === 'attached' && isToday(c) && !isSelected(c) && (
              <TodayDot aria-hidden="true" />
            )}
          </Day>
        ))}
      </Grid>
    </Panel>
  )
}

// attached: 필드와 같은 회색 배경으로 바로 아래에 붙어 하나의 패널처럼 보인다.
// popover: Figma `date picker popover`(2995:25577) — 입력 아래 8px, 392px 카드.
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

  &[data-variant='popover'] {
    top: calc(100% + 8px);
    width: 392px;
    max-width: calc(100vw - 32px);
    min-width: 0;
    gap: 0;
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;

  [data-variant='popover'] & {
    margin-bottom: 26px;
    padding: 0;
  }
`

const Title = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;

  [data-variant='popover'] & {
    font-weight: 500;
  }
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

  [data-variant='popover'] & {
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 8px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const NavIcon = styled.img<{ $next?: boolean }>`
  width: 36px;
  height: 36px;
  transform: ${({ $next }) => ($next ? 'rotate(180deg)' : 'none')};
`

const WeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);

  [data-variant='popover'] & {
    height: 44px;
  }
`

const Weekday = styled.span`
  padding: 4px 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 18px;
  font-weight: 500;
  text-align: center;

  [data-variant='popover'] & {
    padding: 6px 0;
    color: ${({ theme }) => theme.colors.optionMuted};
    font-weight: 600;
    line-height: 1.2;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 8px;

  [data-variant='popover'] & {
    row-gap: 0;
  }
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

  &:disabled {
    color: ${({ theme }) => theme.colors.textFaint};
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
    border-radius: 4px;
  }

  [data-variant='popover'] & {
    height: 72px;
    min-height: 0;
    justify-content: flex-start;
    padding: 6px 0;
    color: ${({ theme, $current }) =>
      $current ? theme.colors.textStrong : theme.colors.textFaint};
  }

  [data-variant='popover'] &:disabled {
    color: ${({ theme }) => theme.colors.textFaint};
  }
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

  [data-variant='popover'] & {
    width: 24px;
    height: 24px;
    font-size: 18px;
    font-weight: 600;
  }
`

const TodayDot = styled.span`
  position: absolute;
  bottom: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.danger};
`
