import { useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getEmployees } from '@/entities/employee'
import {
  createTeam,
  deleteTeam,
  getTeamMembers,
  getTeams,
  joinTeam,
  quitTeam,
  TeamDetailPanel,
  TeamRail,
  updateTeam,
  type Team,
  type TeamMember,
} from '@/entities/team'
import { AddTeamDialog, AddTeamMemberDialog } from '@/features/team-settings'
import { DeleteConfirmationDialog, Toast, type ToastVariant } from '@/shared/ui'

type OpenDialog = 'add-team' | 'add-member' | 'delete-team' | null

const teamsQueryKey = ['teams', 'list'] as const
const employeesQueryKey = ['employees', 'list'] as const
// 업무지시 담당자 트리(`['teams', 'tree']`)도 팀·소속을 읽는다. 팀이 바뀌면
// 트리의 팀 행과 `미배정` 이 함께 달라지므로 같이 무효화한다.
const teamTreeQueryKey = ['teams', 'tree'] as const

function teamMembersQueryKey(teamId: number) {
  return ['teams', 'members', teamId] as const
}

export function TeamSettingsPage() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dialog, setDialog] = useState<OpenDialog>(null)
  const [toast, setToast] = useState<{
    variant: ToastVariant
    message: string
  } | null>(null)

  const teamsQuery = useQuery({ queryKey: teamsQueryKey, queryFn: getTeams })
  const employeesQuery = useQuery({
    queryKey: employeesQueryKey,
    queryFn: getEmployees,
  })

  const teams = teamsQuery.data ?? []
  const employees = employeesQuery.data ?? []

  // 선택한 팀이 없거나 사라졌으면 첫 번째 팀을 고른다(진입·삭제 직후).
  const selectedTeam: Team | null =
    teams.find((team) => team.id === selectedId) ?? teams[0] ?? null

  const selectedTeamId = selectedTeam?.id ?? null

  const membersQuery = useQuery({
    queryKey: teamMembersQueryKey(selectedTeamId ?? 0),
    queryFn: () => {
      if (selectedTeamId == null) {
        throw new Error('선택된 팀이 없습니다.')
      }
      return getTeamMembers(selectedTeamId)
    },
    enabled: selectedTeamId != null,
  })

  // `GET /team/{teamId}/members` 는 직급을 주지 않는다. 직원 목록으로 채운다.
  const positionByEmployeeId = useMemo(
    () =>
      new Map(
        (employeesQuery.data ?? []).map((employee) => [
          employee.id,
          employee.position,
        ]),
      ),
    [employeesQuery.data],
  )

  const members: TeamMember[] = (membersQuery.data ?? []).map((member) => ({
    ...member,
    position: positionByEmployeeId.get(member.id) ?? null,
  }))

  function notifyFailure(message: string) {
    setToast({ variant: 'error', message })
  }

  async function refreshTeams() {
    await queryClient.invalidateQueries({ queryKey: teamsQueryKey })
    await queryClient.invalidateQueries({ queryKey: teamTreeQueryKey })
  }

  async function refreshMembers(teamId: number) {
    await queryClient.invalidateQueries({
      queryKey: teamMembersQueryKey(teamId),
    })
  }

  const createTeamMutation = useMutation({
    mutationFn: (name: string) => createTeam({ name }),
    onSuccess: async () => {
      // 생성 응답이 새 팀 id 를 주지 않는다. 목록을 다시 받아 늘어난 id 를 고른다.
      const before = new Set(teams.map((team) => team.id))
      await refreshTeams()
      const next = queryClient.getQueryData<Team[]>(teamsQueryKey) ?? []
      const created = next.find((team) => !before.has(team.id))

      setDialog(null)
      if (created) setSelectedId(created.id)
    },
    onError: () => {
      setDialog(null)
      notifyFailure('팀 추가에 실패했습니다')
    },
  })

  const renameTeamMutation = useMutation({
    mutationFn: ({ teamId, name }: { teamId: number; name: string }) =>
      updateTeam({ teamId, input: { name } }),
    onSuccess: refreshTeams,
    onError: () => notifyFailure('팀명 변경에 실패했습니다'),
  })

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => deleteTeam(teamId),
    onSuccess: async (_data, teamId) => {
      // 삭제된 팀의 멤버 캐시는 다시 쓸 일이 없다. 무효화 대신 걷어낸다.
      queryClient.removeQueries({ queryKey: teamMembersQueryKey(teamId) })
      await refreshTeams()

      const next = queryClient.getQueryData<Team[]>(teamsQueryKey) ?? []
      setDialog(null)
      setSelectedId(next[0]?.id ?? null)
      setToast({ variant: 'success', message: '데이터 삭제에 성공했습니다' })
    },
    onError: () => {
      setDialog(null)
      notifyFailure('데이터 삭제에 실패했습니다')
    },
  })

  const addMembersMutation = useMutation({
    mutationFn: ({
      teamId,
      memberIds,
    }: {
      teamId: number
      memberIds: number[]
    }) => joinTeam({ teamId, appAdminIds: memberIds }),
    onSuccess: async (_data, { teamId }) => {
      await Promise.all([refreshTeams(), refreshMembers(teamId)])
      setDialog(null)
    },
    onError: () => {
      setDialog(null)
      notifyFailure('팀원 추가에 실패했습니다')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: number; memberId: number }) =>
      quitTeam({ teamId, appAdminIds: [memberId] }),
    onSuccess: async (_data, { teamId }) => {
      await Promise.all([refreshTeams(), refreshMembers(teamId)])
    },
    onError: () => notifyFailure('팀원 제거에 실패했습니다'),
  })

  // 팀원 추가 모달에는 그 팀에 아직 없는 직원만 올린다.
  const memberCandidates: TeamMember[] = selectedTeam
    ? employees
        .filter((employee) => !members.some((member) => member.id === employee.id))
        .map((employee) => ({
          id: employee.id,
          name: employee.name,
          position: employee.position,
        }))
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
              members={members}
              onRename={(name) =>
                renameTeamMutation.mutate({ teamId: selectedTeam.id, name })
              }
              onDeleteClick={() => setDialog('delete-team')}
              onAddMemberClick={() => setDialog('add-member')}
              onRemoveMember={(memberId) =>
                removeMemberMutation.mutate({
                  teamId: selectedTeam.id,
                  memberId,
                })
              }
            />
          )}
        </Layout>
      </Content>

      {dialog === 'add-team' && (
        <AddTeamDialog
          onCancel={() => setDialog(null)}
          onSubmit={(name) => createTeamMutation.mutate(name)}
        />
      )}

      {dialog === 'add-member' && selectedTeam && (
        <AddTeamMemberDialog
          teamName={selectedTeam.name}
          candidates={memberCandidates}
          onCancel={() => setDialog(null)}
          onSubmit={(memberIds) =>
            addMembersMutation.mutate({ teamId: selectedTeam.id, memberIds })
          }
        />
      )}

      {dialog === 'delete-team' && selectedTeam && (
        <DeleteConfirmationDialog
          pending={deleteTeamMutation.isPending}
          onCancel={() => setDialog(null)}
          onConfirm={() => deleteTeamMutation.mutate(selectedTeam.id)}
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
