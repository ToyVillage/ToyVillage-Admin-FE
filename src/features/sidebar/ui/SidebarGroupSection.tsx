import { Link } from 'react-router-dom'
import styled from '@emotion/styled'
import { motionDuration, motionEasing } from '@/shared/ui'
import { SidebarIcon } from './SidebarIcon'
import type { SidebarGroup } from '../model/types'

interface SidebarGroupSectionProps {
  group: SidebarGroup
  open: boolean
  // 현재 라우트와 일치하는 하위 항목 id. 없으면 null.
  activeItemId: string | null
  onToggle: () => void
  onNavigate: () => void
}

// Figma `대분류 / *` + `하위메뉴 / *`. 헤더는 펼침만 하고 이동은 하위 항목이 한다.
export function SidebarGroupSection({
  group,
  open,
  activeItemId,
  onToggle,
  onNavigate,
}: SidebarGroupSectionProps) {
  const listId = `sidebar-group-${group.id}`

  return (
    <Section>
      <GroupHeader
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={onToggle}
      >
        <SidebarIcon name={group.icon} />
        <GroupLabel>{group.label}</GroupLabel>
        <Chevron viewBox="0 0 24 24" aria-hidden="true" $open={open}>
          <path d="M3.2 7.2 12 16.8 20.8 7.2" />
        </Chevron>
      </GroupHeader>

      {/* 접힌 상태도 DOM 에 남겨 높이를 0 으로 접는다(grid 0fr → 1fr).
          닫힌 동안에는 visibility 로 초점이 들어가지 않게 한다. */}
      <SubListFrame id={listId} $open={open}>
        <SubList $open={open}>
          {group.items.map((item) =>
            item.to ? (
              <SubLink
                key={item.id}
                to={item.to}
                onClick={onNavigate}
                $active={item.id === activeItemId}
              >
                {item.label}
              </SubLink>
            ) : (
              // 화면이 없는 메뉴는 링크 대신 비활성 항목으로 노출한다.
              <DisabledSubItem key={item.id} aria-disabled="true">
                {item.label}
              </DisabledSubItem>
            ),
          )}
        </SubList>
      </SubListFrame>
    </Section>
  )
}

const Section = styled.div`
  display: flex;
  flex-direction: column;
  /* Nav 가 스크롤 컨테이너라 항목이 눌려 찌그러지지 않게 한다. */
  flex-shrink: 0;
`

const GroupHeader = styled.button`
  position: relative;
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 12px;
  padding: 12px 36px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  text-align: left;
`

const GroupLabel = styled.span`
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
`

// Figma 는 24×24 chevron 을 360 폭 항목 기준 (300, 16) 에 둔다 — 오른쪽에서 36px 지점이다.
// 폭이 좁아져도 항목 안에 남도록 오른쪽 기준으로 붙인다.
const Chevron = styled.svg<{ $open: boolean }>`
  position: absolute;
  top: 16px;
  right: 36px;
  width: 24px;
  height: 24px;
  fill: none;
  stroke: ${({ theme }) => theme.colors.menuChevron};
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.4;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  transition: transform ${motionDuration.reveal}ms ${motionEasing.enter};
`

const SubListFrame = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
  transition: grid-template-rows ${motionDuration.reveal}ms
    ${motionEasing.enter};
`

const SubList = styled.div<{ $open: boolean }>`
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 4px;
  /* border-box 라 접힌 상태에 세로 padding 이 남으면 그만큼 높이가 남는다. */
  padding: ${({ $open }) => ($open ? '4px 0' : '0')};
  overflow: hidden;
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition:
    padding ${motionDuration.reveal}ms ${motionEasing.enter},
    visibility ${motionDuration.reveal}ms;
`

const subItemLayout = `
  display: flex;
  align-items: center;
  padding: 11px 36px 11px 92px;
  border-radius: 12px;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

// Figma `sidebar / 하위메뉴 항목`(1702:15280)의 `상태=선택` 은 blue 밴드 + blue 텍스트다.
const SubLink = styled(Link, {
  shouldForwardProp: (prop) => prop !== '$active',
})<{ $active: boolean }>`
  ${subItemLayout}
  background: ${({ theme, $active }) =>
    $active ? theme.colors.accentBg : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.accent : theme.colors.subMenuText};
  text-decoration: none;
  transition:
    background ${motionDuration.color}ms ${motionEasing.enter},
    color ${motionDuration.color}ms ${motionEasing.enter};
`

const DisabledSubItem = styled.span`
  ${subItemLayout}
  color: ${({ theme }) => theme.colors.subMenuText};
  cursor: default;
  opacity: 0.4;
`
