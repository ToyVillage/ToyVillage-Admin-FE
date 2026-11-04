import type { Page, Route } from '@playwright/test'

// 직원 계정 API(app-admin-controller) 가짜 서버.
// 대상: GET·POST /app/admin/employees, PATCH /app/admin/employees/{id}/password,
//       PATCH /app/admin/employees/{id}/role, DELETE /app/admin/employees/{id}.
// 실제 서버는 호출하지 않으며, 그 밖의 https 요청은 abort 한다.

export const employeeCreatePattern =
  /^https:\/\/[^/]+\/app\/admin\/employees(?:\?.*)?$/
export const employeePasswordPattern =
  /^https:\/\/[^/]+\/app\/admin\/employees\/(\d+)\/password(?:\?.*)?$/
export const employeeRolePattern =
  /^https:\/\/[^/]+\/app\/admin\/employees\/(\d+)\/role(?:\?.*)?$/
export const employeeItemPattern =
  /^https:\/\/[^/]+\/app\/admin\/employees\/(\d+)(?:\?.*)?$/

export type MockEmployeeRole = 'APP_ADMIN' | 'MIDDLE_ADMIN' | 'EMPLOYEE'

export interface MockEmployee {
  id: number
  username: string
  name: string
  role: MockEmployeeRole
  /** YYYY-MM-DD */
  createAt: string
  passwordChanged: boolean
}

// 직원 계정 관리 화면 시나리오용 12명. 앞 5명은 Figma 값(배지 포함)이다.
export const mockEmployees: MockEmployee[] = [
  {
    id: 1,
    name: '김수인',
    username: 'suin.kim',
    role: 'EMPLOYEE',
    passwordChanged: true,
    createAt: '2026-07-03',
  },
  {
    id: 2,
    name: '이승현',
    username: 'seunghyun.lee',
    role: 'EMPLOYEE',
    passwordChanged: true,
    createAt: '2026-06-21',
  },
  {
    id: 3,
    name: '이지아',
    username: 'jia.lee',
    role: 'EMPLOYEE',
    passwordChanged: false,
    createAt: '2026-06-02',
  },
  {
    id: 4,
    name: '박도현',
    username: 'dohyun.park',
    role: 'EMPLOYEE',
    passwordChanged: true,
    createAt: '2026-05-14',
  },
  {
    id: 5,
    name: '최민지',
    username: 'minji.choi',
    role: 'EMPLOYEE',
    passwordChanged: false,
    createAt: '2026-09-20',
  },
  {
    id: 6,
    name: '정하늘',
    username: 'haneul.jung',
    role: 'EMPLOYEE',
    passwordChanged: true,
    createAt: '2026-04-30',
  },
  {
    id: 7,
    name: '한서준',
    username: 'seojun.han',
    role: 'EMPLOYEE',
    passwordChanged: true,
    createAt: '2026-04-11',
  },
  {
    id: 8,
    name: '윤채원',
    username: 'chaewon.yoon',
    role: 'EMPLOYEE',
    passwordChanged: false,
    createAt: '2026-03-27',
  },
  {
    id: 9,
    name: '강민호',
    username: 'minho.kang',
    role: 'EMPLOYEE',
    passwordChanged: true,
    createAt: '2026-03-08',
  },
  {
    id: 10,
    name: '오예린',
    username: 'yerin.oh',
    role: 'EMPLOYEE',
    passwordChanged: true,
    createAt: '2026-02-19',
  },
  {
    id: 11,
    name: '서지훈',
    username: 'jihoon.seo',
    role: 'EMPLOYEE',
    passwordChanged: false,
    createAt: '2026-01-25',
  },
  {
    id: 12,
    name: '임다은',
    username: 'daeun.lim',
    role: 'EMPLOYEE',
    passwordChanged: true,
    createAt: '2026-01-06',
  },
]

// 권한 관리 화면 시나리오용 8명(Figma 값). 앞 3명이 중간 관리자다.
export const permissionEmployees: MockEmployee[] = [
  ['김수인', 'suin.kim', 'MIDDLE_ADMIN'],
  ['이승현', 'seunghyun.lee', 'MIDDLE_ADMIN'],
  ['이지아', 'jia.lee', 'MIDDLE_ADMIN'],
  ['박도현', 'dohyun.park', 'EMPLOYEE'],
  ['최민지', 'minji.choi', 'EMPLOYEE'],
  ['정하윤', 'hayun.jung', 'EMPLOYEE'],
  ['오세훈', 'sehun.oh', 'EMPLOYEE'],
  ['한지민', 'jimin.han', 'EMPLOYEE'],
].map(([name, username, role], index) => ({
  id: index + 1,
  name,
  username,
  role: role as MockEmployeeRole,
  createAt: '2026-01-02',
  passwordChanged: true,
}))

export interface EmployeeCreateRequest {
  body: unknown
  authorization: string | undefined
}

export interface EmployeeTargetRequest {
  id: number
  authorization: string | undefined
}

export interface EmployeeRoleChangeRecord extends EmployeeTargetRequest {
  body: unknown
}

