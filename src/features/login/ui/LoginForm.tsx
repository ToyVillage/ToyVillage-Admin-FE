import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import styled from '@emotion/styled'
import type { LoginSubmit } from '../model/types'
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
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

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
    } catch {
      setPassword('')
      setErrorField(null)
      requestAnimationFrame(() => passwordRef.current?.focus())
    } finally {
      submittingRef.current = false
      setIsPending(false)
    }
  }

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
              if (errorField === 'username') setErrorField(null)
            }}
          />
          {errorField === 'username' && (
            <ErrorMessage id="login-username-error" role="alert">
              아이디를 입력해주세요
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
              aria-describedby={
                errorField === 'password' ? 'login-password-error' : undefined
              }
              onChange={(event) => {
                setPassword(event.target.value)
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
              비밀번호를 입력해주세요
            </ErrorMessage>
          )}
        </Field>
      </Fields>

      <SubmitButton type="submit" disabled={isPending}>
        {isPending ? '로그인 중' : '로그인'}
      </SubmitButton>
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
  gap: 32px;
`

const Field = styled.div`
  position: relative;
  display: flex;
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
  border: 2px solid transparent;
  border-radius: 8px;
  outline: 0;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 20px;
  font-weight: 500;

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
`

const PasswordInputBox = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 64px;
  padding: 14px 12px 14px 16px;
  border: 2px solid transparent;
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
  height: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 20px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textGuide};
    opacity: 1;
  }
`

const ErrorMessage = styled.span`
  position: absolute;
  top: calc(100% + 4px);
  left: 4px;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 14px;
  font-weight: 600;
`

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 77px;
  margin-top: 160px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.text};
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

  @media (max-width: 767px) {
    margin-top: 48px;
  }
`
