import { api } from '@/shared/api/axios'
import type { Team, TeamMemberBrief, TeamTree } from '../model/types'
import type {
  TeamCreateRequest,
  TeamJoinRequest,
  TeamMemberQueryResponseItem,
  TeamMessageResponse,
  TeamQueryAllResponseItem,
  TeamQueryTreeGroupResponse,
  TeamQueryTreeMemberResponse,
  TeamQueryTreeResponse,
  TeamUpdateRequest,
} from './types'

export const teamPath = '/team'
export const joinTeamPath = '/join-team'

export async function getTeamTree(): Promise<TeamTree> {
  const { data } = await api.get<unknown>('/team/tree')

  if (!isTeamQueryTreeResponse(data)) {
    throw new Error('팀 구조 조회 응답 형식이 올바르지 않습니다.')
  }

  // `미배정` 은 팀 목록과 같은 형태이지만 응답에서 분리돼 있다.
  // 트리는 이를 마지막 팀 행으로 렌더하므로 경계에서 한 번만 이어 붙인다.
  return {
    totalMemberCount: data.totalMemberCount,
    groups: [...data.teams, data.unassigned],
  }
}

function isTeamQueryTreeResponse(
  value: unknown,
): value is TeamQueryTreeResponse {
  if (typeof value !== 'object' || value === null) return false

  const response = value as Record<string, unknown>

  return (
    Number.isInteger(response.totalMemberCount) &&
    Array.isArray(response.teams) &&
    response.teams.every((team) => isTeamQueryTreeGroup(team, false)) &&
    isTeamQueryTreeGroup(response.unassigned, true)
  )
}

function isTeamQueryTreeGroup(
  value: unknown,
  unassigned: boolean,
): value is TeamQueryTreeGroupResponse {
  if (typeof value !== 'object' || value === null) return false

  const group = value as Record<string, unknown>
  const hasValidId = unassigned
    ? group.id === null
    : Number.isInteger(group.id)

  return (
    hasValidId &&
    typeof group.name === 'string' &&
    Number.isInteger(group.memberCount) &&
    Array.isArray(group.members) &&
    group.members.every(isTeamQueryTreeMember)
  )
}

function isTeamQueryTreeMember(
  value: unknown,
): value is TeamQueryTreeMemberResponse {
  if (typeof value !== 'object' || value === null) return false

  const member = value as Record<string, unknown>

  return (
    Number.isInteger(member.id) &&
    typeof member.name === 'string' &&
    (member.position === null || typeof member.position === 'string')
  )
}

/** 팀 전체 조회(`TEAM_QUERY_ALL`). 레일이 쓰는 팀 목록과 인원수다. */
export async function getTeams(): Promise<Team[]> {
  const { data } = await api.get<unknown>(teamPath)

  if (!Array.isArray(data) || !data.every(isTeamQueryAllItem)) {
    throw new Error('팀 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    memberCount: item.teamMemberCount,
  }))
}

/**
 * 팀 멤버 전체 조회(`TEAM_MEMBER_QUERY`).
 *
 * 응답에 직급이 없다. 화면은 직원 목록(`getEmployees`)과 id 로 이어 붙여 채운다.
 */
export async function getTeamMembers(
  teamId: number,
): Promise<TeamMemberBrief[]> {
  assertTeamId(teamId)

  const { data } = await api.get<unknown>(`${teamPath}/${teamId}/members`)

  if (!Array.isArray(data) || !data.every(isTeamMemberQueryItem)) {
    throw new Error('팀 멤버 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map((item) => ({ id: item.id, name: item.name }))
}

/**
 * 팀 추가(`TEAM_CREATE`).
 *
 * 응답이 생성된 팀 id 를 주지 않는다. 호출부가 목록을 다시 받아 새 id 를 찾는다.
 */
export async function createTeam(
  input: TeamCreateRequest,
): Promise<TeamMessageResponse> {
  const { data } = await api.post<unknown>(teamPath, input)

  if (!isTeamMessageResponse(data)) {
    throw new Error('팀 추가 응답 형식이 올바르지 않습니다.')
  }

  return data
}

/** 팀 수정(`TEAM_UPDATE`). 팀명 변경에 쓴다. */
export async function updateTeam({
  teamId,
  input,
}: {
  teamId: number
  input: TeamUpdateRequest
}): Promise<TeamMessageResponse> {
  assertTeamId(teamId)

  const { data } = await api.put<unknown>(`${teamPath}/${teamId}`, input)

  if (!isTeamMessageResponse(data)) {
    throw new Error('팀 수정 응답 형식이 올바르지 않습니다.')
  }

  return data
}

/** 팀 삭제(`TEAM_DELETE`). 소속 멤버는 서버에서 미배정으로 옮겨진다. */
export async function deleteTeam(teamId: number): Promise<TeamMessageResponse> {
  assertTeamId(teamId)

  const { data } = await api.delete<unknown>(`${teamPath}/${teamId}`)

  if (!isTeamMessageResponse(data)) {
    throw new Error('팀 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

/** 팀 멤버 추가(`TEAM_JOIN`). 여러 명을 한 번에 배정한다. */
export async function joinTeam({
  teamId,
  appAdminIds,
}: { teamId: number } & TeamJoinRequest): Promise<TeamMessageResponse> {
  assertTeamId(teamId)
  assertAppAdminIds(appAdminIds)

  const { data } = await api.post<unknown>(`${joinTeamPath}/${teamId}`, {
    appAdminIds,
  })

  if (!isTeamMessageResponse(data)) {
    throw new Error('팀 멤버 추가 응답 형식이 올바르지 않습니다.')
  }

  return data
}

/**
 * 팀 멤버 삭제(`TEAM_QUIT`). 해제된 직원은 미배정으로 돌아간다.
 *
 * DELETE 인데 body 를 받는다. axios 는 `data` 옵션으로만 실어 보낼 수 있다.
 */
export async function quitTeam({
  teamId,
  appAdminIds,
}: { teamId: number } & TeamJoinRequest): Promise<TeamMessageResponse> {
  assertTeamId(teamId)
  assertAppAdminIds(appAdminIds)

  const { data } = await api.delete<unknown>(`${joinTeamPath}/${teamId}`, {
    data: { appAdminIds },
  })

  if (!isTeamMessageResponse(data)) {
    throw new Error('팀 멤버 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function assertTeamId(teamId: number): void {
  if (!Number.isSafeInteger(teamId) || teamId <= 0) {
    throw new Error('팀 ID가 올바르지 않습니다.')
  }
}

function assertAppAdminIds(appAdminIds: number[]): void {
  if (
    appAdminIds.length === 0 ||
    !appAdminIds.every((id) => Number.isSafeInteger(id) && id > 0)
  ) {
    throw new Error('직원 ID 목록이 올바르지 않습니다.')
  }
}

function isTeamQueryAllItem(
  value: unknown,
): value is TeamQueryAllResponseItem {
  if (typeof value !== 'object' || value === null) return false

  const item = value as Record<string, unknown>

  return (
    Number.isInteger(item.id) &&
    typeof item.name === 'string' &&
    Number.isInteger(item.teamMemberCount)
  )
}

function isTeamMemberQueryItem(
  value: unknown,
): value is TeamMemberQueryResponseItem {
  if (typeof value !== 'object' || value === null) return false

  const item = value as Record<string, unknown>

  return Number.isInteger(item.id) && typeof item.name === 'string'
}

function isTeamMessageResponse(
  value: unknown,
): value is TeamMessageResponse {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as Record<string, unknown>).message === 'string'
}
