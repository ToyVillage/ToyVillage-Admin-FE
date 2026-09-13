import { useEffect, useRef, type ReactNode } from 'react'
import styled from '@emotion/styled'

export interface RowActionMenuItem {
  /** 항목 식별자 */
  key: string
  label: ReactNode
  /** 위험 동작(삭제 등)은 빨간 글자로 표시한다. */
  tone?: 'default' | 'danger'
  onSelect: () => void
}

interface RowActionMenuProps {
  /** 접근 가능한 이름. 어떤 행의 메뉴인지 포함한다. */
  triggerLabel: string
  items: RowActionMenuItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * `⋮` 버튼 노드를 목록에 알린다. 목록이 삭제 모달을 닫은 뒤
   * 초점을 이 버튼으로 되돌리기 위해 쓴다.
   */
  onTriggerRef?: (node: HTMLButtonElement | null) => void
}

// Figma `kebab menu`(126:9298). `⋮` 버튼과 드롭다운 메뉴를 함께 가진다.
// 열림 상태는 목록이 소유하므로(동시 하나만) open/onOpenChange 로 위임받는다.
export function RowActionMenu({
  triggerLabel,
  items,
  open,
  onOpenChange,
  onTriggerRef,
}: RowActionMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onOpenChange(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, onOpenChange])

  function setTriggerNode(node: HTMLButtonElement | null) {
    triggerRef.current = node
    onTriggerRef?.(node)
  }

  return (
    <Root ref={rootRef}>
      <Trigger
        ref={setTriggerNode}
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <DotsIcon viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </DotsIcon>
      </Trigger>

      {open && (
        <Menu role="menu" aria-label={triggerLabel}>
          {items.map((item) => (
            <MenuItem
              key={item.key}
              type="button"
              role="menuitem"
              $tone={item.tone ?? 'default'}
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
    </Root>
  )
}

const Root = styled.div`
  position: relative;
`

// Figma 케밥 버튼 44×52.
const Trigger = styled.button`
  display: flex;
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

const DotsIcon = styled.svg`
  width: 24px;
  height: 24px;
  fill: ${({ theme }) => theme.colors.textGuide};
`

// Figma 케밥 메뉴 180×116(`126:9174` 기준 @1386,520). 버튼(@1558,444 44×52) 하단에서 24px 아래,
// 우측 끝은 버튼 우측에서 36px 안쪽이라 `⋮` 를 가리지 않는다.
const Menu = styled.div`
  position: absolute;
  z-index: 2;
  top: calc(100% + 24px);
  right: 36px;
  display: flex;
  width: 180px;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
`

// 항목 pitch 52px(높이 44 + gap 8), 텍스트 좌측 padding 20px.
const MenuItem = styled.button<{ $tone: 'default' | 'danger' }>`
  display: flex;
  min-height: 44px;
  align-items: center;
  padding: 0 20px;
  border: 0;
  background: transparent;
  color: ${({ theme, $tone }) =>
    $tone === 'danger' ? theme.colors.danger : theme.colors.textStrong};
  font: inherit;
  font-size: 20px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
  }
`
