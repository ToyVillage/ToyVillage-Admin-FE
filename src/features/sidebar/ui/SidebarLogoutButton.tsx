import styled from '@emotion/styled'
import { SidebarIcon } from './SidebarIcon'

interface SidebarLogoutButtonProps {
  onClick: () => void
}

// Figma `하단 / 로그아웃`. 대시보드 항목과 레이아웃은 같지만 이동이 아니라 동작이라 버튼이다.
export function SidebarLogoutButton({ onClick }: SidebarLogoutButtonProps) {
  return (
    <LogoutButton type="button" onClick={onClick}>
      <SidebarIcon name="logout" />
      <LogoutLabel>로그아웃</LogoutLabel>
    </LogoutButton>
  )
}

const LogoutButton = styled.button`
  display: flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  gap: 12px;
  padding: 12px 36px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: ${({ theme }) => theme.colors.choiceMuted};
  cursor: pointer;
`

const LogoutLabel = styled.span`
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
`
