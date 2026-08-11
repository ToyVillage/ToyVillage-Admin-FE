import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'

export type ToastVariant = 'success' | 'error'

interface ToastProps {
  variant: ToastVariant
  message: string
  onDismiss: () => void
  // Figma에 시간 규격이 없어 화면 공통 기본값으로 둔다.
  duration?: number
}

const defaultDuration = 3000

// Figma "toast notification" 공통 컴포넌트. 화면 우상단 고정, 일정 시간 후 스스로 사라진다.
export function Toast({
  variant,
  message,
  onDismiss,
  duration = defaultDuration,
}: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration)
    return () => window.clearTimeout(timer)
  }, [duration, message, onDismiss, variant])

  return createPortal(
    <Container role={variant === 'error' ? 'alert' : 'status'}>
      <Row>
        <Icon viewBox="0 0 40 40" aria-hidden="true">
          {variant === 'success' ? (
            <path d="M20 3.333C10.795 3.333 3.333 10.795 3.333 20S10.795 36.667 20 36.667 36.667 29.205 36.667 20 29.205 3.333 20 3.333Zm-3.333 25L8.333 20l2.35-2.35 5.984 5.967L29.317 11.05l2.35 2.367-15 15Z" />
          ) : (
            <path d="M20 3.333C10.795 3.333 3.333 10.795 3.333 20S10.795 36.667 20 36.667 36.667 29.205 36.667 20 29.205 3.333 20 3.333Zm1.667 25h-3.334v-3.333h3.334v3.333Zm0-6.666h-3.334v-10h3.334v10Z" />
          )}
        </Icon>
        <Message>{message}</Message>
      </Row>
    </Container>,
    document.body,
  )
}

const Container = styled.div`
  position: fixed;
  top: 32px;
  right: 48px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  width: min(calc(100vw - 96px), 440px);
  padding: 20px 24px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
  font-family: ${({ theme }) => theme.font.body};
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`

const Icon = styled.svg`
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  fill: ${({ theme }) => theme.colors.toastIcon};
`

const Message = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
`
