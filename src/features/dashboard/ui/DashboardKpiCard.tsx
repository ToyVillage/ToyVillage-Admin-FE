import styled from '@emotion/styled'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/shared/ui'

interface DashboardKpiCardProps {
  label: string
  value: number
  icon: string
  to: string
  // 첫 조회 중. 라벨·아이콘은 그대로 두고 수치 자리만 막대로 채운다(Figma 2238:22610).
  loading?: boolean
}

// Figma `kpi *`(1481:14972 등) — 카드 전체가 해당 관리 화면 링크다.
export function DashboardKpiCard({
  label,
  value,
  icon,
  to,
  loading = false,
}: DashboardKpiCardProps) {
  return (
    <Card to={to}>
      {loading ? (
        <ValueSlot>
          <Skeleton width={30} height={48} radius={24} />
        </ValueSlot>
      ) : (
        <Value>{value}</Value>
      )}
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

const ValueSlot = styled.span`
  display: flex;
  align-items: center;
  height: 48px;
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
