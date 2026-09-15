import { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import kebabIcon from './assets/kebab.svg'

export interface KebabMenuItem {
  label: string
  onSelect: () => void
  // danger = Figma 의 빨간 `삭제` 항목.
  tone?: 'default' | 'danger'
}

/**
 * `container-top` — 가장 가까운 positioned 조상(표의 행)의 오른쪽 위 모서리에 붙는다(업무일지 표).
 * `below-trigger` — 트리거 하단 8px 아래, 가장 가까운 positioned 조상의 오른쪽 끝에 맞춘다(개체관리 케밥).
 */
export type KebabMenuPlacement = 'container-top' | 'below-trigger'

interface KebabMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: KebabMenuItem[]
  ariaLabel: string
  placement?: KebabMenuPlacement
  /**
   * `⋮` 버튼 노드를 호출부에 알린다. 삭제 모달이 닫힌 뒤
   * 초점을 이 버튼으로 되돌리기 위해 쓴다.
   */
  onTriggerRef?: (node: HTMLButtonElement | null) => void
}

// Figma component set `141:9597`(kebab menu) 대응. 열림 여부는 목록이 소유해
// 한 번에 한 행만 열리도록 호출부가 제어한다.
export function KebabMenu({
  open,
  onOpenChange,
  items,
  ariaLabel,
  placement = 'container-top',
  onTriggerRef,
}: KebabMenuProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) onOpenChange(false)
    }

    // 초점이 래퍼 밖에 있을 때의 Escape. 래퍼 안의 Escape 는 handleKeyDown 이 받는다
    // (래퍼가 keydown 전파를 막아 document 까지 오지 않는다).
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

  // 행 이동(Enter/Space)을 막으려고 keydown 전파를 멈추므로 Escape 는 여기서 직접 닫는다.
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation()
    if (!open || event.key !== 'Escape') return
    event.preventDefault()
    onOpenChange(false)
    triggerRef.current?.focus()
  }

  const menu = open && (
    <Menu role="menu" aria-label={ariaLabel} data-placement={placement}>
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
  )

  return (
    <Wrap
      ref={wrapRef}
      data-placement={placement}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={handleKeyDown}
    >
      <Trigger
        ref={setTriggerNode}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => onOpenChange(!open)}
      >
        <TriggerIcon src={kebabIcon} alt="" aria-hidden="true" />
      </Trigger>
      {placement === 'below-trigger' ? <MenuAnchor>{menu}</MenuAnchor> : menu}
    </Wrap>
  )
}

// 트리거는 자기 크기만 차지한다. 열 안에서의 가로 위치는 호출부(표의 열 정렬)가 정한다.
// Menu 는 이 래퍼가 아니라 position: relative 인 조상(표의 행·카드)을 기준으로 배치되므로
// 여기서는 stacking/positioning 문맥을 만들지 않는다.
const Wrap = styled.div`
  display: inline-flex;
  align-items: center;

  &[data-placement='below-trigger'] {
    flex-direction: column;
    align-items: stretch;
  }
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

// 트리거 바로 아래의 높이 0 블록. `below-trigger` 메뉴는 top 을 비워 두어
// 세로 위치를 이 블록(= 트리거 하단)에서 잡고, 가로는 positioned 조상의 오른쪽 끝에 맞춘다.
const MenuAnchor = styled.div`
  height: 0;
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

  &[data-placement='below-trigger'] {
    top: auto;
    margin-top: 8px;
  }
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

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }

  /* 키보드 초점은 색만이 아니라 outline 으로 보인다. 메뉴 밖으로 잘리지 않게 안쪽에 그린다. */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
    background: ${({ theme }) => theme.colors.background};
  }
`
