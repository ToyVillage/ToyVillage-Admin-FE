import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import styled from '@emotion/styled'
import type { CreateAccountSubmit } from '../model/types'

interface CreateAccountFormProps {
  onSubmit: CreateAccountSubmit
  onSuccess: () => void
  onError: () => void
}

type FieldName = 'name' | 'username'

const errorMessages: Record<FieldName, string> = {
  name: '이름을 입력해주세요!',
  username: '아이디를 입력해주세요!',
}

export function CreateAccountForm({
  onSubmit,
  onSuccess,
  onError,
}: CreateAccountFormProps) {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [errors, setErrors] = useState<Record<FieldName, boolean>>({
    name: false,
    username: false,
  })
  const [isPending, setIsPending] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    const normalizedName = name.trim()
    const normalizedUsername = username.trim()
    const nextErrors = { name: !normalizedName, username: !normalizedUsername }

    if (nextErrors.name || nextErrors.username) {
      setErrors(nextErrors)
      if (nextErrors.name) nameRef.current?.focus()
      else usernameRef.current?.focus()
      return
    }

    submittingRef.current = true
    setIsPending(true)

    try {
      await onSubmit({ name: normalizedName, username: normalizedUsername })
      setName('')
      setUsername('')
      requestAnimationFrame(() => nameRef.current?.focus())
      onSuccess()
    } catch {
      onError()
    } finally {
      submittingRef.current = false
      setIsPending(false)
    }
  }

  function clearError(field: FieldName) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: false }))
  }

  return (
    <Form noValidate onSubmit={handleSubmit} aria-busy={isPending}>
      <Field>
        <Label htmlFor="create-account-name">이름</Label>
        <Input
          ref={nameRef}
          id="create-account-name"
          name="name"
          type="text"
          autoComplete="off"
          placeholder="이름을 입력해주세요"
          value={name}
          required
          aria-invalid={errors.name}
          aria-describedby={
            errors.name ? 'create-account-name-error' : undefined
          }
          onChange={(event) => {
            setName(event.target.value)
            clearError('name')
          }}
        />
        {errors.name && (
          <FieldError
            id="create-account-name-error"
            message={errorMessages.name}
          />
        )}
      </Field>

      <Field>
        <Label htmlFor="create-account-username">아이디</Label>
        <Input
          ref={usernameRef}
          id="create-account-username"
          name="username"
          type="text"
          autoComplete="off"
          placeholder="아이디를 입력해주세요"
          value={username}
          required
          aria-invalid={errors.username}
          aria-describedby={
            errors.username ? 'create-account-username-error' : undefined
          }
          onChange={(event) => {
            setUsername(event.target.value)
            clearError('username')
          }}
        />
        {errors.username && (
          <FieldError
            id="create-account-username-error"
            message={errorMessages.username}
          />
        )}
      </Field>

      <Notice>*초기 비밀번호는 입력한 아이디와 동일하게 설정됩니다.</Notice>

      <SubmitButton type="submit" disabled={isPending}>
        계정 생성
      </SubmitButton>
    </Form>
  )
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <ErrorRow id={id} role="alert">
      <ErrorMark aria-hidden="true">!</ErrorMark>
      {message}
    </ErrorRow>
  )
}

const Form = styled.form`
  display: flex;
  width: 640px;
  max-width: 100%;
  flex-direction: column;
  margin: 61px auto 0;
`

// 오류 행(22px)이 나타나도 아래 요소가 밀리지 않게 필드 높이를 미리 잡는다.
const Field = styled.div`
  display: flex;
  min-height: 160px;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 600;
  line-height: normal;
`

const Input = styled.input`
  width: 100%;
  height: 64px;
  padding: 20px 16px;
  border: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  border-radius: 8px;
  outline: 0;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 20px;
  font-weight: 500;
  line-height: normal;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
    opacity: 1;
  }

  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.accent};
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
  line-height: normal;
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

const Notice = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 18px;
  font-weight: 500;
  line-height: normal;
`

const SubmitButton = styled.button`
  display: flex;
  width: 100%;
  height: 77px;
  align-items: center;
  justify-content: center;
  margin-top: 48px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.textStrong};
  color: ${({ theme }) => theme.colors.surface};
  font: inherit;
  font-size: 28px;
  font-weight: 500;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`
