import { expect, test, type Page, type Route } from '@playwright/test'
import { mockTeamList } from '../support/team-api'

const detailApiPath = /^https:\/\/[^/]+\/notice\/[^/?]+(?:\?.*)?$/
const listApiPath = /^https:\/\/[^/]+\/notice(?:\?.*)?$/
const fileApiPath = /^https:\/\/[^/]+\/file(?:\?.*)?$/

test('S1: route ID와 JSON body로 공지를 한 번 수정하고 목록으로 이동한다', async ({
  page,
}) => {
  let updateRequestCount = 0
  let updateRequestBody: unknown
  let updateRequestHeaders: Record<string, string> = {}

  await page.route(detailApiPath, async (route) => {
    const request = route.request()

    if (request.method() === 'PUT') {
      updateRequestCount += 1
      updateRequestBody = request.postDataJSON()
      updateRequestHeaders = request.headers()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '공지 수정 성공' }),
      })
      return
    }

    await fulfillNoticeDetail(route, {
      id: 7,
      title: '수정 전 공지',
      content: '수정 전 내용',
    })
  })
  await page.route(listApiPath, async (route) => {
    await fulfillNoticeList(route, 'API 수정 공지')
  })

  await page.goto('/notices/list/7/edit')
  await fillNotice(page, 'API 수정 공지', 'API 수정 내용')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/notices\/list$/)
  await expect(page.getByTestId('notice-row')).toContainText('API 수정 공지')
  expect(updateRequestCount).toBe(1)
  expect(updateRequestHeaders['content-type']).toContain('application/json')
  expect(updateRequestHeaders.authorization).toMatch(/^Bearer /)
  expect(updateRequestBody).toEqual({
    title: 'API 수정 공지',
    teamIds: [],
    content: 'API 수정 내용',
    files: [],
  })
})

test('S2: 존재하지 않는 팀(HTTP 404)이면 입력을 보존하고 다시 제출할 수 있다', async ({
  page,
}) => {
  await mockUpdateError(page, 404, '존재하지 않는 팀입니다.')

  await page.goto('/notices/list/7/edit')
  await fillNotice(page, '검증 오류 공지', '검증 오류 내용')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page, '검증 오류 공지', '검증 오류 내용')
})

test('S3: HTTP 403이면 세션을 비우고 로그인으로 보낸다', async ({ page }) => {
  await mockUpdateError(page, 403, '접근할 수 있는 권한이 없습니다.')

  await page.goto('/notices/list/7/edit')
  await fillNotice(page, '권한 오류 공지', '권한 오류 내용')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/login$/)
  expect(
    await page.evaluate(() => localStorage.getItem('accessToken')),
  ).toBeNull()
})

test('S4: HTTP 404이면 mock 저장으로 대체하지 않는다', async ({ page }) => {
  await mockUpdateError(page, 404, '존재하지 않는 공지사항입니다.', 999)

  await page.goto('/notices/list/999/edit')
  await fillNotice(page, '없는 공지', '없는 공지 내용')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page, '없는 공지', '없는 공지 내용')
})

test('S5: HTTP 500이면 입력을 보존하고 재시도할 수 있다', async ({ page }) => {
  await mockUpdateError(page, 500, '예상하지 못한 에러가 발생했습니다.')

  await page.goto('/notices/list/7/edit')
  await fillNotice(page, '서버 오류 공지', '서버 오류 내용')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page, '서버 오류 공지', '서버 오류 내용')
})

test('S6: 연속 submit에도 수정 요청은 한 번만 전송한다', async ({ page }) => {
  let updateRequestCount = 0
  let releaseResponse: (() => void) | undefined
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve
  })

  await page.route(detailApiPath, async (route) => {
    if (route.request().method() === 'PUT') {
      updateRequestCount += 1
      await responseGate
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '공지 수정 성공' }),
      })
      return
    }

    await fulfillNoticeDetail(route, {
      id: 7,
      title: '수정 전 공지',
      content: '수정 전 내용',
    })
  })
  await page.route(listApiPath, async (route) => {
    await fulfillNoticeList(route, '중복 방지 공지')
  })

  await page.goto('/notices/list/7/edit')
  await fillNotice(page, '중복 방지 공지', '중복 방지 내용')
  await page.getByRole('button', { name: '저장하기' }).evaluate((button) => {
    const form = button.closest('form')
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
    form?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    )
  })

  await expect.poll(() => updateRequestCount).toBe(1)
  releaseResponse?.()

  await expect(page).toHaveURL(/\/notices\/list$/)
  expect(updateRequestCount).toBe(1)
})

test('S7: HTTP 200 응답이 Contract와 다르면 성공 처리하지 않는다', async ({
  page,
}) => {
  await page.route(detailApiPath, async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: 'ok' }),
      })
      return
    }

    await fulfillNoticeDetail(route, {
      id: 7,
      title: '수정 전 공지',
      content: '수정 전 내용',
    })
  })

  await page.goto('/notices/list/7/edit')
  await fillNotice(page, '잘못된 응답 공지', '잘못된 응답 내용')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page, '잘못된 응답 공지', '잘못된 응답 내용')
})

