import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import { BackLink } from '@/shared/ui'

interface FormPageLayoutProps {
  backTo: string
  title: string
  /** 수정·개체 등록 화면의 대상 설명. 저장된 값으로 만든다. */
  subtitle?: string
  children: ReactNode
}

// 개체관리 등록·수정 화면 골격(Figma `species new` 68:8744 · `individual new` 71:8747).
// 뒤로가기 @y=75 → 제목 @y=144 → (부제 +8px) → 폼(제목 아래 38px / 부제 아래 31px).
export function FormPageLayout({
  backTo,
  title,
  subtitle,
  children,
}: FormPageLayoutProps) {
  return (
    <Page>
      <Content>
        <BackLink to={backTo} />
        <Header data-has-subtitle={Boolean(subtitle)}>
          <Title>{title}</Title>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </Header>
        {children}
      </Content>
    </Page>
  )
}

const Page = styled.main`
  min-height: 100vh;
  padding: 0 32px 80px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.font.body};

  @media (max-width: 980px) {
    padding: 0 20px 48px;
  }
`

const Content = styled.div`
  display: flex;
  width: min(100%, 1320px);
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto;
  padding-top: 75px;
`

const Header = styled.header`
  display: flex;
  align-self: stretch;
  flex-direction: column;
  gap: 8px;
  margin: 33px 0 38px;

  &[data-has-subtitle='true'] {
    margin-bottom: 31px;
  }
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 40px;
  font-weight: 500;
  line-height: 48px;

  @media (max-width: 980px) {
    font-size: 32px;
    line-height: 40px;
  }
`

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 24px;
  font-weight: 500;
  line-height: 29px;

  @media (max-width: 980px) {
    font-size: 20px;
    line-height: 24px;
  }
`
