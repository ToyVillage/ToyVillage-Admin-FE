import { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import kebabIcon from './assets/kebab.svg'

export interface KebabMenuItem {
  label: string
  onSelect: () => void
  // danger = Figma 의 빨간 `삭제` 항목.
  tone?: 'default' | 'danger'
}

interface KebabMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: KebabMenuItem[]
  ariaLabel: string
}

// Figma component set `141:9597`(kebab menu) 대응. 열림 여부는 목록이 소유해
// 한 번에 한 행만 열리도록 호출부가 제어한다.
export function KebabMenu({
  open,
  onOpenChange,
  items,
  ariaLabel,
}: KebabMenuProps) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) onOpenChange(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, onOpenChange])

  return (
    <Wrap
      ref={wrapRef}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Trigger
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => onOpenChange(!open)}
      >
        <TriggerIcon src={kebabIcon} alt="" aria-hidden="true" />
      </Trigger>
      {open && (
        <Menu role="menu" aria-label={ariaLabel}>
          {items.map((item) => (
            <MenuItem
              key={item.label}
              type="button"
              role="menuitem"
              $danger={item.tone === 'danger'}
              onClick={() => {
                onOpenChange(false)
                item.onSelect()
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Wrap>
  )
}

// 트리거는 자기 크기만 차지한다. 열 안에서의 가로 위치는 호출부(표의 열 정렬)가 정한다.
// Menu 는 이 래퍼가 아니라 position: relative 인 조상(표의 행)을 기준으로 배치되므로
// 여기서는 stacking/positioning 문맥을 만들지 않는다.
const Wrap = styled.div`
  display: inline-flex;
  align-items: center;
`

const Trigger = styled.button`
  display: inline-flex;
  width: 44px;
  height: 52px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
    border-radius: 4px;
  }
`

const TriggerIcon = styled.img`
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
`

// Figma 배치: 메뉴는 케밥이 속한 행의 오른쪽 위 모서리에 붙는다.
// 기준은 가장 가까운 positioned 조상 — 표에서는 `position: relative` 인 행이다.
const Menu = styled.div`
  position: absolute;
  z-index: 2;
  top: 0;
  right: 0;
  display: flex;
  width: 180px;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
`

const MenuItem = styled.button<{ $danger: boolean }>`
  display: flex;
  height: 48px;
  align-items: center;
  padding: 12px 20px;
  border: 0;
  background: transparent;
  color: ${({ theme, $danger }) =>
    $danger ? theme.colors.danger : theme.colors.textStrong};
  cursor: pointer;
  font: inherit;
  font-size: 20px;
  font-weight: 500;
  text-align: left;

  &:hover,
  &:focus-visible {
    outline: 0;
    background: ${({ theme }) => theme.colors.background};
  }
`
