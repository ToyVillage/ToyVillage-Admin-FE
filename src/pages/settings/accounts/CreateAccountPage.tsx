import { useCallback, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation } from '@tanstack/react-query'
import {
  CreateAccountForm,
  createEmployee,
  isUsernameConflictError,
  type CreateAccountSubmit,
} from '@/features/create-account'
import toyVillageLogo from '@/shared/assets/toyvillage-logo.png'
import { Toast, type ToastVariant } from '@/shared/ui'

export function CreateAccountPage() {
  const [toast, setToast] = useState<{
    variant: ToastVariant
    message: string
  } | null>(null)
  const dismissToast = useCallback(() => setToast(null), [])
  const { mutateAsync } = useMutation({ mutationFn: createEmployee })

  const submit: CreateAccountSubmit = async ({ name, username }) => {
    await mutateAsync({ username, name })
  }

  return (
    <Page>
      <Card>
        <Brand>
          <Logo src={toyVillageLogo} alt="토이빌리지" />
          <HeadingGroup>
            <Title>계정 생성</Title>
            <Description>토이빌리지 직원 계정을 생성하세요</Description>
          </HeadingGroup>
        </Brand>
        <CreateAccountForm
          onSubmit={submit}
          onSuccess={() =>
            setToast({ variant: 'success', message: '계정이 생성되었습니다' })
          }
          onError={(error) =>
            setToast({
              variant: 'error',
              message: isUsernameConflictError(error)
                ? '이미 사용 중인 아이디입니다'
                : '계정 생성에 실패했습니다',
            })
          }
        />
      </Card>
      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          onDismiss={dismissToast}
        />
      )}
    </Page>
  )
}

const Page = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 32px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};

  @media (max-width: 767px) {
    align-items: start;
    padding: 80px 20px 20px;
  }
`

const Card = styled.section`
  width: min(720px, 100%);
  min-height: 843px;
  padding: 52px 40px 54px;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 12px 40px rgba(20, 26, 23, 0.1);

  @media (max-width: 767px) {
    min-height: 0;
    padding: 40px 24px;
  }
`

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`

const Logo = styled.img`
  width: 136px;
  height: 114px;
  object-fit: cover;
`

const HeadingGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 40px;
  font-weight: 700;
  line-height: normal;
`

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 500;
  line-height: normal;

  @media (max-width: 520px) {
    font-size: 19px;
  }
`
