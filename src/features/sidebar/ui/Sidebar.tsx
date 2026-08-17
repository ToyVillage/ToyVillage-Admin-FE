import { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { Link, useLocation } from 'react-router-dom'
import calendarIcon from './assets/calendar.svg'
import chevronLeftIcon from '@/shared/ui/assets/chevron-left.svg'
import megaphoneIcon from './assets/megaphone.svg'
import peopleIcon from './assets/people.svg'
import storageIcon from './assets/storage.svg'
import taskIcon from './assets/task.svg'
import taskReportIcon from './assets/task-report.svg'
import teamIcon from './assets/team.svg'
import workLogIcon from './assets/work-log.svg'
import { mockSidebarItems, mockSidebarUser } from '../model/mock'
import { useSidebarStore } from '../model/useSidebarStore'
import type { SidebarIconName, SidebarNavItem } from '../model/types'

const sidebarIcons: Record<SidebarIconName, string> = {
  calendar: calendarIcon,
  megaphone: megaphoneIcon,
  people: peopleIcon,
  storage: storageIcon,
  task: taskIcon,
  taskReport: taskReportIcon,
  team: teamIcon,
  workLog: workLogIcon,
}

export function Sidebar() {
  const { pathname } = useLocation()
  const isOpen = useSidebarStore((state) => state.isOpen)
  const close = useSidebarStore((state) => state.close)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [close, isOpen])

  if (!isOpen) return null

  return (
    <Layer>
      <Overlay type="button" aria-label="사이드바 닫기" onClick={close} />
      <Panel
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="사이드바"
      >
        <CloseButton type="button" aria-label="사이드바 닫기" onClick={close}>
          <CloseIcon src={chevronLeftIcon} alt="" />
        </CloseButton>

        <Profile>
          <Avatar role="img" aria-label={mockSidebarUser.avatarLabel} />
          <UserName>{mockSidebarUser.name}</UserName>
        </Profile>

        <Nav aria-label="주요 메뉴">
          {mockSidebarItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={item.to ? isActiveRoute(pathname, item.to) : false}
              onClick={close}
            />
          ))}
        </Nav>
      </Panel>
    </Layer>
  )
}

function SidebarItem({
  item,
  active,
  onClick,
}: {
  item: SidebarNavItem
  active: boolean
  onClick: () => void
}) {
  const content = (
    <>
      <ItemIcon src={sidebarIcons[item.icon]} alt="" />
      <ItemLabel>{item.label}</ItemLabel>
    </>
  )

  // 화면이 없는 메뉴는 링크 대신 비활성 항목으로 노출한다.
  if (!item.to) {
    return <DisabledItem aria-disabled="true">{content}</DisabledItem>
  }

  return (
    <NavItem to={item.to} onClick={onClick} $active={active}>
      {content}
    </NavItem>
  )
}

// 상세/생성 같은 하위 경로도 같은 메뉴의 활성 범위로 본다.
function isActiveRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

const Layer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
`

const Overlay = styled.button`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.24);
  cursor: pointer;
`

const Panel = styled.aside`
  position: relative;
  width: 400px;
  max-width: 100vw;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 0 20px 20px 0;
  box-shadow: 4px 0px 10px 0px rgba(0, 0, 0, 0.1);

  @media (max-width: 480px) {
    width: 100vw;
    border-radius: 0;
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 32px;
  left: 44px;
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
`

const CloseIcon = styled.img`
  width: 36px;
  height: 36px;
`

const Profile = styled.div`
  position: absolute;
  top: 92px;
  left: 0;
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 0 44px;
`

const Avatar = styled.div`
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  border-radius: 53px;
  background: ${({ theme }) => theme.colors.avatar};
`

const UserName = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
`

const Nav = styled.nav`
  position: absolute;
  top: 222px;
  left: 0;
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: calc(56px - 32px);
`

const NavItem = styled(Link, {
  shouldForwardProp: (prop) => prop !== '$active',
})<{ $active: boolean }>`
  display: flex;
  min-height: 32px;
  align-items: center;
  gap: 12px;
  padding: 0 44px;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.primary : theme.colors.text};
  text-decoration: none;
`

const DisabledItem = styled.div`
  display: flex;
  min-height: 32px;
  align-items: center;
  gap: 12px;
  padding: 0 44px;
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.4;
  cursor: default;
`

const ItemIcon = styled.img`
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
`

const ItemLabel = styled.span`
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
`
