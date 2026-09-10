import { expect, test, type Page, type Route } from '@playwright/test'

// 승인된 시나리오(team-query-tree.test-scenarios.md: S1~S12)를 mock 으로 변환한 것.
// 대상: GET /team/tree. 담당자 선택 트리의 유일한 데이터 출처다.
// 조회는 폼 진입 시 발생하므로 goto 전에 route 를 건다. 실제 서버는 호출하지 않는다.

const teamTreePath = /\/api\/team\/tree(?:\?.*)?$/
const taskListPath = /\/api\/tasks(?:\?.*)?$/
const taskDetailPath = /\/api\/tasks\/12(?:\?.*)?$/

const teamTree = {
  totalMemberCount: 5,
  teams: [
    {
      id: 1,
      name: '동물 관리팀',
      memberCount: 2,
      members: [
        { id: 3, name: '이승현', position: '사원' },
        { id: 4, name: '홍길동', position: '과장' },
      ],
    },
    {
      id: 2,
      name: '창고팀',
      memberCount: 1,
      members: [{ id: 5, name: '이지아', position: '대리' }],
    },
  ],
  unassigned: {
    id: null,
    name: '미배정',
    memberCount: 2,
    members: [
      { id: 6, name: '배준영', position: null },
      { id: 7, name: '김수인', position: '사원' },
    ],
  },
}

const emptyTree = {
  totalMemberCount: 0,
  teams: [],
  unassigned: { id: null, name: '미배정', memberCount: 0, members: [] },
}

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-09-09T19:56:53.62201',
  description: '에러 설명',
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'team-query-tree-test-token')
  })
})

test('S1: 생성 화면 진입 시 트리를 한 번 조회한다', async ({ page }) => {
  let requestCount = 0
  let headers: Record<string, string> = {}
  let requestUrl = ''

  await page.route(teamTreePath, async (route) => {
    requestCount += 1
    headers = route.request().headers()
    requestUrl = route.request().url()
    await fulfillJson(route, 200, teamTree)
  })

  await page.goto('/tasks/create')

  await expect(allEmployees(page)).toBeVisible()
  expect(requestCount).toBe(1)
  expect(headers.authorization).toMatch(/^Bearer /)
  expect(new URL(requestUrl).search).toBe('')
  await expect(page.getByText('0/5명')).toBeVisible()
  await expect(groupCheckbox(page, '동물 관리팀')).toBeVisible()
  await expect(page.getByText('0/2명').first()).toBeVisible()
  await expect(groupCheckbox(page, '창고팀')).toBeVisible()
  await expect(groupCheckbox(page, '미배정')).toBeVisible()

  // 미배정은 마지막 팀 행이다.
  const rowLabels = await page.getByRole('treeitem').allInnerTexts()
  expect(rowLabels.at(-1)).toContain('미배정')

  // 진입 시 모든 팀이 접혀 있다.
  await expect(page.getByRole('checkbox', { name: '이승현 사원' })).toHaveCount(0)
})

test('S2: 직급이 없는 직원은 이름만 표시한다', async ({ page }) => {
  await mockTree(page, 200, teamTree)
  await page.goto('/tasks/create')

  await page.getByRole('button', { name: '동물 관리팀 펼치기' }).click()
  await expect(page.getByRole('checkbox', { name: '이승현 사원' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: '홍길동 과장' })).toBeVisible()

  await page.getByRole('button', { name: '미배정 펼치기' }).click()
  await expect(page.getByRole('checkbox', { name: '배준영' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: '김수인 사원' })).toBeVisible()
})

test('S3: 팀 체크박스로 소속 전원을 선택한다', async ({ page }) => {
  await mockTree(page, 200, teamTree)
  await page.goto('/tasks/create')

  await groupCheckbox(page, '동물 관리팀').check()

  await expect(groupCheckbox(page, '동물 관리팀')).toBeChecked()
  await expect(page.getByText('2/2명')).toBeVisible()
  await expect(page.getByText('2/5명')).toBeVisible()
  await expect(allEmployeesRow(page)).toHaveAttribute('aria-checked', 'mixed')
})

test('S4: 미배정 그룹도 팀 행처럼 동작한다', async ({ page }) => {
  await mockTree(page, 200, teamTree)
  await page.goto('/tasks/create')

  await groupCheckbox(page, '미배정').check()

  await expect(groupCheckbox(page, '미배정')).toBeChecked()
  await expect(page.getByText('2/2명')).toBeVisible()
  await expect(page.getByText('2/5명')).toBeVisible()
})

test('S5: 전체 직원 토글', async ({ page }) => {
  await mockTree(page, 200, teamTree)
  await page.goto('/tasks/create')

  await allEmployees(page).check()

  await expect(page.getByText('5/5명')).toBeVisible()
  await expect(groupCheckbox(page, '동물 관리팀')).toBeChecked()
  await expect(groupCheckbox(page, '창고팀')).toBeChecked()
  await expect(groupCheckbox(page, '미배정')).toBeChecked()

  await allEmployees(page).uncheck()
  await expect(page.getByText('0/5명')).toBeVisible()
  await expect(groupCheckbox(page, '동물 관리팀')).not.toBeChecked()
})

