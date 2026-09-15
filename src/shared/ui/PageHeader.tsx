import type { ReactNode } from 'react'
import styled from '@emotion/styled'

interface PageHeaderProps {
  title: string
  subtitle: string
  /** 우측 CTA 슬롯(예: `LinkButton`). */
  action?: ReactNode
}

// Figma 목록 화면 공용 `title` 인스턴스(39:8754) — 제목 60 · 부제 32, CTA 는 하단 정렬.
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Header>
      <Heading>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
      </Heading>
      {action}
    </Header>
  )
}

const Header = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;

  @media (max-width: 980px) {
    flex-wrap: wrap;
  }
`

const Heading = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 60px;
  font-weight: 600;
  line-height: 1.2;

  @media (max-width: 980px) {
    font-size: 40px;
  }
`

const Subtitle = styled.p`
  margin: 12px 0 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;

  @media (max-width: 980px) {
    font-size: 24px;
  }
`
