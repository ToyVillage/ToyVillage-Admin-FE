import type { Page, Route } from '@playwright/test'

// 업무지시 퍼블리싱 시나리오가 쓰는 API mock.
// 목록·상세·생성·수정·삭제와 담당자 트리, 첨부 업로드를 메모리 상태로 흉내 낸다.
// 실제 서버는 호출하지 않으며, 각 spec 은 필요한 응답만 page.route 로 덮어쓴다
// (Playwright 는 나중에 등록한 route 를 먼저 매칭한다).

export const taskListPattern = /\/api\/tasks(?:\?.*)?$/
export const taskItemPattern = /\/api\/tasks\/[^/?]+(?:\?.*)?$/
export const teamTreePattern = /\/api\/team\/tree(?:\?.*)?$/
export const filePattern = /\/api\/file(?:\?.*)?$/

export type MockTaskStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'
export type MockTaskPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface MockMember {
  id: number
  name: string
  position: string | null
}

export interface MockGroup {
  id: number | null
  name: string
  members: MockMember[]
}

export interface MockTaskFile {
  fileName: string
  fileKey: string
}

export interface MockTask {
  id: number
  title: string
  content: string
  assigneeIds: number[]
  status: MockTaskStatus
  priority: MockTaskPriority
  finishDate: string
  files: MockTaskFile[]
}

// 담당자 트리. 이름과 팀 구성은 퍼블리싱 시나리오가 참조하는 값이다(전체 18명).
export const mockGroups: MockGroup[] = [
  {
    id: 1,
    name: '동물 관리팀',
    members: [
      { id: 2, name: '김수인', position: '사원' },
      { id: 4, name: '박지훈', position: '사원' },
      { id: 5, name: '정해나', position: '대리' },
      { id: 6, name: '오세영', position: '사원' },
      { id: 7, name: '한도윤', position: '과장' },
    ],
  },
  {
    id: 2,
    name: '창고팀',
    members: [
      { id: 3, name: '이지아', position: '대리' },
      { id: 8, name: '서준호', position: '사원' },
      { id: 9, name: '문가온', position: '사원' },
    ],
  },
  {
    id: 3,
    name: '사육장 청소팀',
    members: [
      { id: 10, name: '김유영', position: '사원' },
      { id: 11, name: '배수민', position: '사원' },
      { id: 12, name: '신재원', position: '사원' },
      { id: 13, name: '임하늘', position: '대리' },
    ],
  },
  {
    id: 4,
    name: '사육팀',
    members: [
      { id: 1, name: '이승현', position: '사원' },
      { id: 14, name: '홍길동', position: '과장' },
      { id: 15, name: '김민수', position: '사원' },
      { id: 16, name: '최유진', position: '사원' },
      { id: 17, name: '강태오', position: '사원' },
      { id: 18, name: '윤소린', position: '대리' },
    ],
  },
  { id: null, name: '미배정', members: [] },
]

const figmaContent = '상세 업무 내용이 입력되어있음'

const figmaFiles: MockTaskFile[] = [
  { fileName: '당일 지침.pdf', fileKey: '2026/07/01/guide_a1b2c3.pdf' },
  { fileName: '휴관안내.png', fileKey: '2026/07/01/notice_d4e5f6.png' },
  { fileName: '휴관안내.jpg', fileKey: '2026/07/01/notice_g7h8i9.jpg' },
]

