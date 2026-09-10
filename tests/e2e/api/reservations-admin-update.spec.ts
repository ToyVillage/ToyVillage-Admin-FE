import { expect, test, type Page } from '@playwright/test'

// 승인 시나리오(reservations-admin-update.test-scenarios.md)의 mock 변환.
// 대상: PATCH /reservation/{reservationId}. 상세(GET /reservation/{id})·직원(GET
// /reservation/assigned-employee/{reservationId})은 200으로 채운다.
// 상세 응답에 사전답사가 없어(백엔드 갭) 저장 전 사전답사 4칸을 채워야 검증을 통과한다.
// 실제 서버는 호출하지 않는다.

const detail = {
  counselDate: '2026-07-02',
  visitDate: '2026-07-13',
  visitTime: '13:01:00',
  exitTime: '15:00:00',
  reservationName: '차은우',
  reservationCount: 20,
  location: '대전광역시 유성구 장동',
  title: '대덕소프트웨어마이스터고',
  money: 200000,
  status: '사전답사 완료',
  leaderCount: 3,
  leaderPhoneNumber: '010-7753-9698',
}

const employeePath = /\/api\/reservation\/assigned-employee\/\d+(\?.*)?$/
const detailOrPatchPath = /\/api\/reservation\/\d+$/

async function fillTime(page: Page, label: string, digits: string) {
  await page.getByLabel(`${label} 시`, { exact: true }).click()
  await page.keyboard.type(digits, { delay: 20 })
}

// 12시간제: 오후 시각은 am/pm 드롭다운에서 pm 을 선택한다.
async function selectPm(page: Page, label: string) {
  await page.getByRole('button', { name: `${label} 오전/오후` }).click()
  await page.getByRole('option', { name: 'pm' }).click()
}

// 상세엔 없는 사전답사 4칸을 채운다.
async function fillSurvey(page: Page) {
  await page.getByLabel('사전답사 인원').fill('8')
  await page.getByLabel('사전답사일을 선택해주세요').fill('20260816')
  await fillTime(page, '사전답사 시간을 선택해주세요 (입장시간)', '1000') // 10:00 오전
  const exitLabel = '사전답사 시간을 선택해주세요 (퇴장시간)'
  await fillTime(page, exitLabel, '0300')
  await selectPm(page, exitLabel) // 15:00
}

async function routeEmployees(page: Page) {
  await page.route(employeePath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        assigned: [{ appAdminId: 3, name: '이승현' }],
        assignable: [{ appAdminId: 7, name: '김직원' }],
      }),
    })
  })
}

test('S1: 저장 → PATCH 바디 매핑 후 목록 이동', async ({ page }) => {
  let body: Record<string, unknown> | null = null
  let patchUrl = ''
  await routeEmployees(page)
  await page.route(detailOrPatchPath, async (route) => {
    const request = route.request()
    if (request.method() === 'PATCH') {
      body = request.postDataJSON()
      patchUrl = request.url()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '단체예약 수정이 완료되었습니다.' }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail),
    })
  })

  await page.goto('/notices/reservations/1')
  await expect(page.getByLabel('단체명', { exact: true })).toHaveValue(
    '대덕소프트웨어마이스터고',
  )
  await fillSurvey(page)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/notices\/reservations$/)
  expect(new URL(patchUrl).pathname).toBe('/api/reservation/1')
  expect(body).toMatchObject({
    title: '대덕소프트웨어마이스터고',
    location: '대전광역시 유성구 장동',
    counselDate: '2026-07-02',
    reservationName: '차은우',
    leaderPhoneNumber: '010-7753-9698',
    reservationCount: 20,
    leaderCount: 3,
    money: 200000,
    visitDate: '2026-07-13',
    visitTime: '13:01',
    exitTime: '15:00',
    visitSiteCount: 8,
    visitSiteDate: '2026-08-16',
    visitSiteTime: '10:00',
    visitSiteExitTime: '15:00',
    appAdminIds: [3],
  })
})

test('S2: 저장 400 → 서버 message 알림, 이동 없음', async ({ page }) => {
  await routeEmployees(page)
  await page.route(detailOrPatchPath, async (route) => {
    const request = route.request()
    if (request.method() === 'PATCH') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: '사전답사일은 방문일보다 늦을 수 없습니다.',
          status: 400,
          timestamp: '2026-08-08T12:00:00',
          description: 'RESERVATION_INVALID_DATE',
        }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail),
    })
  })

  await page.goto('/notices/reservations/1')
  await expect(page.getByLabel('단체명', { exact: true })).toHaveValue(
    '대덕소프트웨어마이스터고',
  )
  await fillSurvey(page)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByRole('alert')).toHaveText(
    '사전답사일은 방문일보다 늦을 수 없습니다.',
  )
  await expect(page).toHaveURL(/\/notices\/reservations\/1$/)
})
