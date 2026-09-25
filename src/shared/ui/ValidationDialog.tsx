import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import { fadeIn, motionDuration, motionEasing, popIn } from './motion'

interface ValidationDialogProps {
  message: string
  onConfirm: () => void
}

export function ValidationDialog({
  message,
  onConfirm,
}: ValidationDialogProps) {
  const messageId = useId()
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const appRoot = document.getElementById('root')
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
    }
  }, [onConfirm])

  return createPortal(
    <Overlay>
      <Dialog role="alertdialog" aria-modal="true" aria-labelledby={messageId}>
        <Message id={messageId}>{message}</Message>
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
  animation: ${fadeIn} ${motionDuration.overlay}ms ${motionEasing.enter} both;
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
  animation: ${popIn} ${motionDuration.overlay}ms ${motionEasing.enter} both;
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
`
