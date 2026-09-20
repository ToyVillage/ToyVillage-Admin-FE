import { Link } from 'react-router-dom'
import styled from '@emotion/styled'
import { motionDuration, motionEasing } from '@/shared/ui'
import { SidebarIcon } from './SidebarIcon'
import type { SidebarDashboardItem } from '../model/types'

interface SidebarItemProps {
  item: SidebarDashboardItem
  active: boolean
  onClick: () => void
}

// Figma `메뉴 / 대시보드`. 아코디언이 아니라 바로 이동하는 단일 메뉴다.
export function SidebarItem({ item, active, onClick }: SidebarItemProps) {
  return (
    <NavItem to={item.to} onClick={onClick} $active={active}>
      <SidebarIcon name={item.icon} />
      <ItemLabel>{item.label}</ItemLabel>
    </NavItem>
  )
}

const NavItem = styled(Link, {
  shouldForwardProp: (prop) => prop !== '$active',
})<{ $active: boolean }>`
  display: flex;
  min-height: 56px;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  padding: 12px 36px;
  border-radius: 12px;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.accentBg : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.accent : theme.colors.text};
  text-decoration: none;
  transition:
    background ${motionDuration.color}ms ${motionEasing.enter},
    color ${motionDuration.color}ms ${motionEasing.enter};
`

const ItemLabel = styled.span`
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
`
