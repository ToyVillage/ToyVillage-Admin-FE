import { useEffect, useRef, useState } from 'react'
import styled from '@emotion/styled'
import type { Team, TeamMember } from '../model/types'
import { TeamMemberTable } from './TeamMemberTable'

interface TeamDetailPanelProps {
  team: Team
  /** 팀원 목록. 멤버 조회와 직원 목록을 합친 결과를 화면에서 넘긴다. */
  members: TeamMember[]
  onRename: (name: string) => void
  onDeleteClick: () => void
  onAddMemberClick: () => void
  onRemoveMember: (memberId: number) => void
}

// Figma `team / detail panel`(1770:16719) — 팀 제목·액션, 팀원 섹션, 팀원 표.
// 팀명 인라인 수정 모드(1760:17881)를 자체 상태로 가진다.
export function TeamDetailPanel({
  team,
  members,
  onRename,
  onDeleteClick,
  onAddMemberClick,
  onRemoveMember,
}: TeamDetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(team.name)
  const inputRef = useRef<HTMLInputElement>(null)

  // 다른 팀으로 바꾸면 수정 모드를 풀고 편집 중이던 이름은 버린다.
  const [prevTeamId, setPrevTeamId] = useState(team.id)
  if (prevTeamId !== team.id) {
    setPrevTeamId(team.id)
    setEditing(false)
    setDraftName(team.name)
  }

  useEffect(() => {
    if (!editing) return
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.setSelectionRange(input.value.length, input.value.length)
  }, [editing])

  const canSave = draftName.trim().length > 0

  function startEditing() {
    setDraftName(team.name)
    setEditing(true)
  }

  function cancelEditing() {
    setDraftName(team.name)
    setEditing(false)
  }

  function save() {
    if (!canSave) return
    onRename(draftName.trim())
    setEditing(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      save()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
    }
  }

  return (
    <Panel>
      <Header>
        <TitleRow>
          {editing ? (
            <NameInput
              ref={inputRef}
              value={draftName}
              aria-label="팀 이름"
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <Title>{team.name}</Title>
          )}

          <Actions>
            {editing ? (
              <>
                <SaveButton type="button" disabled={!canSave} onClick={save}>
                  저장
                </SaveButton>
                <GhostButton type="button" onClick={cancelEditing}>
                  취소
                </GhostButton>
              </>
            ) : (
              <>
                <GhostButton type="button" onClick={startEditing}>
                  팀명 변경
                </GhostButton>
                <DangerButton type="button" onClick={onDeleteClick}>
                  팀 삭제
                </DangerButton>
              </>
            )}
          </Actions>
        </TitleRow>
      </Header>

      <Divider />

      <SectionHeaderRow>
        <LabelGroup>
          <SectionLabel>팀원</SectionLabel>
          <SectionCount>{members.length}명</SectionCount>
        </LabelGroup>
        <AddMemberButton type="button" onClick={onAddMemberClick}>
          ＋&nbsp;&nbsp;인원 추가하기
        </AddMemberButton>
      </SectionHeaderRow>

      <TeamMemberTable members={members} onRemove={onRemoveMember} />
    </Panel>
  )
}

const Panel = styled.section`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 20px;
  padding: 32px;
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
`

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

// 기본 상태는 제목 높이(48), 수정 모드는 입력 높이(60)를 그대로 따른다.
const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 40px;
  font-weight: 600;
  line-height: 1.2;
`

const NameInput = styled.input`
  width: 420px;
  height: 60px;
  max-width: 100%;
  padding: 10px 20px;
  border: 2px solid ${({ theme }) => theme.colors.inkSurface};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
  outline: 0;
`

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
`

const pillButton = `
  display: inline-flex;
  height: 48px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  border-radius: 100px;
  cursor: pointer;
  font: inherit;
  font-size: 20px;
  line-height: 1.2;
  white-space: nowrap;
`

const GhostButton = styled.button`
  ${pillButton}
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textStrong};
  font-weight: 500;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const DangerButton = styled.button`
  ${pillButton}
  border: 1px solid ${({ theme }) => theme.colors.dangerBorder};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.dangerText};
  font-weight: 500;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const SaveButton = styled.button`
  ${pillButton}
  border: 0;
  background: ${({ theme }) => theme.colors.inkSurface};
  color: ${({ theme }) => theme.colors.surface};
  font-weight: 600;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.dividerFaint};
`

const SectionHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 10px;
`

const LabelGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
`

const SectionLabel = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
`

const SectionCount = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const AddMemberButton = styled.button`
  ${pillButton}
  border: 0;
  background: ${({ theme }) => theme.colors.inkSurface};
  color: ${({ theme }) => theme.colors.surface};
  font-size: 22px;
  font-weight: 600;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`
