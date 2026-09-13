import { api } from '@/shared/api/axios'
import type { TeamTree } from '../model/types'
import type {
  TeamQueryTreeGroupResponse,
  TeamQueryTreeMemberResponse,
  TeamQueryTreeResponse,
} from './types'

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
