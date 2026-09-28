import { useEffect } from 'react'
import styled from '@emotion/styled'
import { Link, useRouteError } from 'react-router-dom'
import * as Sentry from '@sentry/react'

// 화면을 그리다 난 에러를 받는 최상위 errorElement.
// 없으면 React Router 기본 화면이 뜨고 에러 기록도 남지 않는다.
export function RouteErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <Container role="alert">
      <Title>화면을 불러오지 못했습니다</Title>
      <Description>잠시 후 다시 시도해 주세요.</Description>
      <HomeLink to="/" reloadDocument>
        홈으로 이동
      </HomeLink>
    </Container>
  )
}

const Container = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};
`

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textStrong};
`

const Description = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSub};
`

const HomeLink = styled(Link)`
  margin-top: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.inkSurface};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
`
