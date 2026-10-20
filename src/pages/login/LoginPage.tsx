import styled from '@emotion/styled'
import { useNavigate } from 'react-router-dom'
import { LoginForm, submitLogin } from '@/features/login'
import { queryClient } from '@/shared/config/queryClient'
import toVillageLogo from '@/shared/assets/toyvillage-logo.webp'
import { LoginBrandPanel } from './ui/LoginBrandPanel'
import {
  LoginBrand,
  LoginCard,
  LoginCardArea,
  LoginPageLayout,
} from './ui/LoginLayout'

export function LoginPage() {
  const navigate = useNavigate()

  function handleLoginSuccess() {
    // 이전 사용자의 서버 데이터가 남지 않게 비운다.
    queryClient.clear()
    navigate('/')
  }

  return (
    <LoginPageLayout>
      <LoginBrandPanel />
      <LoginCardArea>
        <LoginCard>
          <LoginBrand>
            <Logo src={toVillageLogo} alt="토이빌리지" />
            <HeadingGroup>
              <Title>로그인</Title>
              <Description>
                토이빌리지 관리자에 로그인하고
                <br />
                토이빌리지의 업무들을 관리하세요
              </Description>
            </HeadingGroup>
          </LoginBrand>
          <LoginForm onSubmit={submitLogin} onSuccess={handleLoginSuccess} />
        </LoginCard>
      </LoginCardArea>
    </LoginPageLayout>
  )
}

const Logo = styled.img`
  width: 136px;
  height: 114px;
  object-fit: cover;
`

const HeadingGroup = styled.div`
  display: flex;
  width: 100%;
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
  white-space: nowrap;

  @media (max-width: 520px) {
    font-size: 19px;
    white-space: normal;
  }
`
