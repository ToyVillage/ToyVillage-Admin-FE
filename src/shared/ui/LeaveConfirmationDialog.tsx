import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'

interface LeaveConfirmationDialogProps {
  onCancel: () => void
  onConfirm: () => void
}

export function LeaveConfirmationDialog({
  onCancel,
  onConfirm,
}: LeaveConfirmationDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const appRoot = document.getElementById('root')
    previousFocusRef.current = document.activeElement as HTMLElement | null
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')
    cancelRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== 'Tab') return

      if (event.shiftKey && document.activeElement === cancelRef.current) {
        event.preventDefault()
        confirmRef.current?.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === confirmRef.current
      ) {
        event.preventDefault()
        cancelRef.current?.focus()
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
  }, [onCancel])

  return createPortal(
    <Overlay>
      <Dialog
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <Copy>
          <Title id={titleId}>정말 나가시겠습니까?</Title>
          <Description id={descriptionId}>
            저장하지 않고 돌아갈 시
            <br />
            입력된 정보가 삭제됩니다
          </Description>
        </Copy>
        <Actions>
          <CancelButton ref={cancelRef} type="button" onClick={onCancel}>
            취소
          </CancelButton>
          <ConfirmButton ref={confirmRef} type="button" onClick={onConfirm}>
            확인
          </ConfirmButton>
        </Actions>
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
  width: min(calc(100% - 40px * 2), 600px);
  min-height: 300px;
  flex-direction: column;
  padding: 72px 52px 36px;
  border-radius: 20px;
  transform: translateY(-36px);
  background: ${({ theme }) => theme.colors.surface};

  @media (max-height: 480px) {
    transform: none;
  }
`

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
`

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: auto;
`

const DialogButton = styled.button`
  width: 100px;
  height: 48px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 20px;
  font-weight: 500;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 3px;
  }
`

const CancelButton = styled(DialogButton)`
  border: 1px solid ${({ theme }) => theme.colors.textGuide};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textGuide};
`

const ConfirmButton = styled(DialogButton)`
  border: 0;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
`
