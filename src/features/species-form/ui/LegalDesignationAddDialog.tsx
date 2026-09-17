import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'

interface LegalDesignationAddDialogProps {
  /** 현재 목록(기본 선택지 + 서버 공용 목록). 같은 이름은 추가하지 않는다. */
  existingNames: string[]
  /** 추가 요청 중 — `추가하기` 를 막아 중복 제출하지 않는다. */
  pending: boolean
  /** 직전 추가 요청이 실패했다. 입력을 바꾸면 오류 줄을 숨긴다. */
  failed: boolean
  onCancel: () => void
  onAdd: (name: string) => void
}

// Figma `species new (add legal)` 모달(959:26348). 구조·포커스 트랩·inert 처리는
// 팀 설정 `AddTeamDialog` 와 같다. 닫힌 뒤 포커스 복귀는 호출부(`+ 법정분류 추가`)가 맡는다.
export function LegalDesignationAddDialog({
  existingNames,
  pending,
  failed,
  onCancel,
  onAdd,
}: LegalDesignationAddDialogProps) {
  const titleId = useId()
  const errorId = useId()
  const dialogRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [failedName, setFailedName] = useState<string | null>(null)

  const trimmedName = name.trim()

  useEffect(() => {
    const appRoot = document.getElementById('root')
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')
    inputRef.current?.focus()

    return () => {
      appRoot?.removeAttribute('inert')
      appRoot?.removeAttribute('aria-hidden')
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      // 비활성 `추가하기` 는 건너뛰므로 매번 포커스 가능한 요소를 다시 모은다.
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'input, button:not(:disabled)',
        ),
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (
        event.shiftKey &&
        (active === first || !focusable.includes(active as HTMLElement))
      ) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // 포털이어도 React 트리로는 종 폼 안이라 제출 이벤트가 폼까지 올라가지 않게 막는다.
    event.stopPropagation()
    if (!trimmedName || pending) return

    // 중복 오류는 다음 `추가하기` 때 다시 판정한다(입력 중에는 그대로 둔다).
    if (existingNames.includes(trimmedName)) {
      setIsDuplicate(true)
      return
    }

    setFailedName(trimmedName)
    onAdd(trimmedName)
  }

  const showFailure = failed && !pending && failedName === trimmedName

  return createPortal(
    <Overlay
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        noValidate
        onSubmit={handleSubmit}
      >
        <Title id={titleId}>법정분류 추가</Title>
        <Input
          ref={inputRef}
          aria-label="분류 이름"
          aria-describedby={isDuplicate ? errorId : undefined}
          value={name}
          placeholder="분류 이름을 입력해주세요"
          autoComplete="off"
          onChange={(event) => setName(event.target.value)}
        />
        {showFailure && (
          <ErrorRow role="alert">
            <ErrorMark aria-hidden="true">!</ErrorMark>
            추가하지 못했습니다. 다시 시도해 주세요.
          </ErrorRow>
        )}
        {isDuplicate && (
          <ErrorRow role="alert" id={errorId}>
            <ErrorMark aria-hidden="true">!</ErrorMark>
            이미 있는 분류입니다!
          </ErrorRow>
        )}
        <Actions>
          <CancelButton type="button" onClick={onCancel}>
            취소
          </CancelButton>
          <AddButton type="submit" disabled={!trimmedName || pending}>
            추가하기
          </AddButton>
        </Actions>
      </Dialog>
    </Overlay>,
    document.body,
  )
}

// Figma dim 은 rgba(0, 0, 0, 0.4) 지만 기존 모달 dim(0.5)을 유지한다(spec 결정 사항).
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
  width: min(calc(100% - 80px), 600px);
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.font.body};

  @media (max-width: 980px) {
    padding: 32px 24px;
  }
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 28px;
  font-weight: 500;
  line-height: 34px;
`

const Input = styled.input`
  width: 100%;
  height: 63px;
  padding: 0 24px;
  border: 0;
  border-radius: 8px;
  outline: 0;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 22px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.optionMuted};
    opacity: 1;
  }
`

const ErrorRow = styled.p`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`

const ErrorMark = styled.span`
  display: inline-flex;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`

const DialogButton = styled.button`
  height: 48px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-weight: 500;
  line-height: 1.2;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`

const CancelButton = styled(DialogButton)`
  width: 100px;
  border: 1px solid ${({ theme }) => theme.colors.textGuide};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
`

const AddButton = styled(DialogButton)`
  min-width: 117px;
  padding: 0 20px;
  border: 0;
  background: ${({ theme }) => theme.colors.textStrong};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 22px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`
