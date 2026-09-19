import { test, expect, type Page } from '@playwright/test'

// 승인 시나리오(reservation-create.approved.json: S1~S7) 변환. 생성 폼은 mock 경계.

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

// 생성 화면은 reservationId=-1 로 직원 목록을 조회한다(전원 assignable).
// mock 하지 않으면 실제 서버 401 → 세션 만료로 /login 으로 튕겨 폼이 사라진다.
async function routeAssignableEmployees(page: Page) {
  await page.route(
    /^https:\/\/[^/]+\/reservation\/assigned-employee\/-?\d+(\?.*)?$/,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          assigned: [],
          assignable: [{ appAdminId: 3, name: '이승현' }],
        }),
      })
    },
  )
}

async function fillAllRequired(page: Page) {
  await page.getByLabel('단체명').fill('대구유치원')
  await page.getByLabel('지역').fill('대구광역시')
  await page.getByLabel('상담일을 선택해주세요').fill('2026.08.13')
  await page.getByLabel('예약인 이름').fill('이승현')
  await page.getByLabel('대표자 연락처를 입력해주세요').fill('010-7753-9698')
  await page.getByLabel('총 인원').fill('12')
  await page.getByLabel('인솔자 인원').fill('3')
  await page.getByLabel('입장료를 입력해주세요').fill('48000')
  await page.getByLabel('방문일을 선택해주세요').fill('2026.08.20')
  const visitLabel = '방문 시간을 선택해주세요'
  await fillTime(page, visitLabel, '입장시간', '1000') // 10:00
  await fillTime(page, visitLabel, '퇴장시간', '1800') // 18:00
  await page.getByLabel('사전답사 인원').fill('8')
  await page.getByLabel('사전답사일을 선택해주세요').fill('2026.08.16')
  const surveyLabel = '사전답사 시간을 선택해주세요'
  await fillTime(page, surveyLabel, '입장시간', '1000') // 10:00
  await fillTime(page, surveyLabel, '퇴장시간', '1500') // 15:00
}

test('S1: 생성 폼 표시', async ({ page }) => {
  await page.goto('/notices/reservations/create')

  await expect(page.getByRole('button', { name: /상담일 관련/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /방문일 관련/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /사전답사 관련/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /페이지 권한/ })).toBeVisible()
  await expect(page.getByLabel('단체명')).toBeVisible()
  await expect(page.getByRole('button', { name: '생성하기' })).toBeVisible()
})

test('S2: 섹션 접기/펼치기', async ({ page }) => {
  await page.goto('/notices/reservations/create')
  const header = page.getByRole('button', { name: /상담일 관련/ })

  await expect(page.getByLabel('단체명')).toBeVisible()
  await header.click()
  await expect(page.getByLabel('단체명')).toHaveCount(0)
  await header.click()
  await expect(page.getByLabel('단체명')).toBeVisible()
})

test('S3: 필수 미입력 검증(인라인)', async ({ page }) => {
  await page.goto('/notices/reservations/create')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page.getByText('내용을 입력해주세요!').first()).toBeVisible()
  await expect(page.getByText('날짜를 선택해주세요!').first()).toBeVisible()
  await expect(page.getByText('시간을 선택해주세요!').first()).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/reservations\/create$/)
})

test('S4: 정상 생성', async ({ page }) => {
  // POST /reservation 성공 mock (실제 서버 미호출).
  await page.route(/^https:\/\/[^/]+\/reservation$/, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: '단체예약 생성이 완료되었습니다.' }),
    })
  })

  await routeAssignableEmployees(page)

  await page.goto('/notices/reservations/create')
  await fillAllRequired(page)
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/notices\/reservations$/)
})

test('S5: 시간 직접 입력(24시간제)', async ({ page }) => {
  await page.goto('/notices/reservations/create')
  const label = '방문 시간을 선택해주세요'
  const hour = page.getByLabel(`${label} 입장시간 시`, { exact: true })
  const minute = page.getByLabel(`${label} 입장시간 분`, { exact: true })

  // 자릿수를 왼쪽부터 채운다: 2→02시, 22→22시, 223→22시 30분, 2230→22시 30분.
  await expect(hour).toHaveValue('00')
  await fillTime(page, label, '입장시간', '2230')
  await expect(hour).toHaveValue('22')
  await expect(minute).toHaveValue('30')

  // Backspace 로 분 자릿수를 지우면 00 으로 돌아간다.
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await expect(minute).toHaveValue('00')
  await expect(hour).toHaveValue('22')

  // 두 자리 시가 될 수 없는 첫 자리는 0을 앞에 채운다(9 → 09시).
  const exitHour = page.getByLabel(`${label} 퇴장시간 시`, { exact: true })
  const exitMinute = page.getByLabel(`${label} 퇴장시간 분`, { exact: true })
  await fillTime(page, label, '퇴장시간', '9')
  await expect(exitHour).toHaveValue('09')
  await expect(exitMinute).toHaveValue('00')
})

test('S6: 페이지 권한 배정 추가/취소', async ({ page }) => {
  await routeAssignableEmployees(page)

  await page.goto('/notices/reservations/create')
  await expect(
    page.getByText('아직 배정된 담당자가 없습니다.'),
  ).toBeVisible()

  await page.getByRole('button', { name: '이승현 배정 추가' }).click()
  await expect(page.getByRole('button', { name: '이승현 배정 취소' })).toBeVisible()

  await page.getByRole('button', { name: '이승현 배정 취소' }).click()
  await expect(
    page.getByText('아직 배정된 담당자가 없습니다.'),
  ).toBeVisible()
})

test('S7: 뒤로가기', async ({ page }) => {
  await page.goto('/notices/reservations/create')
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})
