import styled from '@emotion/styled'
import { Skeleton } from '@/shared/ui'
import type { Team } from '../model/types'

interface TeamRailProps {
  teams: Team[]
  selectedId: number | null
  onSelect: (teamId: number) => void
  onAddClick: () => void
  // 첫 조회 중. 라벨·`팀 추가하기`는 그대로 두고 팀 이름·인원 자리만 막대로 채운다.
  loading?: boolean
}

// Figma 스켈레톤(2238:18812) 팀 행 막대 폭.
const loadingRowWidths = [140, 90, 180, 96]

// Figma `team / rail`(1770:16527) — 좌측 팀 목록과 하단 `팀 추가하기`.
export function TeamRail({
  teams,
  selectedId,
  onSelect,
  onAddClick,
  loading = false,
}: TeamRailProps) {
  return (
    <Rail>
      <List>
        <Header>
          <HeaderLabel>팀</HeaderLabel>
          {loading ? (
            <Skeleton width={30} height={18} />
          ) : (
            <HeaderCount>{teams.length}개</HeaderCount>
          )}
        </Header>
        <Rows>
          {loading &&
            loadingRowWidths.map((width, index) => (
              <li key={index}>
                <LoadingRow>
                  <Skeleton width={width} height={20} />
                  <Skeleton width={36} height={18} />
                </LoadingRow>
              </li>
            ))}
          {teams.map((team) => {
            const selected = team.id === selectedId
            return (
              <li key={team.id}>
                <Row
                  type="button"
                  data-testid="team-rail-row"
                  $selected={selected}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(team.id)}
                >
                  <RowName $selected={selected}>{team.name}</RowName>
                  <RowCount $selected={selected}>{team.memberCount}명</RowCount>
                </Row>
              </li>
            )
          })}
        </Rows>
      </List>

      <Footer>
        <Divider />
        <AddButton type="button" onClick={onAddClick}>
          ＋&nbsp;&nbsp;팀 추가하기
        </AddButton>
      </Footer>
    </Rail>
  )
}

const LoadingRow = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
`

const Rail = styled.nav`
  display: flex;
  width: 400px;
  flex: 0 0 400px;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
`

const HeaderLabel = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
`

const HeaderCount = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Rows = styled.ul`
  display: flex;
  margin: 0;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  list-style: none;
`

const Row = styled.button<{ $selected: boolean }>`
  display: flex;
  width: 100%;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.inkSurface : theme.colors.surface};
  cursor: pointer;
  font: inherit;
  text-align: left;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

// 선택 행은 검은 배경이므로 이름은 흰색, 인원수는 한 단계 밝은 회색이다.
const RowName = styled.span<{ $selected: boolean }>`
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.surface : theme.colors.textStrong};
  font-size: 24px;
  font-weight: ${({ $selected }) => ($selected ? 600 : 500)};
  line-height: 1.2;
`

const RowCount = styled.span<{ $selected: boolean }>`
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.textDim : theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.dividerFaint};
`

const AddButton = styled.button`
  display: flex;
  height: 48px;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surfaceRaised};
  color: ${({ theme }) => theme.colors.textStrong};
  cursor: pointer;
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`
