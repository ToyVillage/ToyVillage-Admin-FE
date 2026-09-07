import { Fragment, useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import chevronDown from './assets/chevron-down.svg'

export interface SelectMenuOption {
  value: string
  label: string
}

interface SelectMenuProps {
  value: string
  options: SelectMenuOption[]
  onChange: (value: string) => void
  ariaLabel: string
  // Figma 조회날짜의 년/월/일 박스 폭이 각각 달라 호출부가 지정한다.
  width: number
  // 열린 목록의 최대 높이. 넘치면 세로 스크롤된다(Figma 256).
  maxListHeight?: number
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
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

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
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
      >
        <TriggerLabel>{selected?.label ?? value}</TriggerLabel>
        <Chevron src={chevronDown} alt="" aria-hidden="true" $open={open} />
      </Trigger>
      {open && (
        <List role="listbox" aria-label={ariaLabel} $maxHeight={maxListHeight}>
          {options.map((option, index) => (
            <Fragment key={option.value}>
              {index > 0 && <Divider aria-hidden="true" />}
              <Option
                type="button"
                role="option"
                aria-selected={option.value === value}
                $selected={option.value === value}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
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

const Trigger = styled.button<{ $open: boolean }>`
  display: flex;
  width: 100%;
  height: 70px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border: 0;
  border-radius: ${({ $open }) => ($open ? '12px 12px 0 0' : '12px')};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  cursor: pointer;
  font: inherit;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const TriggerLabel = styled.span`
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
`

const Chevron = styled.img<{ $open: boolean }>`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  transform: rotate(${({ $open }) => ($open ? '0deg' : '180deg')});
`

const List = styled.div<{ $maxHeight: number }>`
  position: absolute;
  z-index: 2;
  top: 70px;
  left: 0;
  display: flex;
  width: 100%;
  max-height: ${({ $maxHeight }) => $maxHeight}px;
  flex-direction: column;
  padding: 20px 0;
  border-radius: 0 0 12px 12px;
  background: ${({ theme }) => theme.colors.surface};
  overflow-y: auto;
  scrollbar-color: ${({ theme }) => theme.colors.textFaint} transparent;
  scrollbar-width: thin;
`

const Divider = styled.span`
  height: 1px;
  margin: 0 13px;
  background: ${({ theme }) => theme.colors.tableHeaderStrong};
`

const Option = styled.button<{ $selected: boolean }>`
  display: flex;
  min-height: 72px;
  align-items: center;
  padding: 0 20px;
  border: 0;
  background: transparent;
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.textStrong : theme.colors.optionMuted};
  cursor: pointer;
  font: inherit;
  font-size: 24px;
  font-weight: 500;
  text-align: left;

  &:hover,
  &:focus-visible {
    outline: 0;
    background: ${({ theme }) => theme.colors.background};
  }
`