test('S6: 직원이 없으면 오류가 아니라 빈 상태다', async ({ page }) => {
  await mockTree(page, 200, emptyTree)
  await page.goto('/tasks/create')

  await expect(page.getByText('0/0명')).toHaveCount(2)
  await expect(page.getByRole('alert')).toHaveCount(0)

  await fillValidTask(page)
  await page.getByRole('button', { name: '생성하기' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    '담당자를 선택해주세요',
  )
})

test('S7: 401이면 오류를 드러내고 제출을 막는다', async ({ page }) => {
  await mockTree(page, 401, errorBody(401, '만료된 토큰입니다.'))
  await page.goto('/tasks/create')

  await expectTreeError(page)
})

test('S8: 404여도 같은 오류 처리를 한다', async ({ page }) => {
  await mockTree(page, 404, errorBody(404, '존재하지 않는 자료입니다.'))
  await page.goto('/tasks/create')

  await expectTreeError(page)
})

test('S9: 500이면 오류를 드러내고 제출을 막는다', async ({ page }) => {
  await mockTree(page, 500, errorBody(500, '예상하지 못한 에러가 발생했습니다.'))
  await page.goto('/tasks/create')

  await expectTreeError(page)
})

test('S10: Contract 밖 응답은 성공으로 처리하지 않는다', async ({ page }) => {
  await mockTree(page, 200, { teams: [] })
  await page.goto('/tasks/create')

  await expectTreeError(page)
})

test('S11: 수정 화면은 assignees[].id 로 체크를 복원한다', async ({ page }) => {
  await mockTree(page, 200, teamTree)
  await page.route(taskDetailPath, async (route) => {
    await fulfillJson(route, 200, taskDetail([3, 6]))
  })

  await page.goto('/tasks/12/edit')

  await expect(page.getByText('2/5명')).toBeVisible()
  await expect(groupCheckbox(page, '동물 관리팀')).toHaveAttribute(
    'data-state',
    'mixed',
  )
  await expect(groupCheckbox(page, '미배정')).toHaveAttribute(
    'data-state',
    'mixed',
  )

  // 진입 시 팀은 접혀 있다.
  await expect(page.getByRole('checkbox', { name: '이승현 사원' })).toHaveCount(0)
  await page.getByRole('button', { name: '동물 관리팀 펼치기' }).click()
  await expect(page.getByRole('checkbox', { name: '이승현 사원' })).toBeChecked()
  await expect(
    page.getByRole('checkbox', { name: '홍길동 과장' }),
  ).not.toBeChecked()
})

test('S12: 업무지시 생성은 팀 트리 캐시를 무효화하지 않는다', async ({
  page,
}) => {
  let treeRequestCount = 0
  let listRequestCount = 0

  await page.route(teamTreePath, async (route) => {
    treeRequestCount += 1
    await fulfillJson(route, 200, teamTree)
  })
  await page.route(taskListPath, async (route) => {
    if (route.request().method() === 'POST') {
      await fulfillJson(route, 201, { message: '업무지시가 등록되었습니다.' })
      return
    }

    listRequestCount += 1
    await fulfillJson(route, 200, { tasks: [], totalPageSize: 0 })
  })

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await groupCheckbox(page, '창고팀').check()
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect.poll(() => listRequestCount).toBeGreaterThan(0)
  expect(treeRequestCount).toBe(1)
})

async function mockTree(page: Page, status: number, body: unknown) {
  await page.route(teamTreePath, async (route) => {
    await fulfillJson(route, status, body)
  })
}

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function expectTreeError(page: Page) {
  await expect(page.getByRole('alert')).toContainText(
    '담당자 목록을 불러오지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByRole('checkbox', { name: /^전체 직원/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '생성하기' })).toBeDisabled()
}

async function fillValidTask(page: Page) {
  await page.getByRole('radio', { name: '상' }).check()
  await page.getByLabel('완료기한').fill('2026-12-31')
  await page.getByLabel(/제목/).fill('유효한 업무')
  await page.getByLabel(/상세 업무 내용/).fill('상세 업무 내용입니다.')
}

function taskDetail(assigneeIds: number[]) {
  const members = [
    ...teamTree.teams.flatMap((team) => team.members),
    ...teamTree.unassigned.members,
  ]

  return {
    id: 12,
    title: '9월 정기 안전점검',
    content: '놀이기구 전수 점검 후 체크리스트를 제출해주세요.',
    assignees: members.filter((member) => assigneeIds.includes(member.id)),
    assigneeCount: assigneeIds.length,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    finishDate: '2026-09-05',
    createdAt: '2026-08-28T10:15:30',
    files: [],
    reports: [],
    progress: { total: 2, approved: 0, rejected: 0, pending: 2, missing: 0 },
  }
}

function allEmployees(page: Page) {
  return page.getByRole('checkbox', { name: /^전체 직원/ })
}

function allEmployeesRow(page: Page) {
  return page.getByRole('treeitem').filter({ hasText: '전체 직원' })
}

function groupCheckbox(page: Page, groupName: string) {
  return page.getByRole('checkbox', { name: new RegExp(`^${groupName} `) })
}
