import styled from '@emotion/styled'
import { Link } from 'react-router-dom'

interface DashboardKpiCardProps {
  label: string
  value: number
  icon: string
  to: string
}

// Figma `kpi *`(1481:14972 등) — 카드 전체가 해당 관리 화면 링크다.
export function DashboardKpiCard({
  label,
  value,
  icon,
  to,
}: DashboardKpiCardProps) {
  return (
    <Card to={to}>
      <Value>{value}</Value>
      <Label>{label}</Label>
      <Icon src={icon} alt="" />
    </Card>
  )
}

const Card = styled(Link)`
  position: relative;
  display: flex;
  min-height: 150px;
  flex-direction: column;
  gap: 4px;
  padding: 28px 32px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  text-decoration: none;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Value = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 48px;
  font-weight: 600;
  line-height: normal;
`

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 600;
  line-height: normal;
`

const Icon = styled.img`
  position: absolute;
  top: 28px;
  right: 32px;
  width: 36px;
  height: 36px;
`
