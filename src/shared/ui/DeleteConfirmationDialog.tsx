import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import warningIcon from './assets/warning.svg'

interface DeleteConfirmationDialogProps {
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteConfirmationDialog({
  pending,
  onCancel,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const pendingRef = useRef(pending)

  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  useEffect(() => {
    const appRoot = document.getElementById('root')
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')
    cancelRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pendingRef.current) {
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
    }
  }, [onCancel])

  return createPortal(
    <Overlay>
      <Dialog
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={pending}
      >
        <Copy>
          <WarningIcon src={warningIcon} alt="" aria-hidden="true" />
          <Title id={titleId}>정말 삭제하시겠습니까?</Title>
          <Description id={descriptionId}>
            삭제하신 뒤에는 영구삭제되며
            <br />
            복구 할 수 없습니다
          </Description>
        </Copy>
        <Actions>
          <CancelButton
            ref={cancelRef}
            type="button"
            disabled={pending}
            onClick={onCancel}
          >
            취소
          </CancelButton>
          <ConfirmButton
            ref={confirmRef}
            type="button"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? '삭제 중' : '확인'}
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
  min-height: 309px;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`

const WarningIcon = styled.img`
  width: 48px;
  height: 48px;
`

const Title = styled.h2`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
`

const Description = styled.p`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  line-height: 1.4;
`

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
`

const DialogButton = styled.button`
  width: 100px;
  height: 48px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 20px;
  font-weight: 500;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 4px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 4px;
  }
`

const CancelButton = styled(DialogButton)`
  border: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
`

const ConfirmButton = styled(DialogButton)`
  border: 0;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
`
