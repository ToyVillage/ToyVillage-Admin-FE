import { expect, test, type Page, type Route } from '@playwright/test'

// 승인된 시나리오(task-update.test-scenarios.md: S1~S17)를 mock 으로 변환한 것.
// 대상: PUT /tasks/{id}. 상세 조회(초기값)와 팀 트리(담당자)가 선행하고,
// 새 첨부만 POST /file 로 업로드해 기존 fileKey 와 합쳐 보낸다. 실제 서버는 호출하지 않는다.

const taskDetailPath = /^https:\/\/[^/]+\/tasks\/12(?:\?.*)?$/
const taskListPath = /^https:\/\/[^/]+\/tasks(?:\?.*)?$/
const teamTreePath = /^https:\/\/[^/]+\/team\/tree(?:\?.*)?$/
const filePath = /^https:\/\/[^/]+\/file(?:\?.*)?$/

const existingFileKey = '2026/08/28/guide_a1b2c3.pdf'

const detail = {
  id: 12,
  title: '9월 정기 안전점검',
  content: '놀이기구 전수 점검 후 체크리스트를 제출해주세요.',
  assignees: [{ id: 3, name: '이승현', position: '사원' }],
  assigneeCount: 1,
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  finishDate: '2026-09-05',
  createdAt: '2026-08-28T10:15:30',
  files: [{ fileName: '당일 지침.pdf', fileKey: existingFileKey }],
  reports: [],
  progress: { total: 1, approved: 0, rejected: 0, pending: 1, missing: 0 },
}

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

const editedTitle = '9월 정기 안전점검(수정)'

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-09-09T19:56:53.62201',
  description: '에러 설명',
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'task-update-test-token')
  })
  await page.route(teamTreePath, async (route) => {
    await fulfillJson(route, 200, teamTree)
  })
})

test('S1: 제목만 고쳐도 6필드를 전부 보내고 상세로 이동한다', async ({
  page,
}) => {
  const updated = trackUpdate(page, 200, {
    message: '업무지시가 수정되었습니다.',
  })

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks\/12$/)
  expect(updated.count).toBe(1)
  expect(updated.headers['content-type']).toContain('application/json')
  expect(updated.headers.authorization).toMatch(/^Bearer /)
  expect(updated.body).toEqual({
    title: editedTitle,
    content: detail.content,
    assigneeIds: [3],
    finishDate: detail.finishDate,
    priority: 'HIGH',
    files: [existingFileKey],
  })
})

test('S2: 담당자를 바꾸면 전체 교체로 보낸다', async ({ page }) => {
  const updated = trackUpdate(page, 200, { message: '수정되었습니다.' })

  await page.goto('/tasks/12/edit')
  await expandTeam(page)
  await page.getByRole('checkbox', { name: '이승현 사원' }).uncheck()
  await page.getByRole('checkbox', { name: '홍길동 과장' }).check()
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks\/12$/)
  expect((updated.body as { assigneeIds: number[] }).assigneeIds).toEqual([4])
})

test('S3: 담당자를 추가하면 트리 순서로 보낸다', async ({ page }) => {
  const updated = trackUpdate(page, 200, { message: '수정되었습니다.' })

  await page.goto('/tasks/12/edit')
  await expandTeam(page)
  await page.getByRole('checkbox', { name: '홍길동 과장' }).check()
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks\/12$/)
  expect((updated.body as { assigneeIds: number[] }).assigneeIds).toEqual([3, 4])
})

test('S4: 새 첨부는 업로드해 기존 fileKey 뒤에 붙인다', async ({ page }) => {
  const updated = trackUpdate(page, 200, { message: '수정되었습니다.' })
  let uploadCount = 0

  await page.route(filePath, async (route) => {
    uploadCount += 1
    await fulfillJson(route, 200, { fileKey: '2026/09/05/new_x9y8z7.png' })
  })

  await page.goto('/tasks/12/edit')
  await uploadInput(page).setInputFiles([filePayload('new.png', 'image/png')])
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks\/12$/)
  expect(uploadCount).toBe(1)
  expect((updated.body as { files: string[] }).files).toEqual([
    existingFileKey,
    '2026/09/05/new_x9y8z7.png',
  ])
})

test('S5: 첨부를 모두 지우면 빈 배열을 보낸다', async ({ page }) => {
  const updated = trackUpdate(page, 200, { message: '수정되었습니다.' })
  let uploadCount = 0

  await page.route(filePath, async (route) => {
    uploadCount += 1
    await fulfillJson(route, 200, { fileKey: 'unused' })
  })

  await page.goto('/tasks/12/edit')
  const removeButton = page.locator('button[aria-label="당일 지침.pdf 삭제"]')
  await removeButton.locator('..').hover()
  await removeButton.click()
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks\/12$/)
  expect(uploadCount).toBe(0)
  expect((updated.body as { files: string[] }).files).toEqual([])
})

test('S6: 클라이언트 검증이 요청보다 먼저다', async ({ page }) => {
  const updated = trackUpdate(page, 200, { message: '수정되었습니다.' })

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill('')
  await page.getByRole('button', { name: '저장하기' }).click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toContainText('제목을 입력해주세요')
  await dialog.getByRole('button', { name: '확인' }).click()

  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByLabel(/상세 업무 내용/).fill('')
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    '상세 업무 내용을 입력해주세요',
  )

  expect(updated.count).toBe(0)
})

