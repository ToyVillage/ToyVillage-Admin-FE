import { test, expect, type Page } from '@playwright/test'

// 승인 시나리오(reservation-edit.approved.json: S1~S6) 변환.
// 상세 조회(RESERVATION_ADMIN_QUERY)로 폼을 채우므로 page.route 로 mock. 저장/삭제는 mock 경계.

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

async function routeDetail(page: Page, status = 200, body: unknown = detail) {
  await page.route(/\/api\/reservation\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

test('S1: 상세 진입 시 폼 초기화', async ({ page }) => {
  await routeDetail(page)
  await page.goto('/notices/reservations/7')

  await expect(page.getByLabel('단체명')).toHaveValue('대구어린이집')
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
  await routeDetail(page)
  await page.goto('/notices/reservations/7')

  await page.getByLabel('단체명').fill('대구어린이집(수정)')
  // 상세 조회 응답에 없는 사전답사 필수값을 채운다(mock 경계).
  await page.getByLabel('사전답사 인원').fill('8')
  await page.getByLabel('사전답사일을 선택해주세요').fill('2026.08.16')
  await page.getByLabel('사전답사 시간을 선택해주세요 (입장시간) 시', { exact: true }).fill('10')
  await page.getByLabel('사전답사 시간을 선택해주세요 (입장시간) 분', { exact: true }).fill('00')
  await page.getByLabel('사전답사 시간을 선택해주세요 (퇴장시간) 시', { exact: true }).fill('15')
  await page.getByLabel('사전답사 시간을 선택해주세요 (퇴장시간) 분', { exact: true }).fill('00')
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})

test('S3: 필수 삭제 후 저장 → 인라인 에러', async ({ page }) => {
  await routeDetail(page)
  await page.goto('/notices/reservations/7')

  await page.getByLabel('단체명').fill('')
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page.getByText('내용을 입력해주세요!').first()).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/reservations\/7$/)
})

test('S4: 예약 삭제', async ({ page }) => {
  await routeDetail(page)
  await page.goto('/notices/reservations/7')

  await page.getByRole('button', { name: '삭제하기' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})

test('S5: 배정팀 취소', async ({ page }) => {
  await routeDetail(page)
  await page.goto('/notices/reservations/7')

  const cancelFirst = page.getByRole('button', { name: /배정 취소/ }).first()
  await expect(cancelFirst).toBeVisible()
  const before = await page.getByRole('button', { name: /배정 취소/ }).count()
  await cancelFirst.click()
  await expect(page.getByRole('button', { name: /배정 취소/ })).toHaveCount(
    before - 1,
  )
})

test('S6: 뒤로가기', async ({ page }) => {
  await routeDetail(page)
  await page.goto('/notices/reservations/7')
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations$/)
})
