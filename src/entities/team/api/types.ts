export interface TeamQueryTreeMemberResponse {
  id: number
  name: string
  position: string | null
}

export interface TeamQueryTreeGroupResponse {
  id: number
  name: string
  memberCount: number
  members: TeamQueryTreeMemberResponse[]
}

export interface TeamQueryTreeUnassignedResponse
  extends Omit<TeamQueryTreeGroupResponse, 'id'> {
  id: null
}

export interface TeamQueryTreeResponse {
  totalMemberCount: number
  teams: TeamQueryTreeGroupResponse[]
  unassigned: TeamQueryTreeUnassignedResponse
}

export interface TeamQueryTreeErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface TeamQueryAllResponseItem {
  id: number
  name: string
  /** 팀 소속 직원 수. 트리 응답의 `memberCount` 와 같은 의미다. */
  teamMemberCount: number
}

export type TeamQueryAllResponse = TeamQueryAllResponseItem[]

export interface TeamMemberQueryResponseItem {
  id: number
  name: string
}

export type TeamMemberQueryResponse = TeamMemberQueryResponseItem[]

export interface TeamCreateRequest {
  name: string
}

export interface TeamUpdateRequest {
  name: string
}

/** `POST /join-team/{teamId}` · `DELETE /join-team/{teamId}` 공용 body. */
export interface TeamJoinRequest {
  appAdminIds: number[]
}

/** 팀 생성·수정·삭제·배정·해제가 모두 같은 형태로 응답한다. */
export interface TeamMessageResponse {
  message: string
}

export interface TeamErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
