import styled from '@emotion/styled'
import { useNavigate } from 'react-router-dom'
import { LoginForm, submitLogin } from '@/features/login'
import { queryClient } from '@/shared/config/queryClient'
import toVillageLogo from '@/shared/assets/toyvillage-logo.png'
import { LoginBrandPanel } from './ui/LoginBrandPanel'

export function LoginPage() {
  const navigate = useNavigate()

  function handleLoginSuccess() {
    // 이전 사용자의 서버 데이터가 남지 않게 비운다.
    queryClient.clear()
    navigate('/')
  }

  return (
    <Page>
      <LoginBrandPanel />
      <CardArea>
        <Card>
          <Brand>
            <Logo src={toVillageLogo} alt="토이빌리지" />
            <HeadingGroup>
              <Title>로그인</Title>
              <Description>
                토이빌리지 관리자에 로그인하고
                <br />
                토이빌리지의 업무들을 관리하세요
              </Description>
            </HeadingGroup>
          </Brand>
          <LoginForm onSubmit={submitLogin} onSuccess={handleLoginSuccess} />
        </Card>
      </CardArea>
    </Page>
  )
}

const Page = styled.main`
  display: grid;
  grid-template-columns: 760px minmax(0, 1fr);
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};

  @media (max-width: 1279px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const CardArea = styled.div`
  display: grid;
  min-width: 0;
  place-items: center;
  padding: 32px;

  @media (max-width: 767px) {
    align-items: start;
    padding: 20px;
  }
`

const Card = styled.section`
  position: relative;
  width: min(720px, 100%);
  min-height: 843px;
  overflow: hidden;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 12px 40px 0 rgba(20, 26, 23, 0.1);

  @media (max-width: 767px) {
    min-height: 0;
    padding: 40px 24px;
  }
`

const Brand = styled.div`
  position: absolute;
  top: 52px;
  left: 50%;
  display: flex;
  width: 324px;
  transform: translateX(-50%);
  flex-direction: column;
  align-items: center;
  gap: 12px;

  @media (max-width: 767px) {
    position: static;
    width: 100%;
    transform: none;
  }
`

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
