import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'

interface ErrorDialogProps {
  title: string
  onConfirm: () => void
}

// 예외(에러) 알림 모달. 저장·삭제·생성 실패 등 예외 발생 시 사용한다.
// Figma 기준 한 줄 제목 + 전체 너비 `확인` 버튼 구성으로, ValidationDialog 와 동일한 시각 언어다.
export function ErrorDialog({ title, onConfirm }: ErrorDialogProps) {
  const titleId = useId()
  const confirmRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const appRoot = document.getElementById('root')
    previousFocusRef.current = document.activeElement as HTMLElement | null
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')
    confirmRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onConfirm()
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        confirmRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      appRoot?.removeAttribute('inert')
      appRoot?.removeAttribute('aria-hidden')

      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus()
      }
    }
  }, [onConfirm])

  return createPortal(
    <Overlay>
      <Dialog role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <Message id={titleId}>{title}</Message>
        <ConfirmButton ref={confirmRef} type="button" onClick={onConfirm}>
          확인
        </ConfirmButton>
      </Dialog>
    </Overlay>,
    document.body,
  )
}

const Overlay = styled.div`
  position: fixed;
  z-index: 21;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.5);
`

const Dialog = styled.div`
  display: flex;
  width: min(calc(100% - 40px * 2), 560px);
  min-height: 320px;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 20px 20px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Message = styled.p`
  margin: 53px 0 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
`

const ConfirmButton = styled.button`
  width: 100%;
  min-height: 78px;
  border: 0;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font: inherit;
  font-size: 28px;
  font-weight: 500;

  &:focus-visible {
    outline: 4px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 4px;
  }
`
