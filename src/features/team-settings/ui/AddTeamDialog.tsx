import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'

interface AddTeamDialogProps {
  onCancel: () => void
  onSubmit: (name: string) => void
}

// Figma `modal / 팀 추가하기`(1760:18134) — 팀 이름 한 칸과 취소/완료.
// `완료` 를 누른 시점에 팀이 생성된다.
export function AddTeamDialog({ onCancel, onSubmit }: AddTeamDialogProps) {
  const titleId = useId()
  const inputId = useId()
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const appRoot = document.getElementById('root')
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')
    inputRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      appRoot?.removeAttribute('inert')
      appRoot?.removeAttribute('aria-hidden')
    }
  }, [onCancel])

  const canSubmit = name.trim().length > 0

  function submit() {
    if (!canSubmit) return
    onSubmit(name.trim())
  }

  return createPortal(
    <Overlay onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <Dialog role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <TitleRow>
          <Title id={titleId}>팀 추가하기</Title>
        </TitleRow>

        <Field>
          <Label htmlFor={inputId}>팀 이름</Label>
          <Input
            id={inputId}
            ref={inputRef}
            value={name}
            placeholder="팀 이름"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              submit()
            }}
          />
        </Field>

        <Actions>
          <CancelButton type="button" onClick={onCancel}>
            취소
          </CancelButton>
          <SubmitButton type="button" disabled={!canSubmit} onClick={submit}>
            완료
          </SubmitButton>
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
  flex-direction: column;
  gap: 28px;
  padding: 32px 54px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.font.body};
`

const TitleRow = styled.div`
  display: flex;
  justify-content: center;
  padding: 10px;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Input = styled.input`
  height: 64px;
  padding: 10px 20px;
  border: 0;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 18px;
  font-weight: 500;
  outline: 0;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textDim};
  }
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 10px;
`

const dialogButton = `
  display: inline-flex;
  width: 100px;
  height: 48px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 20px;
  line-height: 1.2;
`

const CancelButton = styled.button`
  ${dialogButton}
  border: 1px solid ${({ theme }) => theme.colors.textGuide};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textGuide};
  font-weight: 500;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const SubmitButton = styled.button`
  ${dialogButton}
  border: 0;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
  font-weight: 600;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`
