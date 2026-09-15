import { useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addMockTeamMembers,
  createMockTeam,
  deleteMockTeam,
  getMockStaff,
  getMockTeams,
  removeMockTeamMember,
  renameMockTeam,
  TeamDetailPanel,
  TeamRail,
  type Team,
} from '@/entities/team'
import { AddTeamDialog, AddTeamMemberDialog } from '@/features/team-settings'
import { DeleteConfirmationDialog, Toast, type ToastVariant } from '@/shared/ui'

type OpenDialog = 'add-team' | 'add-member' | 'delete-team' | null

const teamsQueryKey = ['teams', 'list'] as const

export function TeamSettingsPage() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dialog, setDialog] = useState<OpenDialog>(null)
  const [toast, setToast] = useState<{
    variant: ToastVariant
    message: string
  } | null>(null)

  const teamsQuery = useQuery({
    queryKey: teamsQueryKey,
    queryFn: getMockTeams,
  })
  const staffQuery = useQuery({ queryKey: ['staff', 'list'], queryFn: getMockStaff })

  const teams = teamsQuery.data ?? []
  const staff = staffQuery.data ?? []

  // 선택한 팀이 없거나 사라졌으면 첫 번째 팀을 고른다(진입·삭제 직후).
  const selectedTeam: Team | null =
    teams.find((team) => team.id === selectedId) ?? teams[0] ?? null

  function applyTeams(next: Team[]) {
    queryClient.setQueryData(teamsQueryKey, next)
  }

  const createTeam = useMutation({
    mutationFn: (name: string) => createMockTeam(name),
    onSuccess: (next) => {
      applyTeams(next)
      setDialog(null)
      // 새로 만든 팀은 목록 맨 뒤에 붙고 바로 선택된다.
      setSelectedId(next[next.length - 1]?.id ?? null)
    },
  })

  const renameTeam = useMutation({
    mutationFn: ({ teamId, name }: { teamId: number; name: string }) =>
      renameMockTeam(teamId, name),
    onSuccess: applyTeams,
  })

  const deleteTeam = useMutation({
    mutationFn: (teamId: number) => deleteMockTeam(teamId),
    onSuccess: (next) => {
      applyTeams(next)
      setDialog(null)
      setSelectedId(next[0]?.id ?? null)
      setToast({ variant: 'success', message: '데이터 삭제에 성공했습니다' })
    },
    onError: () => {
      setDialog(null)
      setToast({ variant: 'error', message: '데이터 삭제에 실패했습니다' })
    },
  })

  const addMembers = useMutation({
    mutationFn: ({ teamId, memberIds }: { teamId: number; memberIds: number[] }) =>
      addMockTeamMembers(teamId, memberIds),
    onSuccess: (next) => {
      applyTeams(next)
      setDialog(null)
    },
  })

  const removeMember = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: number; memberId: number }) =>
      removeMockTeamMember(teamId, memberId),
    onSuccess: applyTeams,
  })

  // 팀원 추가 모달에는 그 팀에 아직 없는 직원만 올린다.
  const memberCandidates = selectedTeam
    ? staff.filter(
        (person) =>
          !selectedTeam.members.some((member) => member.id === person.id),
      )
    : []

  return (
    <Page>
      <Content>
        <Heading>
          <Title>팀 관리</Title>
          <Subtitle>토이빌리지 부서별 팀 인원 설정</Subtitle>
        </Heading>

        <Layout>
          <TeamRail
            teams={teams}
            selectedId={selectedTeam?.id ?? null}
            onSelect={setSelectedId}
            onAddClick={() => setDialog('add-team')}
          />

          {selectedTeam && (
            <TeamDetailPanel
              key={selectedTeam.id}
              team={selectedTeam}
              onRename={(name) =>
                renameTeam.mutate({ teamId: selectedTeam.id, name })
              }
              onDeleteClick={() => setDialog('delete-team')}
              onAddMemberClick={() => setDialog('add-member')}
              onRemoveMember={(memberId) =>
                removeMember.mutate({ teamId: selectedTeam.id, memberId })
              }
            />
          )}
        </Layout>
      </Content>

      {dialog === 'add-team' && (
        <AddTeamDialog
          onCancel={() => setDialog(null)}
          onSubmit={(name) => createTeam.mutate(name)}
        />
      )}

      {dialog === 'add-member' && selectedTeam && (
        <AddTeamMemberDialog
          teamName={selectedTeam.name}
          candidates={memberCandidates}
          onCancel={() => setDialog(null)}
          onSubmit={(memberIds) =>
            addMembers.mutate({ teamId: selectedTeam.id, memberIds })
          }
        />
      )}

      {dialog === 'delete-team' && selectedTeam && (
        <DeleteConfirmationDialog
          pending={deleteTeam.isPending}
          onCancel={() => setDialog(null)}
          onConfirm={() => deleteTeam.mutate(selectedTeam.id)}
        />
      )}

      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}
    </Page>
  )
}

const Page = styled.main`
  padding: 32px;
  background: ${({ theme }) => theme.colors.background};
  min-height: 100vh;
  font-family: ${({ theme }) => theme.font.body};
`

const Content = styled.div`
  width: min(100%, 1320px);
  margin: 0 auto;
  /* Figma page header(1770:15812) 가 프레임 y=84, padding 10 → 텍스트 상단 94. */
  padding-top: calc(94px - 32px);
`

const Heading = styled.header`
  display: flex;
  flex-direction: column;
`

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 60px;
  font-weight: 600;
  line-height: 1.2;
`

const Subtitle = styled.p`
  margin: 8px 0 0;
  color: ${({ theme }) => theme.colors.textGuide};
  font-size: 32px;
  font-weight: 500;
  line-height: 1.2;
`

// Figma content(1727:16210) — 프레임 y=290, padding 10 → 카드 상단 300.
// 헤더 블록(94 + 72 + 8 + 38 = 212) 아래로 88 을 띄워 그 자리를 맞춘다.
// 가로 패딩은 두지 않는다 — 카드 왼쪽 끝이 제목과 같은 선에 오게 한다.
// rail 400 + gap 20 + 나머지를 채우는 상세 패널이 같은 높이로 늘어난다.
const Layout = styled.div`
  display: flex;
  align-items: stretch;
  gap: 20px;
  margin-top: 88px;
`