// 상태는 서버가 계산해 내려주는 값이다. 퍼블리싱 시나리오의 탭 개수
// (진행중 6 · 완료 5 · 지연 3)와 페이지네이션(14건)을 그대로 재현한다.
export const mockTasks: MockTask[] = [
  {
    id: 1,
    title: '업무 제목',
    content: figmaContent,
    assigneeIds: [1, 2, 3, 10, 14, 15],
    status: 'EXPIRED',
    priority: 'HIGH',
    finishDate: '2026-07-03',
    files: figmaFiles,
  },
  {
    id: 2,
    title: '업무 제목',
    content: figmaContent,
    assigneeIds: [2],
    status: 'COMPLETED',
    priority: 'LOW',
    finishDate: '2026-07-01',
    files: [],
  },
  {
    id: 3,
    title: '업무 제목',
    content: figmaContent,
    assigneeIds: [3],
    status: 'COMPLETED',
    priority: 'HIGH',
    finishDate: '2027-02-20',
    files: [],
  },
  {
    id: 4,
    title: '업무 제목',
    content: figmaContent,
    assigneeIds: [1, 14, 15, 16],
    status: 'EXPIRED',
    priority: 'MEDIUM',
    finishDate: '2026-08-14',
    files: [],
  },
  {
    id: 5,
    title: '여름 프로그램 준비',
    content: '여름 프로그램 물품과 일정을 정리해주세요.',
    assigneeIds: [2],
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    finishDate: '2027-04-10',
    files: [],
  },
  {
    id: 6,
    title: '사육장 점검 보고',
    content: '사육장 점검 결과를 정리해 보고해주세요.',
    assigneeIds: [3],
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    finishDate: '2027-04-17',
    files: [],
  },
  {
    id: 7,
    title: '단체예약 응대 정리',
    content: '이번 달 단체예약 응대 내역을 정리해주세요.',
    assigneeIds: [1],
    status: 'COMPLETED',
    priority: 'LOW',
    finishDate: '2026-12-18',
    files: [],
  },
  {
    id: 8,
    title: '휴관 안내문 게시',
    content: '휴관 안내문을 게시하고 결과를 알려주세요.',
    assigneeIds: [2],
    status: 'EXPIRED',
    priority: 'MEDIUM',
    finishDate: '2026-09-02',
    files: [],
  },
  {
    id: 9,
    title: '자료실 파일 정리',
    content: '자료실의 오래된 파일을 정리해주세요.',
    assigneeIds: [3],
    status: 'IN_PROGRESS',
    priority: 'LOW',
    finishDate: '2027-01-08',
    files: [],
  },
  {
    id: 10,
    title: '연간 운영 계획 초안',
    content: '내년 운영 계획 초안을 작성해주세요.',
    assigneeIds: [1],
    status: 'COMPLETED',
    priority: 'HIGH',
    finishDate: '2027-01-20',
    files: [],
  },
  {
    id: 11,
    title: '동절기 급수설비 점검',
    content: '동파 우려 구역의 급수설비를 점검하고 결과를 보고해주세요.',
    assigneeIds: [11],
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    finishDate: '2027-01-28',
    files: [],
  },
  {
    id: 12,
    title: '체험학습 안전교육',
    content: '체험학습 인솔자 대상 안전교육을 진행해주세요.',
    assigneeIds: [5],
    status: 'COMPLETED',
    priority: 'MEDIUM',
    finishDate: '2027-02-05',
    files: [],
  },
  {
    id: 13,
    title: '사료 재고 정리',
    content: '창고 사료 재고를 실사하고 부족분을 정리해주세요.',
    assigneeIds: [8, 9],
    status: 'IN_PROGRESS',
    priority: 'LOW',
    finishDate: '2027-02-12',
    files: [],
  },
  {
    id: 14,
    title: '봄맞이 시설 보수',
    content: '개장 전 노후 시설을 확인하고 보수 계획을 세워주세요.',
    assigneeIds: [13],
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    finishDate: '2027-03-02',
    files: [],
  },
]

export interface TaskApiRequests {
  list: number
  detail: number
  create: number
  update: number
  delete: number
  tree: number
  upload: number
}

export interface TaskApiHandle {
  tasks: MockTask[]
  requests: TaskApiRequests
  createdBodies: unknown[]
  updatedBodies: unknown[]
}

export interface TaskApiOptions {
  /** 초기 목록. 기본은 퍼블리싱 시나리오용 14건이다. */
  tasks?: MockTask[]
  /** 응답 지연(ms). 진행 중 상태를 관찰할 때 쓴다. */
  mutationDelayMs?: number
  /** 삭제 응답 status. 200 이 아니면 목록을 바꾸지 않는다. */
  deleteStatus?: number
}

