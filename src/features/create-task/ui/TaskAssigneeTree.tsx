import { forwardRef, useMemo, useState } from 'react'
import styled from '@emotion/styled'
import type { TaskMember, TaskTeam } from '@/entities/task'

type CheckState = 'on' | 'off' | 'mixed'

interface TaskAssigneeTreeProps {
  teams: TaskTeam[]
  members: TaskMember[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
}

// Figma `assignee section`(yot 1:3694). `전체 직원` 한 행 + 팀 행 + 펼쳐진 직원 행으로 이뤄진
// 3상태 체크박스 트리다. 펼침 상태는 선택과 독립이며, 선택이 있는 팀은 펼친 채로 시작한다.
export const TaskAssigneeTree = forwardRef<
  HTMLInputElement,
  TaskAssigneeTreeProps
>(function TaskAssigneeTree({ teams, members, selectedIds, onChange }, ref) {
  const membersByTeam = useMemo(
    () =>
      new Map(
        teams.map((team) => [
          team.id,
          members.filter((member) => member.teamId === team.id),
        ]),
      ),
    [members, teams],
  )
  // 진입 시에는 팀이 모두 접혀 있다. 수정 화면에서 담당자가 복원돼도 마찬가지이며
  // 선택 상태는 팀 행의 3상태 체크박스와 `n/m명` 카운트로 읽는다(2026-09-08 개발자 결정).
  const [expandedTeamIds, setExpandedTeamIds] = useState(
    () => new Set<string>(),
  )

  const selected = useMemo(() => new Set(selectedIds), [selectedIds])
  const allState = checkState(selected.size, members.length)

  function replaceSelection(nextIds: Iterable<string>) {
    // 트리 순서를 유지해 `외 N명` 의 대표 담당자가 화면 순서와 같아지게 한다.
    const nextSet = new Set(nextIds)
    onChange(members.filter((member) => nextSet.has(member.id)).map((m) => m.id))
  }

  function toggleAll() {
    replaceSelection(
      allState === 'off' ? members.map((member) => member.id) : [],
    )
  }

  function toggleTeam(teamId: string) {
    const teamMembers = membersByTeam.get(teamId) ?? []
    const teamState = checkState(
      teamMembers.filter((member) => selected.has(member.id)).length,
      teamMembers.length,
    )
    const nextIds = new Set(selected)

    for (const member of teamMembers) {
      if (teamState === 'off') nextIds.add(member.id)
      else nextIds.delete(member.id)
    }

    replaceSelection(nextIds)
  }

  function toggleMember(memberId: string) {
    const nextIds = new Set(selected)
    if (nextIds.has(memberId)) nextIds.delete(memberId)
    else nextIds.add(memberId)

    replaceSelection(nextIds)
  }

  function toggleExpanded(teamId: string) {
    setExpandedTeamIds((current) => {
      const next = new Set(current)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }

  return (
    <Card>
      <Label id="task-assignee-label">담당자를 선택해주세요</Label>
      <Tree role="tree" aria-labelledby="task-assignee-label">
        <AllRow role="treeitem" aria-checked={ariaChecked(allState)}>
          <Checkbox
            ref={ref}
            type="checkbox"
            data-state={allState}
            checked={allState === 'on'}
            aria-label={`전체 직원 ${selected.size}/${members.length}명`}
            onChange={toggleAll}
          />
          <RowLabel>전체 직원</RowLabel>
          <Count>
            {selected.size}/{members.length}명
          </Count>
        </AllRow>

        {teams.map((team) => {
          const teamMembers = membersByTeam.get(team.id) ?? []
          const selectedCount = teamMembers.filter((member) =>
            selected.has(member.id),
          ).length
          const teamState = checkState(selectedCount, teamMembers.length)
          const expanded = expandedTeamIds.has(team.id)

          return (
            <TeamGroup key={team.id} role="group">
              <Row role="treeitem" aria-expanded={expanded} aria-checked={ariaChecked(teamState)}>
                <Checkbox
                  type="checkbox"
                  data-state={teamState}
                  checked={teamState === 'on'}
                  aria-label={`${team.name} ${selectedCount}/${teamMembers.length}명`}
                  onChange={() => toggleTeam(team.id)}
                />
                <RowLabel>{team.name}</RowLabel>
                <Count>
                  {selectedCount}/{teamMembers.length}명
                </Count>
                <ExpandButton
                  type="button"
                  aria-label={`${team.name} ${expanded ? '접기' : '펼치기'}`}
                  onClick={() => toggleExpanded(team.id)}
                >
                  <Chevron
                    data-expanded={expanded}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="m9 4 8 8-8 8" />
                  </Chevron>
                </ExpandButton>
              </Row>

              {expanded &&
                teamMembers.map((member) => (
                  <MemberRow
                    key={member.id}
                    role="treeitem"
                    aria-checked={selected.has(member.id)}
                  >
                    <Checkbox
                      type="checkbox"
                      data-state={selected.has(member.id) ? 'on' : 'off'}
                      checked={selected.has(member.id)}
                      aria-label={member.label}
                      onChange={() => toggleMember(member.id)}
                    />
                    <RowLabel>{member.label}</RowLabel>
                  </MemberRow>
                ))}
            </TeamGroup>
          )
        })}
      </Tree>
    </Card>
  )
})

function checkState(selectedCount: number, total: number): CheckState {
  if (total > 0 && selectedCount === total) return 'on'
  return selectedCount > 0 ? 'mixed' : 'off'
}

function ariaChecked(state: CheckState): boolean | 'mixed' {
  if (state === 'mixed') return 'mixed'
  return state === 'on'
}

// Figma 체크박스: 미선택은 테두리 박스, 선택은 파란 채움 + 흰 체크,
// 부분 선택은 파란 채움 + 흰 가로 막대. DataTable 의 선택 체크박스와 같은 계열이다.
const checkboxOff =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26' fill='none'%3E%3Crect x='0.75' y='0.75' width='24.5' height='24.5' rx='5.25' fill='white' stroke='%23C6C6CE' stroke-width='1.5'/%3E%3C/svg%3E\")"

const checkboxOn =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26' fill='none'%3E%3Crect width='26' height='26' rx='6' fill='%234952FF'/%3E%3Cpath d='M11.05 18.5 5.85 13.3l1.55-1.55 3.65 3.65 7.55-7.55 1.55 1.55z' fill='white'/%3E%3C/svg%3E\")"

const checkboxMixed =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26' fill='none'%3E%3Crect width='26' height='26' rx='6' fill='%234952FF'/%3E%3Crect x='6' y='12' width='14' height='2.5' rx='1.25' fill='white'/%3E%3C/svg%3E\")"

// fieldset 은 block 으로 둔다. flex 로 두면 legend 가 padding 을 무시하고
// 카드 최상단(border box)에 붙는다 — 아래 Label 의 float 과 짝을 이룬다.
const Card = styled.fieldset`
  display: block;
  width: 100%;
  margin: 0;
  padding: 40px;
  border: 0;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  @media (max-width: 980px) {
    padding: 24px;
  }
`

// float + width 100% 로 legend 를 일반 흐름에 되돌려 카드 padding 안에 들어오게 한다.
const Label = styled.legend`
  float: left;
  width: 100%;
  margin: 0 0 32px;
  padding: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
`

// 행 높이 56 + gap 16 = Figma pitch 72.
const Tree = styled.div`
  display: flex;
  clear: both;
  flex-direction: column;
  gap: 16px;
`

const Row = styled.div`
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: 16px;

  @media (max-width: 980px) {
    min-height: 0;
    flex-wrap: wrap;
    padding: 8px 0;
    row-gap: 4px;
  }
`

// `전체 직원` 행 아래에만 구분선이 있다. Figma 는 pitch 바닥(@y=72)에 그어져 있어
// 행 높이를 늘리지 않도록 gap 안쪽에 pseudo-element 로 그린다.
const AllRow = styled(Row)`
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    bottom: -16px;
    left: 0;
    height: 1px;
    background: ${({ theme }) => theme.colors.textFaint};
  }
`

const TeamGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const MemberRow = styled(Row)`
  padding-left: 44px;
`

const RowLabel = styled.span`
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;
`

const Count = styled.span`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.3;

  @media (max-width: 980px) {
    width: 100%;
    margin-left: 42px;
  }
`

const Checkbox = styled.input`
  appearance: none;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  margin: 0;
  background: ${checkboxOff} center / 26px no-repeat;
  cursor: pointer;

  &[data-state='on'] {
    background: ${checkboxOn} center / 26px no-repeat;
  }

  &[data-state='mixed'] {
    background: ${checkboxMixed} center / 26px no-repeat;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const ExpandButton = styled.button`
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textGuide};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
    border-radius: 4px;
  }
`

// 접힘 `>`(6×14) / 펼침 `⌄`(14×6) — 같은 chevron 을 90° 돌려 쓴다.
const Chevron = styled.svg`
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
  transition: transform 120ms ease;

  &[data-expanded='true'] {
    transform: rotate(90deg);
  }
`