export interface EmployeeApiOptions {
  /** 생성 응답. 기본 201 `{ message }`. */
  status?: number
  body?: unknown
  /** 생성 응답 전 대기(ms). 중복 제출 확인용. */
  delay?: number
  /** 목록 픽스처. 기본 12명 */
  employees?: MockEmployee[]
  /** 목록 응답. 기본 200 + 픽스처 */
  listStatus?: number
  listBody?: unknown
  /** 비밀번호 초기화 응답. 기본 200 `{ message }` */
  resetStatus?: number
  resetDelay?: number
  /** 삭제 응답. 기본 200 `{ message }` */
  deleteStatus?: number
  deleteDelay?: number
  /** 권한 변경 응답. 기본 200 `{ message }` */
  roleStatus?: number
  roleBody?: unknown
  roleDelay?: number
}

export interface EmployeeApiHandle {
  /** POST 요청 기록 */
  requests: EmployeeCreateRequest[]
  employees: MockEmployee[]
  lists: number
  resets: EmployeeTargetRequest[]
  deletes: EmployeeTargetRequest[]
  roleChanges: EmployeeRoleChangeRecord[]
}

export function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-08-10T22:30:00.000000',
    description: message,
  }
}

export async function mockEmployeeApi(
  page: Page,
  {
    status = 201,
    body,
    delay = 0,
    employees = mockEmployees.map((item) => ({ ...item })),
    listStatus = 200,
    listBody,
    resetStatus = 200,
    resetDelay = 0,
    deleteStatus = 200,
    deleteDelay = 0,
    roleStatus = 200,
    roleBody,
    roleDelay = 0,
  }: EmployeeApiOptions = {},
): Promise<EmployeeApiHandle> {
  const handle: EmployeeApiHandle = {
    requests: [],
    employees,
    lists: 0,
    resets: [],
    deletes: [],
    roleChanges: [],
  }

  await page.route(/^https:\/\//, (route) => route.abort())

  await page.route(employeeCreatePattern, async (route) => {
    const request = route.request()

    if (request.method() === 'GET') {
      handle.lists += 1
      await fulfill(route, listStatus, listBody ?? handle.employees)
      return
    }
    if (request.method() !== 'POST') return route.abort()

    const requestBody = request.postDataJSON() as {
      username?: string
      name?: string
    }
    handle.requests.push({
      body: requestBody,
      authorization: request.headers().authorization,
    })
    await wait(delay)

    // 기본 성공이면 새 직원을 목록 끝에 넣는다(이후 목록 조회에 보인다).
    if (status === 201 && body === undefined) {
      handle.employees.push({
        id: Math.max(0, ...handle.employees.map((item) => item.id)) + 1,
        username: requestBody.username ?? '',
        name: requestBody.name ?? '',
        role: 'EMPLOYEE',
        createAt: '2026-09-28',
        // 새 계정은 초기 비밀번호(아이디와 같음) 상태다.
        passwordChanged: false,
      })
    }
    await fulfill(route, status, body ?? { message: '직원이 생성되었습니다.' })
  })

  await page.route(employeePasswordPattern, async (route) => {
    if (route.request().method() !== 'PATCH') return route.abort()
    const id = Number(matchId(route, employeePasswordPattern))
    handle.resets.push({
      id,
      authorization: route.request().headers().authorization,
    })
    await wait(resetDelay)
    if (resetStatus === 200) {
      const target = handle.employees.find((item) => item.id === id)
      if (target) target.passwordChanged = false
    }
    await fulfill(
      route,
      resetStatus,
      resetStatus === 200
        ? { message: '비밀번호가 초기화되었습니다.' }
        : errorBody(resetStatus, '존재하지 않는 앱 관리자입니다.'),
    )
  })

  await page.route(employeeRolePattern, async (route) => {
    if (route.request().method() !== 'PATCH') return route.abort()
    const id = Number(matchId(route, employeeRolePattern))
    const requestBody = route.request().postDataJSON() as {
      role?: MockEmployeeRole
    }
    handle.roleChanges.push({
      id,
      body: requestBody,
      authorization: route.request().headers().authorization,
    })
    await wait(roleDelay)
    if (roleStatus !== 200) {
      await fulfill(
        route,
        roleStatus,
        errorBody(roleStatus, '존재하지 않는 앱 관리자입니다.'),
      )
      return
    }
    // 기본 성공이면 픽스처의 권한을 바꾼다(이후 목록 조회에 보인다).
    if (roleBody === undefined && requestBody.role) {
      const target = handle.employees.find((item) => item.id === id)
      if (target) target.role = requestBody.role
    }
    await fulfill(
      route,
      200,
      roleBody ?? { message: '직원 권한이 변경되었습니다.' },
    )
  })

  await page.route(employeeItemPattern, async (route) => {
    if (route.request().method() !== 'DELETE') return route.abort()
    const id = Number(matchId(route, employeeItemPattern))
    handle.deletes.push({
      id,
      authorization: route.request().headers().authorization,
    })
    await wait(deleteDelay)
    if (deleteStatus !== 200) {
      await fulfill(
        route,
        deleteStatus,
        errorBody(deleteStatus, '존재하지 않는 앱 관리자입니다.'),
      )
      return
    }
    const index = handle.employees.findIndex((item) => item.id === id)
    if (index !== -1) handle.employees.splice(index, 1)
    await fulfill(route, 200, { message: '직원이 삭제되었습니다.' })
  })

  return handle
}

async function fulfill(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

function matchId(route: Route, pattern: RegExp): string {
  return pattern.exec(route.request().url())?.[1] ?? ''
}

async function wait(ms: number) {
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms))
}
