import { expect, test, type Page } from '@playwright/test'
import {
  createTeamApiState,
  employeesPattern,
  joinTeamPattern,
  mockTeamApi,
  teamItemPattern,
  teamListPattern,
  teamMembersPattern,
} from '../support/team-api'

// 팀 관리 화면의 API 연동(TEAM_QUERY_ALL / CREATE / UPDATE / DELETE /
// MEMBER_QUERY / JOIN / QUIT + APP_ADMIN_EMPLOYEE_QUERY_ALL) 시나리오.
// 퍼블리싱 단계의 team-settings.spec.ts 를 실제 응답 형태 기준으로 옮긴 것이다.

const railRows = (page: Page) => page.getByTestId('team-rail-row')
const memberRows = (page: Page) => page.getByTestId('team-member-row')
const staffRows = (page: Page) => page.getByTestId('staff-row')

test('S1: 진입 시 팀 목록과 첫 번째 팀의 멤버를 조회한다', async ({ page }) => {
  const requested: string[] = []
  page.on('request', (request) => requested.push(request.url()))
  await mockTeamApi(page)

  await page.goto('/settings/teams')

  await expect(page.getByRole('heading', { name: '팀 관리' })).toBeVisible()
  await expect(page.getByText('4개')).toBeVisible()
  await expect(railRows(page).first()).toHaveAttribute('aria-current', 'true')
  await expect(page.getByRole('heading', { name: '동물 관리팀' })).toBeVisible()
  await expect(memberRows(page)).toHaveCount(5)

  const paths = requested.map((url) => new URL(url).pathname)
  expect(paths).toContain('/team')
  expect(paths).toContain('/team/1/members')
  expect(paths).toContain('/app/admin/employees')
})

test('S2: 레일 인원수는 teamMemberCount 를 그대로 쓴다', async ({ page }) => {
  await mockTeamApi(page)

  await page.goto('/settings/teams')

  await expect(railRows(page).nth(0)).toContainText('5명')
  await expect(railRows(page).nth(1)).toContainText('3명')
  await expect(railRows(page).nth(2)).toContainText('0명')
  await expect(railRows(page).nth(3)).toContainText('5명')
})

test('S3: 멤버 응답에 없는 직급을 직원 목록으로 채운다', async ({ page }) => {
  await mockTeamApi(page)

  await page.goto('/settings/teams')

  // 홍길동은 직원 목록에서 `과장`, 이승현은 직급이 없어 기본 표기 `사원` 이다.
  await expect(memberRows(page).nth(0)).toContainText('이승현')
  await expect(memberRows(page).nth(0)).toContainText('사원')
  await expect(memberRows(page).nth(1)).toContainText('홍길동')
  await expect(memberRows(page).nth(1)).toContainText('과장')
  await expect(memberRows(page).nth(4)).toContainText('김수인')
  await expect(memberRows(page).nth(4)).toContainText('대리')
})

test('S4: 다른 팀을 고르면 그 팀의 멤버를 다시 조회한다', async ({ page }) => {
  const requested: string[] = []
  page.on('request', (request) => requested.push(request.url()))
  await mockTeamApi(page)

  await page.goto('/settings/teams')
  await railRows(page).nth(1).click()

  await expect(page.getByRole('heading', { name: '창고팀' })).toBeVisible()
  await expect(memberRows(page)).toHaveCount(3)
  expect(requested.map((url) => new URL(url).pathname)).toContain(
    '/team/2/members',
  )
})

test('S5: 팀을 추가하면 name 만 보내고, 목록을 다시 받아 새 팀을 선택한다', async ({
  page,
}) => {
  const bodies: (string | null)[] = []
  await mockTeamApi(page)
  await page.route(teamListPattern, async (route) => {
    if (route.request().method() === 'POST') bodies.push(route.request().postData())
    await route.fallback()
  })

  await page.goto('/settings/teams')
  await page.getByRole('button', { name: '팀 추가하기' }).click()
  await page.getByLabel('팀 이름').fill('야간 경비팀')
  await page.getByRole('button', { name: '완료' }).click()

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(railRows(page)).toHaveCount(5)
  await expect(railRows(page).last()).toContainText('야간 경비팀')
  await expect(railRows(page).last()).toHaveAttribute('aria-current', 'true')
  await expect(page.getByRole('heading', { name: '야간 경비팀' })).toBeVisible()
  await expect(page.getByText('아직 팀원이 없어요')).toBeVisible()
  expect(bodies).toEqual(['{"name":"야간 경비팀"}'])
})