test('S8: 기존 공지의 팀을 그대로 두면 그 팀 id를 teamIds로 보낸다', async ({
  page,
}) => {
  let updateRequestBody: unknown

  await page.route(detailApiPath, async (route) => {
    if (route.request().method() === 'PUT') {
      updateRequestBody = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '공지 수정 성공' }),
      })
      return
    }

    await fulfillNoticeDetail(route, {
      id: 7,
      title: '팀 공지',
      content: '팀 공지 내용',
      teams: [
        { id: 2, name: '창고팀' },
        { id: 4, name: '사육팀' },
      ],
    })
  })
  await page.route(listApiPath, async (route) => {
    await fulfillNoticeList(route, '팀 공지 수정')
  })
  // id는 배열 순서로 매겨진다: 창고팀 2, 사육팀 4.
  await mockTeamList(page, ['동물 관리팀', '창고팀', '조류팀', '사육팀'])

  await page.goto('/notices/list/7/edit')
  await expect(page.getByRole('checkbox', { name: '창고팀' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: '사육팀' })).toBeChecked()
  await fillNotice(page, '팀 공지 수정', '팀 공지 내용')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/notices\/list$/)
  expect(updateRequestBody).toEqual({
    title: '팀 공지 수정',
    teamIds: [2, 4],
    content: '팀 공지 내용',
    files: [],
  })
})

test('S9: 지운 첨부는 빼고 새 첨부만 올려 files로 보낸다', async ({ page }) => {
  let uploadCount = 0
  let updateRequestBody: unknown

  await page.route(detailApiPath, async (route) => {
    if (route.request().method() === 'PUT') {
      updateRequestBody = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '공지 수정 성공' }),
      })
      return
    }

    await fulfillNoticeDetail(route, {
      id: 7,
      title: '첨부 공지',
      content: '첨부 내용',
      files: [
        { fileName: '당일 지침.pdf', fileKey: 'old-key-1' },
        { fileName: '휴관안내.png', fileKey: 'old-key-2' },
      ],
    })
  })
  await page.route(fileApiPath, async (route) => {
    uploadCount += 1
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ fileKey: 'new-key-1' }),
    })
  })
  await page.route(listApiPath, async (route) => {
    await fulfillNoticeList(route, '첨부 수정 공지')
  })

  await page.goto('/notices/list/7/edit')
  const removeButton = page.getByRole('button', { name: '당일 지침.pdf 삭제' })
  await removeButton.focus()
  await removeButton.press('Enter')
  await page.getByLabel('첨부파일 선택').setInputFiles({
    name: '새 안내.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('notice'),
  })
  await fillNotice(page, '첨부 수정 공지', '첨부 수정 내용')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/notices\/list$/)
  expect(uploadCount).toBe(1)
  expect(updateRequestBody).toEqual({
    title: '첨부 수정 공지',
    teamIds: [],
    content: '첨부 수정 내용',
    files: ['old-key-2', 'new-key-1'],
  })
})

test('S10: 새 첨부 업로드가 실패하면 수정 요청을 보내지 않는다', async ({
  page,
}) => {
  let updateRequestCount = 0

  await page.route(detailApiPath, async (route) => {
    if (route.request().method() === 'PUT') {
      updateRequestCount += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '공지 수정 성공' }),
      })
      return
    }

    await fulfillNoticeDetail(route, {
      id: 7,
      title: '첨부 공지',
      content: '첨부 내용',
    })
  })
  await page.route(fileApiPath, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '서버 오류',
        status: 500,
        timestamp: '2026-09-19T12:00:00',
        description: '서버 오류',
      }),
    })
  })

  await page.goto('/notices/list/7/edit')
  await page.getByLabel('첨부파일 선택').setInputFiles({
    name: '새 안내.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('notice'),
  })
  await fillNotice(page, '업로드 실패 공지', '업로드 실패 내용')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expectUpdateFailure(page, '업로드 실패 공지', '업로드 실패 내용')
  expect(updateRequestCount).toBe(0)
})

async function fillNotice(page: Page, title: string, content: string) {
  await page.getByLabel('제목').fill(title)
  await page.getByLabel('내용').fill(content)
}

async function expectUpdateFailure(page: Page, title: string, content: string) {
  await expect(page).toHaveURL(/\/notices\/list\/\d+\/edit$/)
  await expect(page.getByLabel('제목')).toHaveValue(title)
  await expect(page.getByLabel('내용')).toHaveValue(content)
  await expect(
    page.getByText('저장하지 못했습니다. 다시 시도해 주세요.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '저장하기' })).toBeEnabled()
}

async function mockUpdateError(
  page: Page,
  status: number,
  message: string,
  id = 7,
) {
  await page.route(detailApiPath, async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          message,
          status,
          timestamp: '2026-07-28T12:00:00',
          description: '에러 설명',
        }),
      })
      return
    }

    await fulfillNoticeDetail(route, {
      id,
      title: '수정 전 공지',
      content: '수정 전 내용',
    })
  })
}

async function fulfillNoticeDetail(
  route: Route,
  notice: {
    id: number
    title: string
    content: string
    teams?: { id: number; name: string }[]
    files?: { fileName: string; fileKey: string }[]
  },
) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      teams: [],
      ...notice,
      createAt: '2026-07-28',
    }),
  })
}

async function fulfillNoticeList(route: Route, title: string) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      notices: [
        {
          id: 7,
          title,
          teams: [],
          createdAt: '2026-07-28',
        },
      ],
      totalPageSize: 1,
    }),
  })
}
