import { useCallback, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import styled from '@emotion/styled'
import { Toast } from '@/shared/ui'
import { LoginSubmitError, type LoginSubmit } from '../model/types'
import { PasswordVisibilityButton } from './PasswordVisibilityButton'

interface LoginFormProps {
  onSubmit: LoginSubmit
  onSuccess: () => void
}

type FieldName = 'username' | 'password'

export function LoginForm({ onSubmit, onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [errorField, setErrorField] = useState<FieldName | null>(null)
  const [isCredentialError, setIsCredentialError] = useState(false)
  const [isFailureToastOpen, setIsFailureToastOpen] = useState(false)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    setIsCredentialError(false)
    setIsFailureToastOpen(false)

    const normalizedUsername = username.trim()

    if (!normalizedUsername) {
      setErrorField('username')
      usernameRef.current?.focus()
      return
    }

    if (!password) {
      setErrorField('password')
      passwordRef.current?.focus()
      return
    }

    setErrorField(null)
    submittingRef.current = true
    setIsPending(true)

    try {
      await onSubmit({ username: normalizedUsername, password })
      onSuccess()
    } catch (error) {
      if (error instanceof LoginSubmitError && error.reason === 'credential') {
        setIsCredentialError(true)
      } else {
        setIsFailureToastOpen(true)
      }
      setPassword('')
      setErrorField(null)
      requestAnimationFrame(() => passwordRef.current?.focus())
    } finally {
      submittingRef.current = false
      setIsPending(false)
    }
  }

  const dismissFailureToast = useCallback(() => {
    setIsFailureToastOpen(false)
  }, [])

  const passwordErrorId =
    errorField === 'password'
      ? 'login-password-error'
      : isCredentialError
        ? 'login-credential-error'
        : undefined

  function handlePasswordToggle() {
    setIsPasswordVisible((current) => !current)
  }

  return (
    <Form noValidate onSubmit={handleSubmit} aria-busy={isPending}>
      <Fields>
        <Field>
          <Label htmlFor="login-username">아이디</Label>
          <Input
            ref={usernameRef}
            id="login-username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="아이디를 입력해주세요"
            value={username}
            required
            aria-invalid={errorField === 'username'}
            aria-describedby={
              errorField === 'username' ? 'login-username-error' : undefined
            }
            onChange={(event) => {
              setUsername(event.target.value)
              setIsCredentialError(false)
              if (errorField === 'username') setErrorField(null)
            }}
          />
          {errorField === 'username' && (
            <ErrorMessage id="login-username-error" role="alert">
              <ErrorBadge aria-hidden="true">!</ErrorBadge>
              아이디를 입력해주세요!
            </ErrorMessage>
          )}
        </Field>

        <Field>
          <Label htmlFor="login-password">비밀번호</Label>
          <PasswordInputBox>
            <PasswordInput
              ref={passwordRef}
              id="login-password"
              name="password"
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="비밀번호를 입력해주세요"
              value={password}
              required
              aria-invalid={errorField === 'password'}
              aria-describedby={passwordErrorId}
              onChange={(event) => {
                setPassword(event.target.value)
                setIsCredentialError(false)
                if (errorField === 'password') setErrorField(null)
              }}
            />
            <PasswordVisibilityButton
              isVisible={isPasswordVisible}
              onToggle={handlePasswordToggle}
            />
          </PasswordInputBox>
          {errorField === 'password' && (
            <ErrorMessage id="login-password-error" role="alert">
              <ErrorBadge aria-hidden="true">!</ErrorBadge>
              비밀번호를 입력해주세요!
            </ErrorMessage>
          )}
          {isCredentialError && (
            <ErrorMessage id="login-credential-error" role="alert">
              <ErrorBadge aria-hidden="true">!</ErrorBadge>
              아이디 또는 비밀번호를 확인해주세요
            </ErrorMessage>
          )}
        </Field>
      </Fields>

      <SubmitButton type="submit" disabled={isPending}>
        {isPending ? '로그인 중' : '로그인'}
      </SubmitButton>

      {isFailureToastOpen && (
        <Toast
          variant="error"
          message="로그인에 실패했습니다"
          onDismiss={dismissFailureToast}
        />
      )}
    </Form>
  )
}

const Form = styled.form`
  position: absolute;
  top: 324px;
  left: 40px;
  width: 640px;

  @media (max-width: 767px) {
    position: static;
    width: 100%;
    margin-top: 32px;
  }
`

const Fields = styled.div`
  display: flex;
  flex-direction: column;
`

// 오류 문구가 나타나도 다음 필드와 버튼 위치가 흔들리지 않게 높이를 고정한다.
const Field = styled.div`
  display: flex;
  min-height: 160px;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 767px) {
    min-height: 136px;
  }
`

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text};
  font-size: 22px;
  font-weight: 600;
  line-height: normal;
`

const Input = styled.input`
  width: 100%;
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

  &[aria-invalid='true'] {
    border-color: ${({ theme }) => theme.colors.danger};
  }

  &:focus-visible {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &[aria-invalid='true']:focus-visible {
    border-color: ${({ theme }) => theme.colors.danger};
  }
`

const PasswordInputBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 18px 16px;
  border: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:has(input[aria-invalid='true']) {
    border-color: ${({ theme }) => theme.colors.danger};
  }
`

const PasswordInput = styled.input`
  min-width: 0;
  flex: 1;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 20px;
  font-weight: 500;
  line-height: normal;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
    opacity: 1;
  }
`

const ErrorMessage = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 18px;
  font-weight: 500;
  line-height: normal;
`

const ErrorBadge = styled.span`
  display: grid;
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 11px;
  background: ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
`

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 68px;
  padding: 23px;
  border: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.dialogBorder};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.brandAction};
  color: ${({ theme }) => theme.colors.surface};
  font: inherit;
  font-size: 28px;
  font-weight: 500;
  line-height: normal;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }

  @media (max-width: 767px) {
    margin-top: 32px;
  }
`
