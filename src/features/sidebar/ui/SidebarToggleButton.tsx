import { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { useSidebarStore } from '../model/useSidebarStore'

export function SidebarToggleButton() {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(false)
  const isOpen = useSidebarStore((state) => state.isOpen)
  const open = useSidebarStore((state) => state.open)

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      buttonRef.current?.focus()
    }

    wasOpenRef.current = isOpen
  }, [isOpen])

  return (
    <Button
      ref={buttonRef}
      type="button"
      aria-label="사이드바 열기"
      aria-expanded={isOpen}
      onClick={open}
    >
      <Line />
      <Line />
      <Line />
    </Button>
  )
}

const Button = styled.button`
  position: fixed;
  top: 32px;
  left: 36px;
  z-index: 19;
  display: inline-flex;
  width: 36px;
  height: 36px;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`

const Line = styled.span`
  display: block;
  width: 100%;
  height: 4px;
  border-radius: 4px;
  background: currentColor;
`
