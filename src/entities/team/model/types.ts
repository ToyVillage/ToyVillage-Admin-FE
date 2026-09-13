export interface TeamMember {
  id: number
  name: string
  /** 직급. 없는 직원은 null 이다. */
  position: string | null
}

export interface TeamTreeGroup {
  /** 팀 id. 미배정 그룹은 null 이다. */
  id: number | null
  name: string
  /** 그룹 소속 직원 수. 트리 행의 `n/m명` 에서 m 이다. */
  memberCount: number
  members: TeamMember[]
}

export interface TeamTree {
  /** 전체 직원 수. `전체 직원` 행의 분모다. */
  totalMemberCount: number
  /** 팀 목록. 미배정 그룹이 마지막 항목으로 포함된다. */
  groups: TeamTreeGroup[]
}
