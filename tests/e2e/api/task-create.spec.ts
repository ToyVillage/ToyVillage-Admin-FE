import { expect, test, type Page, type Route } from '@playwright/test'

// 승인된 시나리오(task-create.test-scenarios.md: S1~S15)를 mock 으로 변환한 것.
// 대상: POST /tasks. 담당자 트리(GET /team/tree)와 첨부 업로드(POST /file)가 선행한다.
// 실제 서버는 호출하지 않는다.

const taskListPath = /^https:\/\/[^/]+\/tasks(?:\?.*)?$/
const teamTreePath = /^https:\/\/[^/]+\/team\/tree(?:\?.*)?$/
const filePath = /^https:\/\/[^/]+\/file(?:\?.*)?$/

const teamTree = {
  totalMemberCount: 2,
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
  ],
  unassigned: { id: null, name: '미배정', memberCount: 0, members: [] },
}

const validTask = {
  title: '9월 정기 안전점검',
  content: '놀이기구 전수 점검 후 체크리스트를 제출해주세요.',
  finishDate: '2026-09-05',
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
    localStorage.setItem('accessToken', 'task-create-test-token')
  })
  await page.route(teamTreePath, async (route) => {
    await fulfillJson(route, 200, teamTree)
  })
})

test('S1: 유효 입력으로 POST 를 한 번 보내고 목록으로 이동한다', async ({
  page,
}) => {
  const created = trackCreate(page, 201, {
    message: '업무지시가 등록되었습니다.',
  })

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(
    page.getByRole('status').filter({ hasText: '데이터 생성에 성공했습니다' }),
  ).toBeVisible()
  expect(created.count).toBe(1)
  expect(created.headers['content-type']).toContain('application/json')
  expect(created.headers.authorization).toMatch(/^Bearer /)
  expect(created.body).toEqual({
    title: validTask.title,
    content: validTask.content,
    assigneeIds: [3],
    finishDate: validTask.finishDate,
    priority: 'HIGH',
    files: [],
  })
})

test('S2: 담당자 여러 명은 트리 순서로 보낸다', async ({ page }) => {
  const created = trackCreate(page, 201, { message: '등록되었습니다.' })

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await groupCheckbox(page, '동물 관리팀').check()
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  expect((created.body as { assigneeIds: number[] }).assigneeIds).toEqual([3, 4])
})

test('S3: 첨부는 업로드 후 fileKey 를 순서대로 전달한다', async ({ page }) => {
  const created = trackCreate(page, 201, { message: '등록되었습니다.' })
  const uploads: string[] = []

  await page.route(filePath, async (route) => {
    const index = uploads.length
    uploads.push(String(index))
    await fulfillJson(route, 200, {
      fileKey:
        index === 0 ? '2026/08/24/a_a1b2c3.pdf' : '2026/08/24/b_d4e5f6.png',
    })
  })

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await uploadInput(page).setInputFiles([
    filePayload('a.pdf', 'application/pdf'),
    filePayload('b.png', 'image/png'),
  ])
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  expect(uploads).toHaveLength(2)
  expect((created.body as { files: string[] }).files).toEqual([
    '2026/08/24/a_a1b2c3.pdf',
    '2026/08/24/b_d4e5f6.png',
  ])
})

test('S4: 첨부가 없으면 업로드 없이 files 를 빈 배열로 보낸다', async ({
  page,
}) => {
  const created = trackCreate(page, 201, { message: '등록되었습니다.' })
  let uploadCount = 0

  await page.route(filePath, async (route) => {
    uploadCount += 1
    await fulfillJson(route, 200, { fileKey: 'unused' })
  })

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  expect(uploadCount).toBe(0)
  expect((created.body as { files: string[] }).files).toEqual([])
})

test('S5: 클라이언트 검증이 요청보다 먼저다', async ({ page }) => {
  const created = trackCreate(page, 201, { message: '등록되었습니다.' })

  const cases: [string, string][] = [
    ['priority', '우선순위를 선택해주세요'],
    ['dueDate', '완료기한을 선택해주세요'],
    ['title', '제목을 입력해주세요'],
    ['content', '상세 업무 내용을 입력해주세요'],
    ['assignee', '담당자를 선택해주세요'],
  ]

  for (const [skip, message] of cases) {
    await page.goto('/tasks/create')
    await fillValidTask(page, skip)
    if (skip !== 'assignee') await checkMember(page, '이승현 사원')
    await page.getByRole('button', { name: '생성하기' }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toContainText(message)
    await dialog.getByRole('button', { name: '확인' }).click()
    await expect(page).toHaveURL(/\/tasks\/create$/)
  }

  expect(created.count).toBe(0)
})

test('S6: HTTP 400 이면 입력을 보존하고 다시 제출할 수 있다', async ({
  page,
}) => {
  const created = trackCreate(page, 400, errorBody(400, '요청이 유효하지 않습니다.'))

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page)
  await page.getByRole('button', { name: '생성하기' }).click()
  await expect.poll(() => created.count).toBe(2)
})

test('S7: HTTP 401 이면 실패를 드러낸다', async ({ page }) => {
  trackCreate(page, 401, errorBody(401, '만료된 토큰입니다.'))

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page)
})

test('S8: HTTP 403 이면 실패를 드러낸다', async ({ page }) => {
  trackCreate(page, 403, { ...errorBody(403, ''), message: '' })

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page)
})

