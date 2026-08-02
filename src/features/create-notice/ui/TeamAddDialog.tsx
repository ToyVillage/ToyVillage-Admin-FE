import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'

interface TeamAddDialogProps {
  onCancel: () => void
  onAdd: (teamName: string) => void
}

export function TeamAddDialog({ onCancel, onAdd }: TeamAddDialogProps) {
  const titleId = useId()
  const inputId = useId()
  const dialogRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const [teamName, setTeamName] = useState('')

  useEffect(() => {
    const appRoot = document.getElementById('root')
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')
    dialogRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== 'Tab') return

      if (
        event.shiftKey &&
        (document.activeElement === inputRef.current ||
          document.activeElement === dialogRef.current)
      ) {
        event.preventDefault()
        nextRef.current?.focus()
      } else if (
        !event.shiftKey &&
        document.activeElement === nextRef.current
      ) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      appRoot?.removeAttribute('inert')
      appRoot?.removeAttribute('aria-hidden')
    }
  }, [onCancel])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    const normalizedName = teamName.trim()

    if (!normalizedName) {
      inputRef.current?.focus()
      return
    }

    onAdd(normalizedName)
  }

  return createPortal(
    <Overlay>
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onSubmit={handleSubmit}
      >
        <Title id={titleId}>팀 추가하기</Title>
        <Field>
          <Label htmlFor={inputId}>팀 이름</Label>
          <Input
            ref={inputRef}
            id={inputId}
            value={teamName}
            placeholder="팀 이름"
            autoComplete="off"
            onChange={(event) => setTeamName(event.target.value)}
          />
        </Field>
        <Actions>
          <CancelButton type="button" onClick={onCancel}>
            취소
          </CancelButton>
          <NextButton ref={nextRef} type="submit">
            다음
          </NextButton>
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

const Dialog = styled.form`
  display: flex;
  width: min(calc(100% - 40px * 2), 600px);
  min-height: 370px;
  flex-direction: column;
  padding: 32px 54px 48px;
  border-radius: 20px;
  outline: 0;
  background: ${({ theme }) => theme.colors.surface};
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 54px;
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`

const Input = styled.input`
  width: 100%;
  height: 64px;
  padding: 0 20px;
  border: 0;
  border-radius: 20px;
  outline: 0;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 18px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
    opacity: 1;
  }
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: auto;
`

const DialogButton = styled.button`
  width: 100px;
  height: 48px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 18px;
  font-weight: 500;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.textGuide};
    outline-offset: 3px;
  }
`

const CancelButton = styled(DialogButton)`
  border: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textGuide};
`

const NextButton = styled(DialogButton)`
  border: 0;
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.surface};
`
