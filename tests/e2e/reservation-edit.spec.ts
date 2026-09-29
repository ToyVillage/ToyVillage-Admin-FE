import { test, expect, type Page } from '@playwright/test'

// 승인 시나리오(reservation-edit.approved.json: S1~S6) 변환.
// 수정은 `/notices/reservations/:id/edit` 이다(`/:id` 는 읽기 전용 상세).
// 상세 조회(GET /reservation/{id})로 폼을 채우고, 직원 배정 목록(GET
// /reservation/assigned-employee/{reservationId})으로 권한 섹션을 채운다.
// 저장은 PATCH /reservation/{reservationId}. 삭제는 이 화면에 없다(목록 케밥 담당).
// 실제 서버는 호출하지 않는다.

const detail = {
  counselDate: '2026-07-02',
  visitDate: '2026-07-13',
  visitTime: '13:01:00',
  exitTime: '15:00:00',
  reservationName: '이승현',
  reservationCount: 12,
  location: '대구광역시 수성구',
  title: '대구어린이집',
  money: 200000,
  status: '사전답사 완료',
  leaderCount: 3,
  leaderPhoneNumber: '010-7753-9698',
}

const employees = {
  assigned: [{ appAdminId: 3, name: '이승현' }],
  assignable: [{ appAdminId: 7, name: '김직원' }],
}

const employeePath = /^https:\/\/[^/]+\/reservation\/assigned-employee\/\d+(\?.*)?$/
// 상세(GET)와 수정(PATCH)이 같은 경로를 공유한다.
const reservationPath = /^https:\/\/[^/]+\/reservation\/\d+$/

// 저장 후 돌아가는 목록 화면. 조회가 끝나야 토스트가 보인다.
async function routeList(page: Page) {
  await page.route(/^https:\/\/[^/]+\/reservation\?/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        beforeVisitSite: 0,
        doneVisitSite: 0,
        doneVisit: 0,
        reservationAdminQueryListObjectResponse: {
          content: [],
          totalPages: 0,
        },
      }),
    })
  })
}

async function routeEmployees(page: Page) {
  await page.route(employeePath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(employees),
    })
  })
}

// `savedBodies` 를 주면 PATCH 요청 바디를 모아 검증할 수 있다.
// `saveOk` 가 false 면 저장이 서버 오류로 실패한다.
async function routeReservation(
  page: Page,
  options: { saveOk?: boolean; savedBodies?: unknown[] } = {},
) {
  const { saveOk = true, savedBodies } = options
  await page.route(reservationPath, async (route) => {
    if (route.request().method() === 'PATCH') {
      savedBodies?.push(route.request().postDataJSON())
      return route.fulfill({
        status: saveOk ? 200 : 500,
        contentType: 'application/json',
        // 실패 응답에 message 를 넣지 않는다 — 서버 사유가 없을 때의 기본 문구를 본다.
        body: JSON.stringify(
          saveOk ? { message: '단체예약 수정이 완료되었습니다.' } : {},
        ),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail),
    })
  })
}

// 상세·직원 mock을 걸고 수정 폼으로 진입한다.
async function gotoEdit(
  page: Page,
  options: { saveOk?: boolean; savedBodies?: unknown[] } = {},
) {
  await routeList(page)
  await routeEmployees(page)
  await routeReservation(page, options)
  await page.goto('/notices/reservations/7/edit')
  await expect(page.getByLabel('단체명')).toHaveValue('대구어린이집')
}

// 시간 입력은 키다운으로 raw 자릿수를 왼쪽부터 채운다(값은 controlled — fill 은 반영 안 됨).
type Side = '입장시간' | '퇴장시간'

async function fillTime(
  page: Page,
  label: string,
  side: Side,
  digits: string,
) {
  await page.getByLabel(`${label} ${side} 시`, { exact: true }).click()
  await page.keyboard.type(digits, { delay: 20 })
}

// 상세 응답에 없는 사전답사 4칸을 채운다.
async function fillSurvey(page: Page) {
  await page.getByLabel('사전답사 인원').fill('8')
  await page.getByLabel('사전답사일을 선택해주세요').fill('2026.08.16')
  const surveyLabel = '사전답사 시간을 입력해주세요'
  await fillTime(page, surveyLabel, '입장시간', '1000') // 10:00
  await fillTime(page, surveyLabel, '퇴장시간', '1500') // 15:00
}

test('S1: 수정 폼 초기화', async ({ page }) => {
  await gotoEdit(page)

  await expect(page.getByLabel('지역')).toHaveValue('대구광역시 수성구')
  await expect(page.getByLabel('예약인 이름')).toHaveValue('이승현')
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
  // 삭제는 목록 케밥으로 옮겨졌다.
  await expect(page.getByRole('button', { name: '삭제하기' })).toHaveCount(0)
  // 수정 페이지는 배정됨이 시드되어 보인다.
  await expect(
    page.getByRole('button', { name: /배정 취소/ }).first(),
  ).toBeVisible()
})

test('S2: 값 수정 후 저장 → 목록 + 수정 성공 토스트', async ({ page }) => {
  await gotoEdit(page)

  await page.getByLabel('단체명').fill('대구어린이집(수정)')
  await fillSurvey(page)
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations$/)
  await expect(page.getByText('데이터 수정에 성공했습니다')).toBeVisible()
})

test('S3: 필수 삭제 후 저장 → 인라인 에러', async ({ page }) => {
  const savedBodies: unknown[] = []
  await gotoEdit(page, { savedBodies })

  await page.getByLabel('단체명').fill('')
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page.getByText('내용을 입력해주세요!').first()).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/reservations\/7\/edit$/)
  expect(savedBodies).toHaveLength(0)
})

test('S4: 배정 추가/취소 → appAdminIds 전송', async ({ page }) => {
  const savedBodies: Record<string, unknown>[] = []
  await gotoEdit(page, { savedBodies })

  // 배정가능 직원 추가 → 배정됨으로 이동한다.
  await page.getByRole('button', { name: '김직원 배정 추가' }).click()
  await expect(page.getByRole('button', { name: '김직원 배정 취소' })).toBeVisible()

  // 기존 배정을 취소하면 배정가능으로 돌아간다.
  await page.getByRole('button', { name: '이승현 배정 취소' }).click()
  await expect(page.getByRole('button', { name: '이승현 배정 추가' })).toBeVisible()

  await fillSurvey(page)
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations$/)
  expect(savedBodies).toHaveLength(1)
  expect(savedBodies[0].appAdminIds).toEqual([7])
})

test('S5: 뒤로가기', async ({ page }) => {
  await gotoEdit(page)
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})

test('S6: 저장 실패 → 목록으로 가지 않고 실패 토스트', async ({ page }) => {
  await gotoEdit(page, { saveOk: false })

  await page.getByLabel('단체명').fill('대구어린이집(수정)')
  await fillSurvey(page)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByText('데이터 수정에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/reservations\/7\/edit$/)
})