test('S9: HTTP 500 이면 실패를 드러낸다', async ({ page }) => {
  trackCreate(page, 500, errorBody(500, '예상하지 못한 에러가 발생했습니다.'))

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page)
})

test('S10: 파일 업로드가 실패하면 생성 요청을 보내지 않는다', async ({
  page,
}) => {
  const created = trackCreate(page, 201, { message: '등록되었습니다.' })

  await page.route(filePath, async (route) => {
    await fulfillJson(
      route,
      500,
      errorBody(500, '예상하지 못한 에러가 발생했습니다.'),
    )
  })

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await uploadInput(page).setInputFiles([filePayload('a.pdf', 'application/pdf')])
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page)
  expect(created.count).toBe(0)
})

test('S11: 연속 제출에도 POST 는 한 번만 보낸다', async ({ page }) => {
  let count = 0
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })

  await page.route(taskListPath, async (route) => {
    if (route.request().method() === 'POST') {
      count += 1
      await gate
      await fulfillJson(route, 201, { message: '등록되었습니다.' })
      return
    }

    await fulfillJson(route, 200, { tasks: [], totalPageSize: 0 })
  })

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await page.getByRole('button', { name: '생성하기' }).click()

  const pendingButton = page.getByRole('button', { name: '생성 중' })
  await expect(pendingButton).toBeDisabled()
  await pendingButton.click({ force: true })

  release?.()
  await expect(page).toHaveURL(/\/tasks$/)
  expect(count).toBe(1)
})

test('S12: Contract 밖 응답은 성공으로 처리하지 않는다', async ({ page }) => {
  trackCreate(page, 201, { result: 'ok' })

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page)
})

test('S13: 승인되지 않은 성공 status 는 거부한다', async ({ page }) => {
  trackCreate(page, 200, { message: '업무지시가 등록되었습니다.' })

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expectCreateFailure(page)
})

test('S14: 성공 후 목록 캐시를 무효화한다', async ({ page }) => {
  let listRequestCount = 0

  await page.route(taskListPath, async (route) => {
    if (route.request().method() === 'POST') {
      await fulfillJson(route, 201, { message: '등록되었습니다.' })
      return
    }

    listRequestCount += 1
    await fulfillJson(route, 200, {
      tasks: [
        {
          id: 12,
          title: validTask.title,
          assignees: [{ id: 3, name: '이승현', position: '사원' }],
          assigneeCount: 1,
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          finishDate: validTask.finishDate,
        },
      ],
      totalPageSize: 1,
    })
  })

  await page.goto('/tasks/create')
  await fillValidTask(page)
  await checkMember(page, '이승현 사원')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/tasks$/)
  await expect(page.getByTestId('task-row')).toHaveCount(1)
  await expect(page.getByTestId('task-row')).toContainText(validTask.title)
  expect(listRequestCount).toBe(1)
})

test('S15: 작성 중 이탈 방지 동작을 유지한다', async ({ page }) => {
  const created = trackCreate(page, 201, { message: '등록되었습니다.' })

  await page.goto('/tasks/create')
  await page.getByLabel(/제목/).fill('작성 중인 업무')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  const dialog = page.getByRole('alertdialog', {
    name: '정말 나가시겠습니까?',
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '취소' }).click()

  await expect(page).toHaveURL(/\/tasks\/create$/)
  await expect(page.getByLabel(/제목/)).toHaveValue('작성 중인 업무')
  expect(created.count).toBe(0)
})

interface CreateTracker {
  count: number
  body: unknown
  headers: Record<string, string>
}

function trackCreate(page: Page, status: number, body: unknown): CreateTracker {
  const tracker: CreateTracker = { count: 0, body: undefined, headers: {} }

  void page.route(taskListPath, async (route) => {
    const request = route.request()

    if (request.method() === 'POST') {
      tracker.count += 1
      tracker.body = request.postDataJSON()
      tracker.headers = request.headers()
      await fulfillJson(route, status, body)
      return
    }

    await fulfillJson(route, 200, { tasks: [], totalPageSize: 0 })
  })

  return tracker
}

async function fulfillJson(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function expectCreateFailure(page: Page) {
  await expect(page).toHaveURL(/\/tasks\/create$/)
  await expect(
    page.getByText('생성하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(page.getByLabel(/제목/)).toHaveValue(validTask.title)
}

async function fillValidTask(page: Page, skip?: string) {
  if (skip !== 'priority') await page.getByRole('radio', { name: '상' }).check()
  if (skip !== 'dueDate') {
    await page.getByLabel('완료기한').fill(validTask.finishDate)
  }
  if (skip !== 'title') await page.getByLabel(/제목/).fill(validTask.title)
  if (skip !== 'content') {
    await page.getByLabel(/상세 업무 내용/).fill(validTask.content)
  }
}

async function checkMember(page: Page, label: string) {
  await page.getByRole('button', { name: '동물 관리팀 펼치기' }).click()
  await page.getByRole('checkbox', { name: label }).check()
}

function groupCheckbox(page: Page, groupName: string) {
  return page.getByRole('checkbox', { name: new RegExp(`^${groupName} `) })
}

function uploadInput(page: Page) {
  return page.getByLabel('첨부파일 선택')
}

function filePayload(name: string, mimeType: string) {
  return { name, mimeType, buffer: Buffer.from(`fixture for ${name}`) }
}
