import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'

interface RejectReasonDialogProps {
  pending: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

// Figma 3350:4018 — 상세 화면 위 오버레이(3125:4869) + 반려 사유 모달.
// Figma 에 취소 버튼도 닫기(X) 아이콘도 없어 이탈은 Esc·오버레이 클릭으로 둔다.
export function RejectReasonDialog({
  pending,
  onCancel,
  onConfirm,
}: RejectReasonDialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const reasonRef = useRef<HTMLTextAreaElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const pendingRef = useRef(pending)
  const onCancelRef = useRef(onCancel)
  const [reason, setReason] = useState('')

  useEffect(() => {
    pendingRef.current = pending
  }, [pending])

  // 부모가 `onCancel` 을 인라인으로 넘겨도 아래 마운트 effect 가 다시 돌지 않도록 최신 값만 담아 둔다.
  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  // 초점 스냅샷·배경 inert·초기 초점은 열고 닫을 때 한 번씩만 일어나야 해서 의존성을 비운다.
  useEffect(() => {
    const appRoot = document.getElementById('root')
    previousFocusRef.current = document.activeElement as HTMLElement | null
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')
    reasonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pendingRef.current) {
        event.preventDefault()
        onCancelRef.current()
        return
      }

      if (event.key !== 'Tab') return

      // `확인` 은 사유가 비면 비활성이라 초점 대상이 매번 달라진다.
      const focusables = focusableElements(dialogRef.current)
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
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
  }, [])

  // 처리 중에는 `확인` 이 비활성이 되면서 브라우저가 초점을 body 로 흘려보낸다. 모달 안으로 되돌린다.
  useEffect(() => {
    if (!pending) return
    if (dialogRef.current?.contains(document.activeElement)) return
    reasonRef.current?.focus()
  }, [pending])

  const trimmedReason = reason.trim()
  const canConfirm = trimmedReason.length > 0 && !pending

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || pending) return
    onCancel()
  }

  function handleConfirm() {
    if (!canConfirm) return
    onConfirm(trimmedReason)
  }

  return createPortal(
    <Overlay onMouseDown={handleOverlayMouseDown}>
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={pending}
      >
        <Title id={titleId}>반려 사유를 작성해주세요</Title>
        <ReasonField
          ref={reasonRef}
          value={reason}
          placeholder="반려 사유 작성"
          aria-label="반려 사유"
          readOnly={pending}
          onChange={(event) => setReason(event.target.value)}
        />
        <ConfirmButton
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
        >
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
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Title = styled.h2`
  width: 100%;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
`

const ReasonField = styled.textarea`
  width: 100%;
  height: 206px;
  padding: 20px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  resize: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
  }

  &:read-only {
    cursor: wait;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.text};
    outline-offset: 2px;
  }
`

const ConfirmButton = styled.button`
  width: 100%;
  height: 73px;
  border: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  font: inherit;
  font-size: 28px;
  font-weight: 500;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 4px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 4px;
  }
`

function focusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []

  return [
    ...container.querySelectorAll<HTMLElement>(
      'textarea:not([disabled]), button:not([disabled])',
    ),
  ]
}
