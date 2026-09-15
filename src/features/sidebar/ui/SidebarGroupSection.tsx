import { Link } from 'react-router-dom'
import styled from '@emotion/styled'
import chevronDownIcon from './assets/chevron-down.svg'
import { SidebarIcon } from './SidebarIcon'
import type { SidebarGroup } from '../model/types'

interface SidebarGroupSectionProps {
  group: SidebarGroup
  open: boolean
  onToggle: () => void
  onNavigate: () => void
}

// Figma `대분류 / *` + `하위메뉴 / *`. 헤더는 펼침만 하고 이동은 하위 항목이 한다.
export function SidebarGroupSection({
  group,
  open,
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
        <Chevron src={chevronDownIcon} alt="" $open={open} />
      </GroupHeader>

      {open && (
        <SubList id={listId}>
          {group.items.map((item) =>
            item.to ? (
              <SubLink key={item.id} to={item.to} onClick={onNavigate}>
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
      )}
    </Section>
  )
}

const Section = styled.div`
  display: flex;
  flex-direction: column;
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

const Chevron = styled.img<{ $open: boolean }>`
  position: absolute;
  top: 16px;
  left: 300px;
  width: 24px;
  height: 24px;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
`

const SubList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
`

const subItemLayout = `
  display: flex;
  align-items: center;
  padding: 11px 36px 11px 92px;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const SubLink = styled(Link)`
  ${subItemLayout}
  color: ${({ theme }) => theme.colors.subMenuText};
  text-decoration: none;
`

const DisabledSubItem = styled.span`
  ${subItemLayout}
  color: ${({ theme }) => theme.colors.subMenuText};
  cursor: default;
  opacity: 0.4;
`
