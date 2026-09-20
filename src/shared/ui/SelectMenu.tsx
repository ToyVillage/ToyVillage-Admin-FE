import { Fragment, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { dropIn, motionDuration, motionEasing } from './motion'
import chevronDown from './assets/chevron-down.svg'

export interface SelectMenuOption {
  value: string
  label: string
  // 24x24 선행 아이콘. 업무일지 양식의 질문 유형 목록(Figma 1:3803 등)에서 쓴다.
  icon?: string
}

// `surface` = 흰 박스 + 24px (조회날짜 필터, Figma Frame 459)
// `field`   = gray/10 박스 + 22px (업무일지 양식의 질문 유형·구역 접두, Figma 1:4447 / 1:5448)
type SelectMenuVariant = 'surface' | 'field'

interface SelectMenuProps {
  value: string
  options: SelectMenuOption[]
  onChange: (value: string) => void
  ariaLabel: string
  // Figma 조회날짜의 년/월/일 박스 폭이 각각 달라 호출부가 지정한다.
  width: number
  // 열린 목록의 최대 높이. 넘치면 세로 스크롤된다(Figma 256).
  maxListHeight?: number
  variant?: SelectMenuVariant
  // 트리거 높이. Figma 기준 surface 70 / 질문 유형 64 / 구역 접두 66.
  height?: number
  optionAlign?: 'start' | 'center'
  // 트리거 라벨 뒤에 빨간 `*` 를 붙인다(Figma `객관식 질문 *`).
  requiredMark?: boolean
  // 열렸을 때 트리거에 테두리를 준다(Figma 1:5448).
  openBorder?: boolean
  // `value` 와 맞는 항목이 없을 때 트리거에 보일 문구(Figma 질문 유형의 `선택`).
  placeholder?: string
}

// Figma `Frame 459`(닫힘) + `Frame 427`(열림) 규격의 범용 셀렉트.
// 흰 박스 + chevron 트리거를 누르면 바로 아래에 항목 목록이 붙어 열린다.
export function SelectMenu({
  value,
  options,
  onChange,
  ariaLabel,
  width,
  maxListHeight = 256,
  variant = 'surface',
  height = 70,
  optionAlign = 'start',
  requiredMark = false,
  openBorder = false,
  placeholder,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const selected = options.find((option) => option.value === value)

  // 목록을 펼치면 선택된 항목이 가운데 오도록 스크롤한다.
  // 페이지가 함께 움직이지 않도록 scrollIntoView 대신 목록의 scrollTop 을 직접 둔다.
  useEffect(() => {
    if (!open) return

    const list = listRef.current
    const option = selectedRef.current
    if (!list || !option) return

    list.scrollTop =
      option.offsetTop - (list.clientHeight - option.clientHeight) / 2
  }, [open])

  useEffect(() => {
    if (!open) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <Wrap ref={wrapRef} $width={width}>
      <Trigger
        type="button"
        $open={open}
        $variant={variant}
        $height={height}
        $openBorder={openBorder}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
      >
        <TriggerContent>
          {selected?.icon && (
            <OptionIcon src={selected.icon} alt="" aria-hidden="true" />
          )}
          <TriggerLabel $variant={variant}>
            {selected?.label ?? placeholder ?? value}
            {requiredMark && selected && (
              <Required aria-hidden="true"> *</Required>
            )}
          </TriggerLabel>
        </TriggerContent>
        <Chevron src={chevronDown} alt="" aria-hidden="true" $open={open} />
      </Trigger>
      {open && (
        <List
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          $maxHeight={maxListHeight}
          $openBorder={openBorder}
          $variant={variant}
          $top={height}
        >
          {options.map((option, index) => (
            <Fragment key={option.value}>
              {index > 0 && <Divider aria-hidden="true" />}
              <Option
                ref={option.value === value ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={option.value === value}
                $selected={option.value === value}
                $variant={variant}
                $align={optionAlign}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                {option.icon && (
                  <OptionIcon src={option.icon} alt="" aria-hidden="true" />
                )}
                {option.label}
              </Option>
            </Fragment>
          ))}
        </List>
      )}
    </Wrap>
  )
}

const Wrap = styled.div<{ $width: number }>`
  position: relative;
  width: ${({ $width }) => $width}px;
  flex: 0 0 ${({ $width }) => $width}px;
`

const Trigger = styled.button<{
  $open: boolean
  $variant: SelectMenuVariant
  $height: number
  $openBorder: boolean
}>`
  display: flex;
  width: 100%;
  height: ${({ $height }) => $height}px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: ${({ $variant }) => ($variant === 'field' ? '12px 20px' : '20px')};
  border: ${({ $open, $openBorder, theme }) =>
    $open && $openBorder ? `1px solid ${theme.colors.selectOpenBorder}` : '0'};
  border-radius: ${({ $open, $variant }) => {
    const radius = $variant === 'field' ? 8 : 12
    return $open ? `${radius}px ${radius}px 0 0` : `${radius}px`
  }};
  background: ${({ theme, $variant }) =>
    $variant === 'field' ? theme.colors.background : theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  cursor: pointer;
  font: inherit;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const TriggerContent = styled.span`
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
`

const TriggerLabel = styled.span<{ $variant: SelectMenuVariant }>`
  font-size: ${({ $variant }) => ($variant === 'field' ? 22 : 24)}px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`

const Required = styled.span`
  color: ${({ theme }) => theme.colors.danger};
`

const Chevron = styled.img<{ $open: boolean }>`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  transform: rotate(${({ $open }) => ($open ? '0deg' : '180deg')});
  transition: transform ${motionDuration.reveal}ms ${motionEasing.enter};
`

const List = styled.div<{
  $maxHeight: number
  $variant: SelectMenuVariant
  $top: number
  $openBorder: boolean
}>`
  position: absolute;
  z-index: 2;
  top: ${({ $top }) => $top}px;
  left: 0;
  display: flex;
  width: 100%;
  max-height: ${({ $maxHeight }) => $maxHeight}px;
  flex-direction: column;
  padding: 20px 0;
  border: ${({ $openBorder, theme }) =>
    $openBorder ? `1px solid ${theme.colors.selectOpenBorder}` : '0'};
  border-top: 0;
  border-radius: ${({ $variant }) =>
    $variant === 'field' ? '0 0 8px 8px' : '0 0 12px 12px'};
  background: ${({ theme, $variant }) =>
    $variant === 'field' ? theme.colors.background : theme.colors.surface};
  box-shadow: ${({ $variant }) =>
    $variant === 'field' ? '0 0 8px 1px rgba(100, 100, 100, 0.25)' : 'none'};
  overflow-y: auto;
  scrollbar-color: ${({ theme }) => theme.colors.textFaint} transparent;
  scrollbar-width: thin;
  animation: ${dropIn} ${motionDuration.reveal}ms ${motionEasing.enter} both;
`

const Divider = styled.span`
  height: 1px;
  margin: 0 13px;
  background: ${({ theme }) => theme.colors.tableHeaderStrong};
`

const Option = styled.button<{
  $selected: boolean
  $variant: SelectMenuVariant
  $align: 'start' | 'center'
}>`
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: ${({ $align }) =>
    $align === 'center' ? 'center' : 'flex-start'};
  gap: 12px;
  padding: 0 20px;
  border: 0;
  background: transparent;
  color: ${({ theme, $selected, $variant }) => {
    if ($variant === 'field') {
      return $selected ? theme.colors.accent : theme.colors.text
    }
    return $selected ? theme.colors.textStrong : theme.colors.optionMuted
  }};
  cursor: pointer;
  font: inherit;
  font-size: ${({ $variant }) => ($variant === 'field' ? 22 : 24)}px;
  font-weight: 500;
  text-align: left;
  transition: background ${motionDuration.color}ms ${motionEasing.enter};

  &:hover,
  &:focus-visible {
    outline: 0;
    background: ${({ theme, $variant }) =>
      $variant === 'field' ? theme.colors.surface : theme.colors.background};
  }
`

const OptionIcon = styled.img`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`
