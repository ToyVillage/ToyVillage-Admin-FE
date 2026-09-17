import { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import { useLocation } from 'react-router-dom'
import { readSessionUser } from '@/shared/api/session'
import chevronLeftIcon from '@/shared/ui/assets/chevron-left.svg'
import { mockSidebarDashboardItem, mockSidebarGroups } from '../model/mock'
import { useSidebarStore } from '../model/useSidebarStore'
import { SidebarGroupSection } from './SidebarGroupSection'
import { SidebarItem } from './SidebarItem'

export function Sidebar() {
  const { pathname } = useLocation()
  const isOpen = useSidebarStore((state) => state.isOpen)
  const close = useSidebarStore((state) => state.close)
  const panelRef = useRef<HTMLDivElement>(null)
  // 아코디언은 한 번에 하나만 펼친다(Figma variant `열린메뉴=*`).
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)

  // 사이드바를 열 때(또는 열린 채 경로가 바뀔 때) 현재 라우트의 대분류를 펼쳐 둔다.
  // 렌더 중 상태 보정이라 effect 가 필요 없다.
  const routeKey = isOpen ? pathname : null
  const [prevRouteKey, setPrevRouteKey] = useState<string | null>(routeKey)
  if (prevRouteKey !== routeKey) {
    setPrevRouteKey(routeKey)
    setOpenGroupId(routeKey ? findActiveMenu(routeKey).groupId : null)
  }

  // 현재 라우트와 일치하는 하위 항목만 선택 상태로 표시한다(Figma `상태=선택`).
  const activeItemId = findActiveMenu(pathname).itemId

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

  // 사용자 조회 API가 없어 로그인 응답으로 저장한 세션 사용자를 쓴다.
  // 열 때마다 읽으므로 다른 계정으로 다시 로그인해도 바로 반영된다.
  // 토큰만 남고 사용자 정보가 없는 세션(이전 로그인)은 이름 대신 기본 문구를 보인다.
  const userName = readSessionUser()?.name ?? '사용자'

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
          <Avatar role="img" aria-label={`${userName} 프로필`} />
          <UserName>{userName}</UserName>
        </Profile>

        <Nav aria-label="주요 메뉴">
          <SidebarItem
            item={mockSidebarDashboardItem}
            active={pathname === mockSidebarDashboardItem.to}
            onClick={close}
          />
          {mockSidebarGroups.map((group) => (
            <SidebarGroupSection
              key={group.id}
              group={group}
              open={openGroupId === group.id}
              activeItemId={activeItemId}
              onToggle={() =>
                setOpenGroupId((current) =>
                  current === group.id ? null : group.id,
                )
              }
              onNavigate={close}
            />
          ))}
        </Nav>
      </Panel>
    </Layer>
  )
}

// 상세/생성 같은 하위 경로도 같은 메뉴의 범위로 본다.
// 여러 항목이 걸리면 더 긴(구체적인) 경로를 고른다.
function findActiveMenu(pathname: string): {
  groupId: string | null
  itemId: string | null
} {
  let best: { groupId: string; itemId: string; length: number } | null = null

  for (const group of mockSidebarGroups) {
    for (const item of group.items) {
      if (!item.to) continue
      const matched = pathname === item.to || pathname.startsWith(`${item.to}/`)
      if (!matched) continue
      if (!best || item.to.length > best.length) {
        best = { groupId: group.id, itemId: item.id, length: item.to.length }
      }
    }
  }

  return { groupId: best?.groupId ?? null, itemId: best?.itemId ?? null }
}

const Layer = styled.div`
  position: fixed;
  z-index: 20;
  inset: 0;
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

// 패널은 항상 화면 높이에 맞춘다. 메뉴가 길어지면 패널이 밖으로 나가지 않고 Nav 만 스크롤한다.
const Panel = styled.aside`
  position: relative;
  width: 400px;
  max-width: 100vw;
  height: 100dvh;
  overflow: hidden;
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
  left: 36px;
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
  padding: 0 36px;
`

const Avatar = styled.div`
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  border-radius: 1000px;
  background: ${({ theme }) => theme.colors.avatar};
`

const UserName = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
`

// Figma 는 메뉴 묶음을 패널 기준 절대 위치(20, 222)에 둔다.
// 아코디언이 펼쳐져 패널 높이를 넘으면 이 영역만 세로로 스크롤한다.
const Nav = styled.nav`
  position: absolute;
  top: 222px;
  bottom: 0;
  left: 20px;
  display: flex;
  /* 패널 폭 400 에서는 360 이고, 폭이 좁아지면 좌우 20px 여백을 지키며 함께 줄어든다. */
  width: calc(100% - 40px);
  flex-direction: column;
  overflow-y: auto;
  gap: 8px;
  padding-bottom: 32px;
  overscroll-behavior: contain;
`
