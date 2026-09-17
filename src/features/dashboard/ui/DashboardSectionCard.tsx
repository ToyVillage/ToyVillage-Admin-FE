import { useId, type ReactNode } from 'react'
import styled from '@emotion/styled'
import { Link } from 'react-router-dom'
import chevronIcon from './assets/chevron.svg'

interface DashboardSectionCardProps {
  title: string
  icon: string
  to: string
  className?: string
  children: ReactNode
}

// Figma 섹션 카드(휴관일·전체 업무·최근 목록 공통). `자세히 보기` 링크가 카드 전체를 덮는다.
export function DashboardSectionCard({
  title,
  icon,
  to,
  className,
  children,
}: DashboardSectionCardProps) {
  const titleId = useId()

  return (
    <Card className={className} aria-labelledby={titleId}>
      <Header>
        <Title id={titleId}>
          <TitleIcon src={icon} alt="" />
          {title}
        </Title>
        <MoreLink to={to} aria-label={`${title} 자세히 보기`}>
          자세히 보기
          <Chevron src={chevronIcon} alt="" />
        </MoreLink>
      </Header>
      <Body>{children}</Body>
    </Card>
  )
}

const Card = styled.section`
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 28px 32px 16px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Header = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.pageMuted};
`

const Title = styled.h2`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 600;
  line-height: normal;
`

const TitleIcon = styled.img`
  width: 28px;
  height: 28px;
  flex-shrink: 0;
`

const MoreLink = styled(Link)`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
  margin-bottom: -2px;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 16px;
  font-weight: 500;
  line-height: normal;
  text-decoration: none;

  &::after {
    position: absolute;
    border-radius: 20px;
    content: '';
    inset: 0;
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Chevron = styled.img`
  width: 20px;
  height: 20px;
  transform: rotate(180deg);
`

const Body = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
`