test('S7: HTTP 400 이면 입력을 보존하고 다시 제출할 수 있다', async ({
  page,
}) => {
  const updated = trackUpdate(page, 400, errorBody(400, '요청이 유효하지 않습니다.'))

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page)
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect.poll(() => updated.count).toBe(2)
})

test('S8: HTTP 401 이면 실패를 드러낸다', async ({ page }) => {
  trackUpdate(page, 401, errorBody(401, '만료된 토큰입니다.'))

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page)
})

test('S9: HTTP 403 이면 실패를 드러낸다', async ({ page }) => {
  trackUpdate(page, 403, { ...errorBody(403, ''), message: '' })

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page)
})

test('S10: HTTP 404 를 성공으로 처리하지 않는다', async ({ page }) => {
  trackUpdate(page, 404, errorBody(404, '존재하지 않는 업무 지시입니다.'))

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page)
})

test('S11: HTTP 500 이면 실패를 드러낸다', async ({ page }) => {
  trackUpdate(page, 500, errorBody(500, '예상하지 못한 에러가 발생했습니다.'))

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page)
})

test('S12: 파일 업로드가 실패하면 수정 요청을 보내지 않는다', async ({
  page,
}) => {
  const updated = trackUpdate(page, 200, { message: '수정되었습니다.' })

  await page.route(filePath, async (route) => {
    await fulfillJson(
      route,
      500,
      errorBody(500, '예상하지 못한 에러가 발생했습니다.'),
    )
  })

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await uploadInput(page).setInputFiles([filePayload('new.png', 'image/png')])
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page)
  expect(updated.count).toBe(0)
})

test('S13: 연속 제출에도 PUT 은 한 번만 보낸다', async ({ page }) => {
  let count = 0
  let release: (() => void) | undefined
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })

  await page.route(taskDetailPath, async (route) => {
    if (route.request().method() === 'PUT') {
      count += 1
      await gate
      await fulfillJson(route, 200, { message: '수정되었습니다.' })
      return
    }

    await fulfillJson(route, 200, detail)
  })

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByRole('button', { name: '저장하기' }).click()

  const pendingButton = page.getByRole('button', { name: '저장 중' })
  await expect(pendingButton).toBeDisabled()
  await pendingButton.click({ force: true })

  release?.()
  await expect(page).toHaveURL(/\/tasks\/12$/)
  expect(count).toBe(1)
})

test('S14: Contract 밖 응답은 성공으로 처리하지 않는다', async ({ page }) => {
  trackUpdate(page, 200, { result: 'ok' })

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page)
})

test('S15: 승인되지 않은 성공 status 는 거부한다', async ({ page }) => {
  trackUpdate(page, 201, { message: '업무지시가 수정되었습니다.' })

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page)
})

test('S16: 성공 후 상세를 다시 조회해 최신 값을 보여준다', async ({ page }) => {
  let detailRequestCount = 0

  await page.route(taskDetailPath, async (route) => {
    if (route.request().method() === 'PUT') {
      await fulfillJson(route, 200, { message: '수정되었습니다.' })
      return
    }

    detailRequestCount += 1
    await fulfillJson(
      route,
      200,
      detailRequestCount === 1 ? detail : { ...detail, title: editedTitle },
    )
  })

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/tasks\/12$/)
  await expect(page.getByRole('heading', { name: editedTitle })).toBeVisible()
  // `['tasks']` 무효화로 한 번, 상세 화면 진입으로 한 번 재조회된다.
  expect(detailRequestCount).toBeGreaterThan(1)
})

test('S17: 작성 중 이탈 방지 동작을 유지한다', async ({ page }) => {
  const updated = trackUpdate(page, 200, { message: '수정되었습니다.' })

  await page.goto('/tasks/12/edit')
  await page.getByLabel(/제목/).fill(editedTitle)
  await page.getByRole('link', { name: '뒤로가기' }).click()

  const dialog = page.getByRole('alertdialog', {
    name: '정말 나가시겠습니까?',
  })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '취소' }).click()

  await expect(page).toHaveURL(/\/tasks\/12\/edit$/)
  await expect(page.getByLabel(/제목/)).toHaveValue(editedTitle)
  expect(updated.count).toBe(0)
})

interface UpdateTracker {
  count: number
  body: unknown
  headers: Record<string, string>
}

function trackUpdate(page: Page, status: number, body: unknown): UpdateTracker {
  const tracker: UpdateTracker = { count: 0, body: undefined, headers: {} }

  void page.route(taskListPath, async (route) => {
    await fulfillJson(route, 200, { tasks: [], totalPageSize: 0 })
  })
  void page.route(taskDetailPath, async (route) => {
    const request = route.request()

    if (request.method() === 'PUT') {
      tracker.count += 1
      tracker.body = request.postDataJSON()
      tracker.headers = request.headers()
      await fulfillJson(route, status, body)
      return
    }

    await fulfillJson(route, 200, detail)
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

async function expectUpdateFailure(page: Page) {
  await expect(page).toHaveURL(/\/tasks\/12\/edit$/)
  await expect(
    page.getByText('저장하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(page.getByLabel(/제목/)).toHaveValue(editedTitle)
}

async function expandTeam(page: Page) {
  await page.getByRole('button', { name: '동물 관리팀 펼치기' }).click()
}

function uploadInput(page: Page) {
  return page.getByLabel('첨부파일 선택')
}

function filePayload(name: string, mimeType: string) {
  return { name, mimeType, buffer: Buffer.from(`fixture for ${name}`) }
}
