import type { Team, TeamMember } from './types'

// 팀 관리 화면용 mock. 추후 TanStack Query + Axios 실제 연동으로 대체한다(`/api` 스킬 담당).
// 값은 Figma `300:12764` 의 팀 관리 프레임과 같게 둔다.

const staff: TeamMember[] = [
  { id: 1, name: '이승현', position: null },
  { id: 2, name: '홍길동', position: '과장' },
  { id: 3, name: '김민수', position: null },
  { id: 4, name: '최유진', position: null },
  { id: 5, name: '김수인', position: '대리' },
  { id: 6, name: '박도현', position: '주임' },
  { id: 7, name: '윤서아', position: null },
  { id: 8, name: '장민재', position: '과장' },
  { id: 9, name: '서지우', position: null },
  { id: 10, name: '임하람', position: '대리' },
  { id: 11, name: '조은결', position: null },
  { id: 12, name: '백승호', position: '주임' },
  { id: 13, name: '노아름', position: null },
  { id: 14, name: '박서준', position: '주임' },
  { id: 15, name: '정하윤', position: null },
  { id: 16, name: '오세훈', position: '대리' },
  { id: 17, name: '한지민', position: null },
]

function pick(...ids: number[]): TeamMember[] {
  return ids.map((id) => {
    const member = staff.find((candidate) => candidate.id === id)
    if (!member) throw new Error(`mock staff not found: ${id}`)
    return member
  })
}

// 모듈 지역 저장소. 퍼블리싱 단계에서는 이 배열이 서버를 대신한다.
let teams: Team[] = [
  { id: 1, name: '동물 관리팀', members: pick(1, 2, 3, 4, 5) },
  { id: 2, name: '창고팀', members: pick(6, 7, 8) },
  { id: 3, name: '사육장 청소팀', members: [] },
  { id: 4, name: '사육팀', members: pick(9, 10, 11, 12, 13, 1) },
]

let nextTeamId = 5

export async function getMockTeams(): Promise<Team[]> {
  return teams
}

export async function getMockStaff(): Promise<TeamMember[]> {
  return staff
}

export async function createMockTeam(name: string): Promise<Team[]> {
  teams = [...teams, { id: nextTeamId, name, members: [] }]
  nextTeamId += 1
  return teams
}

export async function renameMockTeam(
  teamId: number,
  name: string,
): Promise<Team[]> {
  teams = teams.map((team) => (team.id === teamId ? { ...team, name } : team))
  return teams
}

export async function deleteMockTeam(teamId: number): Promise<Team[]> {
  teams = teams.filter((team) => team.id !== teamId)
  return teams
}

export async function addMockTeamMembers(
  teamId: number,
  memberIds: number[],
): Promise<Team[]> {
  const added = staff.filter((member) => memberIds.includes(member.id))
  teams = teams.map((team) =>
    team.id === teamId ? { ...team, members: [...team.members, ...added] } : team,
  )
  return teams
}

export async function removeMockTeamMember(
  teamId: number,
  memberId: number,
): Promise<Team[]> {
  teams = teams.map((team) =>
    team.id === teamId
      ? {
          ...team,
          members: team.members.filter((member) => member.id !== memberId),
        }
      : team,
  )
  return teams
}
