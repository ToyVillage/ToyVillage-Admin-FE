import { expect, test, type Page } from '@playwright/test'

// 승인 시나리오(reservations-admin-create.test-scenarios.md)의 mock 변환.
// 대상: POST /reservation (RESERVATION_ADMIN_CREATE). 실제 서버는 호출하지 않는다.

// 시간 위젯(HH/MM 두 칸): 시 칸을 포커스한 뒤 자릿수를 키보드로 입력한다.
async function fillTime(page: Page, label: string, digits: string) {
  await page.getByLabel(`${label} 시`, { exact: true }).click()
  await page.keyboard.type(digits, { delay: 20 })
}

// 필수 16필드를 정상 값으로 채운다. am/pm 기본값(visit/survey 입장 am, 퇴장 pm)을 사용.
async function fillValidForm(page: Page) {
  await page.getByLabel('단체명', { exact: true }).fill('대구유치원')
  await page.getByLabel('지역', { exact: true }).fill('대구광역시')
  await page.getByLabel('상담일을 선택해주세요').fill('20260816')
  await page.getByLabel('예약인 이름').fill('이승현')
  await page.getByLabel('대표자 연락처를 입력해주세요').fill('01000000000')
  await page.getByLabel('총 인원').fill('12')
  await page.getByLabel('인솔자 인원').fill('3')
  await page.getByLabel('입장료를 입력해주세요').fill('48000')
  await page.getByLabel('방문일을 선택해주세요').fill('20260820')
  await fillTime(page, '방문 시간을 선택해주세요 (입장시간)', '1000')
  await fillTime(page, '퇴장 시간을 선택해주세요 (퇴장시간)', '0600')
  await page.getByLabel('사전답사 인원').fill('8')
  await page.getByLabel('사전답사일을 선택해주세요').fill('20260816')
  await fillTime(page, '사전답사 시간을 선택해주세요 (입장시간)', '1000')
  await fillTime(page, '사전답사 시간을 선택해주세요 (퇴장시간)', '0300')
}

test('S1: 폼 값이 Contract 바디로 매핑돼 전송되고 201 후 목록 이동', async ({
  page,
}) => {
  let body: Record<string, unknown> | null = null
  await page.route(/\/api\/reservation$/, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    body = route.request().postDataJSON()
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: '단체예약 생성이 완료되었습니다.' }),
    })
  })

  await page.goto('/notices/reservations/create')
  await fillValidForm(page)
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/notices\/reservations$/)

  expect(body).toMatchObject({
    title: '대구유치원',
    location: '대구광역시',
    counselDate: '2026-08-16',
    reservationName: '이승현',
    leaderPhoneNumber: '010-0000-0000',
    reservationCount: 12,
    leaderCount: 3,
    money: 48000,
    visitDate: '2026-08-20',
    visitTime: '10:00',
    exitTime: '18:00',
    visitSiteCount: 8,
    visitSiteDate: '2026-08-16',
    visitSiteTime: '10:00',
    visitSiteExitTime: '15:00',
    appAdminIds: [],
  })
  // 서버 자동 필드는 요청에 없어야 한다.
  expect(body).not.toHaveProperty('reservationDate')
  expect(body).not.toHaveProperty('status')
})

test('S3: 필수 누락 → 인라인 에러, 요청 미발생', async ({ page }) => {
  let requested = false
  await page.route(/\/api\/reservation$/, async (route) => {
    if (route.request().method() === 'POST') requested = true
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'ok' }),
    })
  })

  await page.goto('/notices/reservations/create')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page.getByText('내용을 입력해주세요!').first()).toBeVisible()
  expect(requested).toBe(false)
  await expect(page).toHaveURL(/\/notices\/reservations\/create$/)
})

test('S4: 서버 400 → 서버 message 알림, 이동 없음', async ({ page }) => {
  await page.route(/\/api\/reservation$/, async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '퇴장 시간은 입장 시간보다 빠를 수 없습니다.',
        status: 400,
        timestamp: '2026-08-08T12:00:00',
        description: 'RESERVATION_INVALID_TIME',
      }),
    })
  })

  await page.goto('/notices/reservations/create')
  await fillValidForm(page)
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page.getByRole('alert')).toHaveText(
    '퇴장 시간은 입장 시간보다 빠를 수 없습니다.',
  )
  await expect(page).toHaveURL(/\/notices\/reservations\/create$/)
})
