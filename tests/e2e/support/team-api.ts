import type { Page, Route } from '@playwright/test'

// 팀 관리 화면이 쓰는 API mock.
// 팀 목록·멤버·직원 목록과 생성·수정·삭제·배정·해제를 메모리 상태로 흉내 낸다.
// 실제 서버는 호출하지 않으며, 각 spec 은 필요한 응답만 page.route 로 덮어쓴다
// (Playwright 는 나중에 등록한 route 를 먼저 매칭한다).

export const teamListPattern = /^https:\/\/[^/]+\/team(?:\?.*)?$/
export const teamItemPattern = /^https:\/\/[^/]+\/team\/\d+(?:\?.*)?$/
export const teamMembersPattern = /^https:\/\/[^/]+\/team\/\d+\/members(?:\?.*)?$/
export const joinTeamPattern = /^https:\/\/[^/]+\/join-team\/\d+(?:\?.*)?$/
export const employeesPattern =
  /^https:\/\/[^/]+\/app\/admin\/employees(?:\?.*)?$/

export interface MockEmployee {
  id: number
  username: string
  name: string
  position: string | null
}

export interface MockTeam {
  id: number
  name: string
  memberIds: number[]
}

export interface TeamApiState {
  employees: MockEmployee[]
  teams: MockTeam[]
  nextTeamId: number
}

// 퍼블리싱 단계 mock 과 같은 인물·팀 구성을 쓴다. 시나리오 기대값을 그대로 옮겨오기 위해서다.
export function createTeamApiState(): TeamApiState {
  const employees: MockEmployee[] = [
    { id: 1, username: 'lee01', name: '이승현', position: null },
    { id: 2, username: 'hong01', name: '홍길동', position: '과장' },
    { id: 3, username: 'kim01', name: '김민수', position: null },
    { id: 4, username: 'choi01', name: '최유진', position: null },
    { id: 5, username: 'kim02', name: '김수인', position: '대리' },
    { id: 6, username: 'park01', name: '박도현', position: '주임' },
    { id: 7, username: 'yoon01', name: '윤서아', position: null },
    { id: 8, username: 'jang01', name: '장민재', position: '과장' },
    { id: 9, username: 'seo01', name: '서지우', position: null },
    { id: 10, username: 'lim01', name: '임하람', position: '대리' },
    { id: 11, username: 'jo01', name: '조은결', position: null },
    { id: 12, username: 'baek01', name: '백승호', position: '주임' },
    { id: 13, username: 'noh01', name: '노아름', position: null },
    { id: 14, username: 'park02', name: '박서준', position: '주임' },
    { id: 15, username: 'jeong01', name: '정하윤', position: null },
    { id: 16, username: 'oh01', name: '오세훈', position: '대리' },
    { id: 17, username: 'han01', name: '한지민', position: null },
  ]

  return {
    employees,
    teams: [
      { id: 1, name: '동물 관리팀', memberIds: [1, 2, 3, 4, 5] },
      { id: 2, name: '창고팀', memberIds: [6, 7, 8] },
      { id: 3, name: '사육장 청소팀', memberIds: [] },
      { id: 4, name: '사육팀', memberIds: [9, 10, 11, 12, 13] },
    ],
    nextTeamId: 5,
  }
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

function teamIdFrom(url: string, segment: 'team' | 'join-team'): number {
  const match = new RegExp(`/${segment}/(\\d+)`).exec(new URL(url).pathname)
  return Number(match?.[1])
}

function appAdminIdsFrom(route: Route): number[] {
  const raw = route.request().postData()
  if (!raw) return []
  const parsed: unknown = JSON.parse(raw)
  const ids = (parsed as { appAdminIds?: unknown }).appAdminIds
  return Array.isArray(ids) ? (ids as number[]) : []
}

/**
 * 팀 관리 API 를 메모리 상태로 흉내 낸다.
 *
 * 구체적인 경로(`/team/{id}/members`)를 먼저 등록하면 나중에 등록한 일반 경로가
 * 가로채므로, Playwright 의 "나중 등록 우선" 규칙에 맞춰 좁은 패턴을 뒤에 건다.
 */
export async function mockTeamApi(
  page: Page,
  state: TeamApiState = createTeamApiState(),
): Promise<TeamApiState> {
  await page.route(employeesPattern, async (route) => {
    await json(route, 200, state.employees)
  })

  await page.route(teamListPattern, async (route) => {
    if (route.request().method() === 'POST') {
      const raw = route.request().postData() ?? '{}'
      const { name } = JSON.parse(raw) as { name: string }
      state.teams.push({ id: state.nextTeamId, name, memberIds: [] })
      state.nextTeamId += 1
      await json(route, 200, { message: '팀이 생성되었습니다.' })
      return
    }

    await json(
      route,
      200,
      state.teams.map((team) => ({
        id: team.id,
        name: team.name,
        teamMemberCount: team.memberIds.length,
      })),
    )
  })

  await page.route(teamItemPattern, async (route) => {
    const teamId = teamIdFrom(route.request().url(), 'team')
    const team = state.teams.find((candidate) => candidate.id === teamId)

    if (!team) {
      await json(route, 404, {
        message: '존재하지 않는 팀입니다.',
        status: 404,
        timestamp: '2026-09-17T12:00:00',
        description: '에러 설명',
      })
      return
    }

    const method = route.request().method()

    if (method === 'PUT') {
      const raw = route.request().postData() ?? '{}'
      team.name = (JSON.parse(raw) as { name: string }).name
      await json(route, 200, { message: '팀이 수정되었습니다.' })
      return
    }

    // 실제 서버는 PUT·DELETE 만 받는다. 다른 메서드를 삭제로 처리하지 않는다.
    if (method !== 'DELETE') {
      await json(route, 405, {
        message: 'Method Not Allowed',
        status: 405,
        timestamp: '2026-09-17T12:00:00',
        description: '에러 설명',
      })
      return
    }

    state.teams = state.teams.filter((candidate) => candidate.id !== teamId)
    await json(route, 200, { message: '팀이 삭제되었습니다.' })
  })

  await page.route(teamMembersPattern, async (route) => {
    const teamId = teamIdFrom(route.request().url(), 'team')
    const team = state.teams.find((candidate) => candidate.id === teamId)

    if (!team) {
      await json(route, 404, {
        message: '존재하지 않는 팀입니다.',
        status: 404,
        timestamp: '2026-09-17T12:00:00',
        description: '에러 설명',
      })
      return
    }

    // 서버 응답에는 직급이 없다. 화면이 직원 목록으로 채우는지 확인하기 위해 그대로 비운다.
    await json(
      route,
      200,
      team.memberIds.map((id) => ({
        id,
        name: state.employees.find((employee) => employee.id === id)?.name ?? '',
      })),
    )
  })

  await page.route(joinTeamPattern, async (route) => {
    const teamId = teamIdFrom(route.request().url(), 'join-team')
    const team = state.teams.find((candidate) => candidate.id === teamId)
    const appAdminIds = appAdminIdsFrom(route)

    if (!team) {
      await json(route, 404, {
        message: '존재하지 않는 팀입니다.',
        status: 404,
        timestamp: '2026-09-17T12:00:00',
        description: '에러 설명',
      })
      return
    }

    if (route.request().method() === 'POST') {
      team.memberIds = [...team.memberIds, ...appAdminIds]
      await json(route, 200, { message: '유저가 팀에 배정되었습니다.' })
      return
    }

    team.memberIds = team.memberIds.filter((id) => !appAdminIds.includes(id))
    await json(route, 200, { message: '팀 배정이 해제되었습니다.' })
  })

  return state
}
