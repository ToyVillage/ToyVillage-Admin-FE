import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'

interface ErrorDialogProps {
  title: string
  description?: string
  onConfirm: () => void
}

// 예외(에러) 알림 모달. 저장·삭제 실패 등 예외 발생 시 사용한다.
// 시각 언어는 LeaveConfirmationDialog 를 참고하며, 에러 확인 성격이라 단일 `확인` 버튼만 둔다.
// 정확한 시각 디테일(Figma 1039:50)은 추후 미세조정한다.
export function ErrorDialog({ title, description, onConfirm }: ErrorDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
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
        return
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
      <Dialog
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <Copy>
          <Title id={titleId}>{title}</Title>
          {description && <Description id={descriptionId}>{description}</Description>}
        </Copy>
        <Actions>
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
  margin-top: auto;
`

const ConfirmButton = styled.button`
  width: 100px;
  height: 48px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font: inherit;
  font-size: 20px;
  font-weight: 500;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 3px;
  }
`
