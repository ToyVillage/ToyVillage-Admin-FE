import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import { fadeIn, motionDuration, motionEasing, popIn } from '@/shared/ui'
import { isUsernameConflictError } from '../api/employeeApi'
import { trapTab } from '../lib/trapTab'
import type { CreateAccountInput, CreateAccountSubmit } from '../model/types'

interface CreateAccountDialogProps {
  onSubmit: CreateAccountSubmit
  onCancel: () => void
  /** 생성 성공. 호출부가 같은 틱에 모달을 닫고 결과를 알린다(갱신은 기다리지 않는다). */
  onCreated: (input: CreateAccountInput) => void
  /** 아이디 중복(409)이 아닌 실패. 모달과 입력은 그대로 두고 호출부가 알린다. */
  onError: (error: unknown) => void
}

type FieldName = 'name' | 'username'
type FieldErrors = Record<FieldName, string | null>

const requiredMessages: Record<FieldName, string> = {
  name: '이름을 입력해주세요',
  username: '아이디를 입력해주세요',
}

const duplicateUsernameMessage = '이미 사용 중인 아이디예요'

// Figma `계정 생성 모달`(2448:25146) — 기본 · 빈 값 오류(2448:25289) · 아이디 중복(2448:25434).
export function CreateAccountDialog({
  onSubmit,
  onCancel,
  onCreated,
  onError,
}: CreateAccountDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const nameId = useId()
  const usernameId = useId()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({
    name: null,
    username: null,
  })
  const [isPending, setIsPending] = useState(false)
  const dialogRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const submittingRef = useRef(false)
  // 호출부가 매 렌더 새 onCancel 을 넘겨도 아래 effect 가 다시 돌지 않게 ref 로 읽는다.
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    onCancelRef.current = onCancel
  }, [onCancel])

  useEffect(() => {
    const appRoot = document.getElementById('root')
    previousFocusRef.current = document.activeElement as HTMLElement | null
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')
    nameRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!submittingRef.current) onCancelRef.current()
        return
      }

      if (event.key === 'Tab') trapTab(dialogRef.current, event)
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const input = { name: name.trim(), username: username.trim() }
    const nextErrors: FieldErrors = {
      name: input.name ? null : requiredMessages.name,
      username: input.username ? null : requiredMessages.username,
    }

    if (nextErrors.name || nextErrors.username) {
      setErrors(nextErrors)
      if (nextErrors.name) nameRef.current?.focus()
      else usernameRef.current?.focus()
      return
    }

    submittingRef.current = true
    setIsPending(true)

    try {
      await onSubmit(input)
      submittingRef.current = false
      onCreated(input)
    } catch (error) {
      submittingRef.current = false
      setIsPending(false)

      if (isUsernameConflictError(error)) {
        setErrors({ name: null, username: duplicateUsernameMessage })
        usernameRef.current?.focus()
        return
      }

      onError(error)
    }
  }

  function clearError(field: FieldName) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: null }))
  }

  function cancel() {
    if (!submittingRef.current) onCancel()
  }

  return createPortal(
    <Overlay
      onMouseDown={(event) => event.target === event.currentTarget && cancel()}
    >
      <Dialog
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isPending}
        noValidate
        onSubmit={handleSubmit}
      >
        <Heading>
          <Title id={titleId}>계정 생성</Title>
          <Description id={descriptionId}>
            토이빌리지 직원 계정을 생성하세요
          </Description>
        </Heading>

        <Field>
          <Label htmlFor={nameId}>이름</Label>
          <Input
            ref={nameRef}
            id={nameId}
            name="name"
            type="text"
            autoComplete="off"
            placeholder="이름을 입력해주세요"
            value={name}
            required
            aria-invalid={errors.name != null}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            onChange={(event) => {
              setName(event.target.value)
              clearError('name')
            }}
          />
          {errors.name && (
            <ErrorText id={`${nameId}-error`} role="alert">
              {errors.name}
            </ErrorText>
          )}
        </Field>

        <Field>
          <Label htmlFor={usernameId}>아이디</Label>
          <Input
            ref={usernameRef}
            id={usernameId}
            name="username"
            type="text"
            autoComplete="off"
            placeholder="아이디를 입력해주세요"
            value={username}
            required
            aria-invalid={errors.username != null}
            aria-describedby={
              errors.username ? `${usernameId}-error` : undefined
            }
            onChange={(event) => {
              setUsername(event.target.value)
              clearError('username')
            }}
          />
          {errors.username && (
            <ErrorText id={`${usernameId}-error`} role="alert">
              {errors.username}
            </ErrorText>
          )}
        </Field>

        <Notice>
          <NoticeMark aria-hidden="true">ⓘ</NoticeMark>
          <NoticeText>초기 비밀번호는 아이디와 같아요.</NoticeText>
        </Notice>

        <Actions>
          <CancelButton type="button" disabled={isPending} onClick={cancel}>
            취소
          </CancelButton>
          <SubmitButton type="submit" disabled={isPending}>
            계정 생성
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
  overflow-y: auto;
  padding: 40px 0;
  background: rgba(0, 0, 0, 0.5);
  animation: ${fadeIn} ${motionDuration.overlay}ms ${motionEasing.enter} both;
`

const Dialog = styled.form`
  display: flex;
  width: min(calc(100% - 40px * 2), 640px);
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.font.body};
  animation: ${popIn} ${motionDuration.overlay}ms ${motionEasing.enter} both;
`

const Heading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 30px;
  font-weight: 600;
  line-height: 1.2;
`

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

// 오류 테두리(1.5px)가 생겨도 크기가 바뀌지 않게 평소에도 같은 두께의 투명 테두리를 둔다.
const Input = styled.input`
  width: 100%;
  height: 66px;
  padding: 0 24px;
  border: 1.5px solid transparent;
  border-radius: 8px;
  outline: 0;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textFaint};
    opacity: 1;
  }

  &[aria-invalid='true'] {
    border-color: ${({ theme }) => theme.colors.danger};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const ErrorText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
`

const Notice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px 20px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
`

const NoticeMark = styled.span`
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
`

const NoticeText = styled.p`
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
`

const DialogButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 16px 24px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const CancelButton = styled(DialogButton)`
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
`

const SubmitButton = styled(DialogButton)`
  background: ${({ theme }) => theme.colors.textStrong};
  color: ${({ theme }) => theme.colors.surface};
`