test('S6: 팀명을 변경하면 PUT /team/{teamId} 로 보내고 레일이 함께 바뀐다', async ({
  page,
}) => {
  const requests: { method: string; path: string; body: string | null }[] = []
  await mockTeamApi(page)
  await page.route(teamItemPattern, async (route) => {
    requests.push({
      method: route.request().method(),
      path: new URL(route.request().url()).pathname,
      body: route.request().postData(),
    })
    await route.fallback()
  })

  await page.goto('/settings/teams')
  await page.getByRole('button', { name: '팀명 변경' }).click()
  await page.getByLabel('팀 이름').fill('동물 돌봄팀')
  await page.getByRole('button', { name: '저장' }).click()

  await expect(page.getByRole('heading', { name: '동물 돌봄팀' })).toBeVisible()
  await expect(railRows(page).first()).toContainText('동물 돌봄팀')
  expect(requests).toEqual([
    { method: 'PUT', path: '/team/1', body: '{"name":"동물 돌봄팀"}' },
  ])
})

test('S7: 팀원을 추가하면 appAdminIds 배열로 한 번에 보낸다', async ({ page }) => {
  const requests: { method: string; path: string; body: string | null }[] = []
  await mockTeamApi(page)
  await page.route(joinTeamPattern, async (route) => {
    requests.push({
      method: route.request().method(),
      path: new URL(route.request().url()).pathname,
      body: route.request().postData(),
    })
    await route.fallback()
  })

  await page.goto('/settings/teams')
  await page.getByRole('button', { name: '인원 추가하기' }).click()
  await page.getByRole('button', { name: '박서준 추가' }).click()
  await page.getByRole('button', { name: '정하윤 추가' }).click()
  await page.getByRole('button', { name: '2명 추가' }).click()

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(memberRows(page)).toHaveCount(7)
  await expect(memberRows(page).nth(5)).toContainText('박서준')
  await expect(memberRows(page).nth(6)).toContainText('정하윤')
  await expect(railRows(page).first()).toContainText('7명')
  expect(requests).toEqual([
    { method: 'POST', path: '/join-team/1', body: '{"appAdminIds":[14,15]}' },
  ])
})

test('S8: 팀원 제거는 DELETE /join-team/{teamId} 에 body 로 보낸다', async ({
  page,
}) => {
  const requests: { method: string; path: string; body: string | null }[] = []
  await mockTeamApi(page)
  await page.route(joinTeamPattern, async (route) => {
    requests.push({
      method: route.request().method(),
      path: new URL(route.request().url()).pathname,
      body: route.request().postData(),
    })
    await route.fallback()
  })

  await page.goto('/settings/teams')
  await page.getByRole('button', { name: '이승현 제거' }).click()

  await expect(memberRows(page)).toHaveCount(4)
  await expect(railRows(page).first()).toContainText('4명')
  expect(requests).toEqual([
    { method: 'DELETE', path: '/join-team/1', body: '{"appAdminIds":[1]}' },
  ])
})

test('S9: 팀을 삭제하면 성공 토스트가 뜨고 다음 팀이 선택된다', async ({
  page,
}) => {
  await mockTeamApi(page)

  await page.goto('/settings/teams')
  await page.getByRole('button', { name: '팀 삭제' }).click()
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(railRows(page)).toHaveCount(3)
  await expect(page.getByText('3개')).toBeVisible()
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(railRows(page).first()).toContainText('창고팀')
  await expect(railRows(page).first()).toHaveAttribute('aria-current', 'true')
  await expect(page.getByRole('heading', { name: '창고팀' })).toBeVisible()
  await expect(memberRows(page)).toHaveCount(3)
})

test('S10: 팀원이 0명이면 빈 상태를 보여준다', async ({ page }) => {
  await mockTeamApi(page)

  await page.goto('/settings/teams')
  await railRows(page).nth(2).click()

  await expect(
    page.getByRole('heading', { name: '사육장 청소팀' }),
  ).toBeVisible()
  await expect(memberRows(page)).toHaveCount(0)
  await expect(page.getByText('아직 팀원이 없어요')).toBeVisible()
})