export async function mockTaskApi(
  page: Page,
  options: TaskApiOptions = {},
): Promise<TaskApiHandle> {
  const {
    tasks = mockTasks.map((task) => ({ ...task })),
    mutationDelayMs = 0,
    deleteStatus = 200,
  } = options

  const handle: TaskApiHandle = {
    tasks,
    requests: {
      list: 0,
      detail: 0,
      create: 0,
      update: 0,
      delete: 0,
      tree: 0,
      upload: 0,
    },
    createdBodies: [],
    updatedBodies: [],
  }
  const members = mockGroups.flatMap((group) => group.members)

  await page.route(teamTreePattern, async (route) => {
    handle.requests.tree += 1
    const teams = mockGroups.filter((group) => group.id !== null)
    const unassigned = mockGroups.find((group) => group.id === null)

    await json(route, 200, {
      totalMemberCount: members.length,
      teams: teams.map(toGroupResponse),
      unassigned: toGroupResponse(
        unassigned ?? { id: null, name: '미배정', members: [] },
      ),
    })
  })

  await page.route(filePattern, async (route) => {
    handle.requests.upload += 1
    await json(route, 200, {
      fileKey: `2026/09/09/upload_${handle.requests.upload}.bin`,
    })
  })

  await page.route(taskListPattern, async (route) => {
    const request = route.request()

    if (request.method() === 'POST') {
      handle.requests.create += 1
      const body = request.postDataJSON() as {
        title: string
        content: string
        assigneeIds: number[]
        finishDate: string
        priority: MockTaskPriority
        files: string[]
      }
      handle.createdBodies.push(body)
      await delay(mutationDelayMs)

      handle.tasks.unshift({
        id: nextId(handle.tasks),
        title: body.title,
        content: body.content,
        assigneeIds: body.assigneeIds,
        status: 'IN_PROGRESS',
        priority: body.priority,
        finishDate: body.finishDate,
        files: body.files.map((fileKey) => ({
          fileName: fileKey.split('/').at(-1) ?? fileKey,
          fileKey,
        })),
      })

      await json(route, 201, { message: '업무지시가 등록되었습니다.' })
      return
    }

    handle.requests.list += 1
    const query = new URL(request.url()).searchParams
    const page0 = Number(query.get('page') ?? 0)
    const size = Number(query.get('size') ?? 10)
    const status = query.get('status')
    const filtered = status
      ? handle.tasks.filter((task) => task.status === status)
      : handle.tasks

    await json(route, 200, {
      tasks: filtered
        .slice(page0 * size, page0 * size + size)
        .map((task) => toListItem(task, members)),
      totalPageSize: Math.ceil(filtered.length / size),
    })
  })

  await page.route(taskItemPattern, async (route) => {
    const request = route.request()
    const rawId = new URL(request.url()).pathname.split('/').at(-1) ?? ''
    const id = Number(rawId)
    const task = handle.tasks.find((item) => item.id === id)

    if (request.method() === 'DELETE') {
      handle.requests.delete += 1
      await delay(mutationDelayMs)

      if (deleteStatus !== 200) {
        await json(route, deleteStatus, errorBody(deleteStatus, '삭제 실패'))
        return
      }

      handle.tasks = handle.tasks.filter((item) => item.id !== id)
      await json(route, 200, { message: '업무지시가 삭제되었습니다.' })
      return
    }

    if (request.method() === 'PUT') {
      handle.requests.update += 1
      const body = request.postDataJSON() as {
        title: string
        content: string
        assigneeIds: number[]
        finishDate: string
        priority: MockTaskPriority
        files: string[]
      }
      handle.updatedBodies.push(body)
      await delay(mutationDelayMs)

      if (!task) {
        await json(route, 404, errorBody(404, '존재하지 않는 업무 지시입니다.'))
        return
      }

      Object.assign(task, {
        title: body.title,
        content: body.content,
        assigneeIds: body.assigneeIds,
        priority: body.priority,
        finishDate: body.finishDate,
        files: body.files.map((fileKey) => ({
          fileName: fileKey.split('/').at(-1) ?? fileKey,
          fileKey,
        })),
      })

      await json(route, 200, { message: '업무지시가 수정되었습니다.' })
      return
    }

    handle.requests.detail += 1

    if (!task) {
      await json(route, 404, errorBody(404, '존재하지 않는 업무 지시입니다.'))
      return
    }

    await json(route, 200, toDetail(task, members))
  })

  return handle
}

function toGroupResponse(group: MockGroup) {
  return {
    id: group.id,
    name: group.name,
    memberCount: group.members.length,
    members: group.members,
  }
}

function toListItem(task: MockTask, members: MockMember[]) {
  const assignees = toAssignees(task, members)

  return {
    id: task.id,
    title: task.title,
    assignees,
    assigneeCount: assignees.length,
    status: task.status,
    priority: task.priority,
    finishDate: task.finishDate,
  }
}

function toDetail(task: MockTask, members: MockMember[]) {
  const assignees = toAssignees(task, members)

  return {
    id: task.id,
    title: task.title,
    content: task.content,
    assignees,
    assigneeCount: assignees.length,
    status: task.status,
    priority: task.priority,
    finishDate: task.finishDate,
    createdAt: '2026-06-28T10:15:30',
    files: task.files,
    reports: [],
    progress: {
      total: assignees.length,
      approved: 0,
      rejected: 0,
      pending: assignees.length,
      missing: 0,
    },
  }
}

// 대표 담당자는 assigneeIds 의 첫 번째다. 서버 응답 순서를 그대로 흉내 낸다.
function toAssignees(task: MockTask, members: MockMember[]) {
  return task.assigneeIds.flatMap((id) => {
    const member = members.find((candidate) => candidate.id === id)
    return member ? [member] : []
  })
}

function nextId(tasks: MockTask[]) {
  return tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1
}

function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-09-09T19:56:53.62201',
    description: '에러 설명',
  }
}

async function delay(ms: number) {
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms))
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
