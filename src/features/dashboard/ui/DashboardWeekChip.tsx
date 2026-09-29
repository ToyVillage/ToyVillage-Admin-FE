import styled from '@emotion/styled'
import { formatWeekRange } from '../model/format'
import calendarIcon from './assets/calendar.svg'

interface DashboardWeekChipProps {
  today: Date
}

// Figma `week chip`(1893:17155).
export function DashboardWeekChip({ today }: DashboardWeekChipProps) {
  return (
    <Chip>
      <Icon src={calendarIcon} alt="" />
      {formatWeekRange(today)}
    </Chip>
  )
}

const Chip = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 12px 24px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.accentBg};
  color: ${({ theme }) => theme.colors.accent};
  font-size: 20px;
  font-weight: 600;
  line-height: normal;
  white-space: nowrap;
`

const Icon = styled.img`
  width: 22px;
  height: 22px;
`
