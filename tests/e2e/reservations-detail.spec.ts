import { test, expect } from '@playwright/test'

// 승인된 시나리오(reservations-detail.approved.json: S1~S6)를 변환한 것.
// 승인 후에는 시나리오를 재도출하지 않고 실패 시 프로덕션 코드를 수정한다.

test('S1: 상세 표시', async ({ page }) => {
  await page.goto('/notices/reservations/1')

  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: '예약정보' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: '페이지 권한' })).toBeVisible()
  await expect(page.getByText('상담일', { exact: true })).toBeVisible()
  await expect(page.getByText('예약 시간', { exact: true })).toBeVisible()
  await expect(page.getByText('예약인', { exact: true })).toBeVisible()
  await expect(page.getByText('입장료', { exact: true })).toBeVisible()
  await expect(page.getByText('인솔자 연락처', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('searchbox', { name: '검색할 직원 이름' }),
  ).toBeVisible()
})

test('S2: 예약 값 렌더', async ({ page }) => {
  await page.goto('/notices/reservations/1')

  await expect(page.getByText('대구어린이집')).toBeVisible()
  await expect(page.getByText('13 : 01 ~ 15 : 00')).toBeVisible()
  await expect(page.getByText('이승현')).toBeVisible()
  await expect(page.getByText('200,000원')).toBeVisible()
  await expect(page.getByText('18명')).toBeVisible()
})

test('S3: 존재하지 않는 예약', async ({ page }) => {
  await page.goto('/notices/reservations/9999')

  await expect(
    page.getByRole('heading', { name: '예약을 찾을 수 없습니다.' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
})

test('S4: 뒤로가기', async ({ page }) => {
  await page.goto('/notices/reservations/1')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/notices\/reservations$/)
  await expect(
    page.getByRole('heading', { name: '단체예약 현황' }),
  ).toBeVisible()
})

test('S5: 권한 직원 목록 + 검색', async ({ page }) => {
  await page.goto('/notices/reservations/1')

  await expect(page.getByText('홍길동 과장')).toBeVisible()
  await expect(page.getByText('김지환 과장')).toBeVisible()

  await page.getByRole('searchbox', { name: '검색할 직원 이름' }).fill('홍길동')
  await expect(page.getByText('홍길동 과장')).toBeVisible()
  await expect(page.getByText('김지환 과장')).toHaveCount(0)
})

test('S6: 직원 권한 제거', async ({ page }) => {
  await page.goto('/notices/reservations/1')

  await expect(page.getByText('홍길동 과장')).toBeVisible()
  await page.getByRole('button', { name: '홍길동 권한 제거' }).click()

  // 제거 클릭 → 삭제 확인 모달 → 확인
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '확인' }).click()

  await expect(page.getByText('홍길동 과장')).toHaveCount(0)
  await expect(page.getByText('김지환 과장')).toBeVisible()
})
