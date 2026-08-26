import type { ReactNode } from 'react'
import styled from '@emotion/styled'
import chevronDown from '@/shared/ui/assets/chevron-down.svg'
import doneBadge from './assets/badge-done.svg'
import todoBadge from './assets/badge-todo.svg'

interface ReservationFormSectionProps {
  title: string
  // 완료 배지 표시 여부. undefined면 배지를 그리지 않는다.
  complete?: boolean
  collapsed: boolean
  onToggle: () => void
  children: ReactNode
}

// 접이식 섹션 카드. 헤더(제목 + 완료/미완료 배지 + chevron) + 접히는 본문.
export function ReservationFormSection({
  title,
  complete,
  collapsed,
  onToggle,
  children,
}: ReservationFormSectionProps) {
  return (
    <Card>
      <Header
        type="button"
        aria-expanded={!collapsed}
        onClick={onToggle}
        $collapsed={collapsed}
      >
        <HeaderLead>
          {/* 상태 배지는 펼침/접힘 모두 노출된다(Figma 4672:8518). */}
          {complete !== undefined &&
            (complete ? (
              <Badge $done>
                <BadgeIcon src={doneBadge} alt="" aria-hidden="true" />
                완료
              </Badge>
            ) : (
              <Badge>
                <BadgeIcon src={todoBadge} alt="" aria-hidden="true" />
                미완료
              </Badge>
            ))}
          <Title>{title}</Title>
        </HeaderLead>
        {/* 다운로드한 chevron은 위(^) 방향 → 펼침=0deg(위), 접힘=180deg(아래). */}
        <Chevron src={chevronDown} alt="" aria-hidden="true" $up={!collapsed} />
      </Header>
      {!collapsed && <Body>{children}</Body>}
    </Card>
  )
}

// overflow:hidden 을 쓰지 않는다(am/pm 드롭다운이 섹션 밖으로 나와야 함).
// 모서리는 헤더/본문이 각자 처리한다.
const Card = styled.section`
  display: flex;
  flex-direction: column;
`

const Header = styled.button<{ $collapsed: boolean }>`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 16px 40px;
  border: 0;
  border-radius: ${({ $collapsed }) =>
    $collapsed ? '20px' : '20px 20px 0 0'};
  background: #dddde3;
  cursor: pointer;
  font: inherit;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -3px;
  }
`

const HeaderLead = styled.div`
  display: flex;
  align-items: center;
  gap: 26px;
`

const Title = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 28px;
  font-weight: 500;
  line-height: 1.2;
`

const Badge = styled.span<{ $done?: boolean }>`
  display: inline-flex;
  height: 48px;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 12px;
  background: ${({ theme, $done }) =>
    $done ? '#A9ECDD' : theme.colors.background};
  color: ${({ $done }) => ($done ? '#00B48A' : '#5C5C68')};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const BadgeIcon = styled.img`
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
`

const Chevron = styled.img<{ $up: boolean }>`
  width: 32px;
  height: 32px;
  transition: transform 0.15s ease;
  transform: rotate(${({ $up }) => ($up ? '0deg' : '180deg')});
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px 40px 40px;
  border-radius: 0 0 20px 20px;
  background: ${({ theme }) => theme.colors.surface};
`
