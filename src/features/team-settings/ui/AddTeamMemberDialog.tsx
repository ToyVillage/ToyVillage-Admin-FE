import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import type { TeamMember } from '@/entities/team'

interface AddTeamMemberDialogProps {
  teamName: string
  /** 그 팀에 아직 속하지 않은 직원만 넘긴다. */
  candidates: TeamMember[]
  onCancel: () => void
  onSubmit: (memberIds: number[]) => void
}

// Figma `modal / 팀원 추가`(1760:18236 초기 / 1760:18367 선택됨).
// 고른 직원은 목록 맨 위 `추가할 인원 N명` 그룹으로 올라가고, 확정 버튼 문구가 `N명 추가` 로 바뀐다.
export function AddTeamMemberDialog({
  teamName,
  candidates,
  onCancel,
  onSubmit,
}: AddTeamMemberDialogProps) {
  const titleId = useId()
  const searchId = useId()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const appRoot = document.getElementById('root')
    appRoot?.setAttribute('inert', '')
    appRoot?.setAttribute('aria-hidden', 'true')

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      appRoot?.removeAttribute('inert')
      appRoot?.removeAttribute('aria-hidden')
    }
  }, [onCancel])

  // 선택한 직원은 순서를 유지한 채 위 그룹으로 옮긴다.
  const selected = selectedIds
    .map((id) => candidates.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is TeamMember => candidate != null)

  // 검색은 아직 고르지 않은 `전체 직원` 그룹에만 건다.
  const trimmedKeyword = keyword.trim()
  const rest = candidates.filter(
    (candidate) =>
      !selectedIds.includes(candidate.id) &&
      (trimmedKeyword === '' || candidate.name.includes(trimmedKeyword)),
  )

  function toggle(memberId: number) {
    setSelectedIds((ids) =>
      ids.includes(memberId)
        ? ids.filter((id) => id !== memberId)
        : [...ids, memberId],
    )
  }

  return createPortal(
    <Overlay onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <Dialog role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <Header>
          <Title id={titleId}>팀원 추가</Title>
          <Subtitle>{teamName}에 추가할 직원을 골라 주세요</Subtitle>
        </Header>

        <VisuallyHidden htmlFor={searchId}>이름으로 검색</VisuallyHidden>
        <Search
          id={searchId}
          type="search"
          value={keyword}
          placeholder="이름으로 검색"
          onChange={(event) => setKeyword(event.target.value)}
        />

        <StaffList>
          {selected.length > 0 && (
            <>
              <GroupLabel $selected>추가할 인원 {selected.length}명</GroupLabel>
              {selected.map((member) => (
                <StaffRow key={member.id} data-testid="selected-staff-row">
                  <Avatar aria-hidden="true" />
                  <Name>{member.name}</Name>
                  <RankCell>
                    <Rank>{member.position ?? '사원'}</Rank>
                  </RankCell>
                  <DeselectButton
                    type="button"
                    aria-label={`${member.name} 선택 취소`}
                    onClick={() => toggle(member.id)}
                  >
                    선택 취소
                  </DeselectButton>
                </StaffRow>
              ))}
              <GroupDivider />
              <GroupLabel>전체 직원</GroupLabel>
            </>
          )}

          {rest.map((member) => (
            <StaffRow key={member.id} data-testid="staff-row">
              <Avatar aria-hidden="true" />
              <Name>{member.name}</Name>
              <RankCell>
                <Rank>{member.position ?? '사원'}</Rank>
              </RankCell>
              <SelectButton
                type="button"
                aria-label={`${member.name} 추가`}
                onClick={() => toggle(member.id)}
              >
                추가
              </SelectButton>
            </StaffRow>
          ))}
        </StaffList>

        <Divider />

        <Actions>
          <CancelButton type="button" onClick={onCancel}>
            취소
          </CancelButton>
          <SubmitButton
            type="button"
            disabled={selected.length === 0}
            onClick={() => onSubmit(selectedIds)}
          >
            {selected.length === 0 ? '추가 완료' : `${selected.length}명 추가`}
          </SubmitButton>
        </Actions>
      </Dialog>
    </Overlay>,
    document.body,
  )
}

const Overlay = styled.div`
  position: fixed;
  z-index: 21;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.5);
`

const Dialog = styled.div`
  display: flex;
  width: min(calc(100% - 40px * 2), 640px);
  max-height: calc(100vh - 40px * 2);
  flex-direction: column;
  gap: 24px;
  padding: 36px 40px 32px;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  font-family: ${({ theme }) => theme.font.body};
`

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
`

const Title = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
`

const Subtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
`

const VisuallyHidden = styled.label`
  position: absolute;
  overflow: hidden;
  width: 1px;
  height: 1px;
  clip-path: inset(50%);
  white-space: nowrap;
`

const Search = styled.input`
  height: 56px;
  flex: 0 0 auto;
  padding: 10px 20px;
  border: 0;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textStrong};
  font: inherit;
  font-size: 22px;
  font-weight: 500;
  outline: 0;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textDim};
  }
`

const StaffList = styled.div`
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  overflow-y: auto;
`

const GroupLabel = styled.p<{ $selected?: boolean }>`
  margin: 0;
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.textStrong : theme.colors.textGuide};
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
`

const GroupDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.dividerFaint};
`

const StaffRow = styled.div`
  display: flex;
  height: 64px;
  flex: 0 0 auto;
  align-items: center;
  gap: 16px;
  padding: 10px;
`

const Avatar = styled.div`
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  border-radius: 100px;
  background: ${({ theme }) => theme.colors.avatarMuted};
`

const Name = styled.span`
  flex: 0 0 auto;
  color: ${({ theme }) => theme.colors.textStrong};
  font-size: 24px;
  font-weight: 500;
  line-height: 1.2;
`

const RankCell = styled.div`
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  padding: 10px;
`

const Rank = styled.span`
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
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
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
`

const SelectButton = styled.button`
  ${pillButton}
  border: 0;
  background: ${({ theme }) => theme.colors.inkSurface};
  color: ${({ theme }) => theme.colors.surface};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const DeselectButton = styled.button`
  ${pillButton}
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textGuide};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const Divider = styled.div`
  height: 1px;
  flex: 0 0 auto;
  background: ${({ theme }) => theme.colors.dividerFaint};
`

const Actions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 10px;
`

const CancelButton = styled.button`
  ${pillButton}
  border: 1px solid ${({ theme }) => theme.colors.tableHeaderStrong};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textGuide};
  font-weight: 500;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`

const SubmitButton = styled.button`
  ${pillButton}
  border: 0;
  background: ${({ theme }) => theme.colors.inkSurface};
  color: ${({ theme }) => theme.colors.surface};

  &:disabled {
    background: ${({ theme }) => theme.colors.dividerFaint};
    color: ${({ theme }) => theme.colors.textDim};
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`