test('S11: 이미 팀에 속한 직원은 팀원 추가 후보에서 빠진다', async ({ page }) => {
  await mockTeamApi(page)

  await page.goto('/settings/teams')
  await expect(memberRows(page)).toHaveCount(5)

  await page.getByRole('button', { name: '인원 추가하기' }).click()

  // 전체 직원 17명 중 동물 관리팀 5명을 뺀 12명만 후보로 올라온다.
  await expect(staffRows(page)).toHaveCount(12)
  await expect(page.getByRole('button', { name: '이승현 추가' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '박서준 추가' })).toBeVisible()
})

test('S12: 팀 목록 조회 실패를 빈 목록으로 숨기지 않는다', async ({ page }) => {
  await mockTeamApi(page)
  await page.route(teamListPattern, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback()
      return
    }
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '예상하지 못한 에러가 발생했습니다.',
        status: 500,
        timestamp: '2026-09-17T12:00:00',
        description: '에러 설명',
      }),
    })
  })

  await page.goto('/settings/teams')

  // 팀이 0개인 것과 목록을 못 받은 것을 구분한다. 빈 레일로 넘어가지 않는다.
  await expect(page.getByRole('alert')).toContainText(
    '팀 목록을 불러오지 못했습니다',
  )
  await expect(page.getByRole('button', { name: '팀 추가하기' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '팀 삭제' })).toHaveCount(0)
})

test('S13: 팀원 제거가 실패하면 실패 토스트를 띄우고 목록을 되돌린다', async ({
  page,
}) => {
  await mockTeamApi(page)
  await page.route(joinTeamPattern, async (route) => {
    if (route.request().method() !== 'DELETE') {
      await route.fallback()
      return
    }
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '존재하지 않는 유저입니다.',
        status: 404,
        timestamp: '2026-09-17T12:00:00',
        description: '에러 설명',
      }),
    })
  })

  await page.goto('/settings/teams')
  await page.getByRole('button', { name: '이승현 제거' }).click()

  await expect(page.getByText('팀원 제거에 실패했습니다')).toBeVisible()
  await expect(memberRows(page)).toHaveCount(5)
})

test('S14: 직원 목록을 못 받아도 팀·멤버는 이름으로 표시된다', async ({
  page,
}) => {
  await mockTeamApi(page, createTeamApiState())
  await page.route(employeesPattern, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '예상하지 못한 에러가 발생했습니다.',
        status: 500,
        timestamp: '2026-09-17T12:00:00',
        description: '에러 설명',
      }),
    })
  })

  await page.goto('/settings/teams')

  await expect(memberRows(page)).toHaveCount(5)
  await expect(memberRows(page).nth(1)).toContainText('홍길동')
  // 직급 출처가 없으므로 기본 표기로 떨어진다.
  await expect(memberRows(page).nth(1)).toContainText('사원')
})

test('S15: 멤버 조회는 팀마다 따로 캐시되어 재방문 시 다시 요청하지 않는다', async ({
  page,
}) => {
  const memberRequests: string[] = []
  await mockTeamApi(page)
  await page.route(teamMembersPattern, async (route) => {
    memberRequests.push(new URL(route.request().url()).pathname)
    await route.fallback()
  })

  await page.goto('/settings/teams')
  await expect(memberRows(page)).toHaveCount(5)

  await railRows(page).nth(1).click()
  await expect(memberRows(page)).toHaveCount(3)

  await railRows(page).nth(0).click()
  await expect(memberRows(page)).toHaveCount(5)

  expect(memberRequests).toEqual(['/team/1/members', '/team/2/members'])
})

test('S16: 멤버 조회에 실패하면 팀원 없음으로 숨기지 않는다', async ({ page }) => {
  await mockTeamApi(page)
  await page.route(teamMembersPattern, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '예상하지 못한 에러가 발생했습니다.',
        status: 500,
        timestamp: '2026-09-17T12:00:00',
        description: '에러 설명',
      }),
    })
  })

  await page.goto('/settings/teams')

  await expect(page.getByRole('alert')).toContainText(
    '팀원을 불러오지 못했습니다',
  )
  await expect(page.getByText('아직 팀원이 없어요')).toHaveCount(0)
  // 레일은 살아 있고, 멤버를 모르는 상태에서 추가·제거는 노출하지 않는다.
  await expect(railRows(page)).toHaveCount(4)
  await expect(page.getByRole('button', { name: '인원 추가하기' })).toHaveCount(0)
  await expect(memberRows(page)).toHaveCount(0)
})
