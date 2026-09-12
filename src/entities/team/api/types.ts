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
