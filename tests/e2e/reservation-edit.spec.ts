import { test, expect, type Page } from '@playwright/test'

// 승인 시나리오(reservation-edit.approved.json: S1~S6) 변환.
// 상세 조회(GET /reservation/{id})로 폼을 채우고, 직원 배정 목록(GET
// /reservation/assigned-employee/{reservationId})으로 권한 섹션을 채운다.
// 저장(PATCH /reservation/{reservationId})·삭제(DELETE /reservation/{reservationId})는 mock 경계.
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

const employeePath = /\/api\/reservation\/assigned-employee\/\d+(\?.*)?$/
// 상세(GET)·수정(PATCH)·삭제(DELETE)가 같은 경로를 공유한다.
const reservationPath = /\/api\/reservation\/\d+$/

async function routeEmployees(page: Page) {
  await page.route(employeePath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(employees),
    })
  })
}

async function routeReservation(page: Page) {
  await page.route(reservationPath, async (route) => {
    const method = route.request().method()
    if (method === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '단체예약 수정이 완료되었습니다.' }),
      })
    }
    if (method === 'DELETE') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '단체예약 삭제가 완료되었습니다.' }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail),
    })
  })
}

// 상세·직원 mock을 걸고 편집 폼으로 진입한다.
async function gotoEdit(page: Page) {
  await routeEmployees(page)
  await routeReservation(page)
  await page.goto('/notices/reservations/7')
  await expect(page.getByLabel('단체명')).toHaveValue('대구어린이집')
}

// 시간 입력은 키다운으로 raw 자릿수를 왼쪽부터 채운다(값은 controlled — fill 은 반영 안 됨).
async function fillTime(page: Page, label: string, digits: string) {
  await page.getByLabel(`${label} 시`, { exact: true }).click()
  await page.keyboard.type(digits, { delay: 20 })
}

// 12시간제: 오후 시각은 am/pm 드롭다운에서 pm 을 선택한다.
async function selectPm(page: Page, label: string) {
  await page.getByRole('button', { name: `${label} 오전/오후` }).click()
  await page.getByRole('option', { name: 'pm' }).click()
}

// 상세 응답에 없는 사전답사 4칸을 채운다(mock 경계).
async function fillSurvey(page: Page) {
  await page.getByLabel('사전답사 인원').fill('8')
  await page.getByLabel('사전답사일을 선택해주세요').fill('2026.08.16')
  await fillTime(page, '사전답사 시간을 선택해주세요 (입장시간)', '1000') // 10:00 오전
  const exitLabel = '사전답사 시간을 선택해주세요 (퇴장시간)'
  await fillTime(page, exitLabel, '0300')
  await selectPm(page, exitLabel) // 15:00
}

test('S1: 상세 진입 시 폼 초기화', async ({ page }) => {
  await gotoEdit(page)

  await expect(page.getByLabel('지역')).toHaveValue('대구광역시 수성구')
  await expect(page.getByLabel('예약인 이름')).toHaveValue('이승현')
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
  await expect(page.getByRole('button', { name: '삭제하기' })).toBeVisible()
  // 수정 페이지는 배정팀이 시드되어 보인다.
  await expect(
    page.getByRole('button', { name: /배정 취소/ }).first(),
  ).toBeVisible()
})

test('S2: 값 수정 후 저장', async ({ page }) => {
  await gotoEdit(page)

  await page.getByLabel('단체명').fill('대구어린이집(수정)')
  await fillSurvey(page)
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})

test('S3: 필수 삭제 후 저장 → 인라인 에러', async ({ page }) => {
  await gotoEdit(page)

  await page.getByLabel('단체명').fill('')
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page.getByText('내용을 입력해주세요!').first()).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/reservations\/7$/)
})

test('S4: 예약 삭제', async ({ page }) => {
  await gotoEdit(page)

  await page.getByRole('button', { name: '삭제하기' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})

test('S5: 배정팀 취소', async ({ page }) => {
  await gotoEdit(page)

  const cancelFirst = page.getByRole('button', { name: /배정 취소/ }).first()
  await expect(cancelFirst).toBeVisible()
  const before = await page.getByRole('button', { name: /배정 취소/ }).count()
  await cancelFirst.click()
  await expect(page.getByRole('button', { name: /배정 취소/ })).toHaveCount(
    before - 1,
  )
})

test('S6: 뒤로가기', async ({ page }) => {
  await gotoEdit(page)
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})
