import styled from '@emotion/styled'
import type { TeamMember } from '../model/types'

interface TeamMemberTableProps {
  members: TeamMember[]
  onRemove: (memberId: number) => void
}

// Figma `team / member table`(1770:16153) — 이름·직급 두 열과 행별 `제거`.
// 팀원이 0명이면 머리행 대신 빈 상태(1760:17847)를 보여준다.
export function TeamMemberTable({ members, onRemove }: TeamMemberTableProps) {
  if (members.length === 0) {
    return (
      <Table>
        <Empty>
          <EmptyTitle>아직 팀원이 없어요</EmptyTitle>
          <EmptyDescription>
            인원 추가하기를 눌러 이 팀에서 일할 직원을 넣어 주세요
          </EmptyDescription>
        </Empty>
      </Table>
    )
  }

  return (
    <Table>
      <Head>
        <NameCell>
          <HeadLabel>이름</HeadLabel>
        </NameCell>
        <PositionCell>
          <HeadLabel>직급</HeadLabel>
        </PositionCell>
      </Head>
      <Divider />
      <Rows>
        {members.map((member) => (
          <Row key={member.id} data-testid="team-member-row">
            <NameCell>
              <Name>{member.name}</Name>
            </NameCell>
            <PositionCell>
              <Position>{member.position ?? '사원'}</Position>
            </PositionCell>
            <RemoveButton
              type="button"
              aria-label={`${member.name} 제거`}
              onClick={() => onRemove(member.id)}
            >
              제거
            </RemoveButton>
          </Row>
        ))}
      </Rows>
    </Table>
  )
}

const Table = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
`

const Head = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 10px 12px;
`

const Rows = styled.ul`
  display: flex;
  margin: 0;
  flex-direction: column;
  padding: 0;
  list-style: none;
`

const Row = styled.li`
  display: flex;
  height: 76px;
  align-items: center;
  padding: 10px;
`

const NameCell = styled.div`
  display: flex;
  width: 260px;
  flex: 0 0 260px;
  align-items: center;
  padding: 10px;
`

const PositionCell = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  padding: 10px;
`

const HeadLabel = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.dividerFaint};
`

const Name = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const Position = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`

const RemoveButton = styled.button`
  display: inline-flex;
  height: 48px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  cursor: pointer;
  font: inherit;
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Empty = styled.div`
  display: flex;
  height: 360px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px;
`

const EmptyTitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
`

const EmptyDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 22px;
  font-weight: 500;
  line-height: 1.2;
`
