import { test, expect } from '@playwright/test'

// 승인된 시나리오(reservations-list.approved.json: S1~S10)를 변환한 것.
// 승인 후에는 시나리오를 재도출하지 않고 실패 시 프로덕션 코드를 수정한다.

test('S1: 리스트 표시', async ({ page }) => {
  await page.goto('/notices/reservations')

  await expect(
    page.getByRole('heading', { name: '단체예약 현황' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /심사대기/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /승인 완료/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /반려/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: '페이지 권한주기' }),
  ).toBeVisible()
  await expect(page.getByText('상담일', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('checkbox', { name: '전체 예약 선택' }),
  ).toBeVisible()
  await expect(page.getByRole('searchbox', { name: '예약 검색' })).toBeVisible()
  await expect(page.getByTestId('reservation-row').first()).toBeVisible()
  await expect(page.getByRole('button', { name: '2 페이지' })).toBeVisible()
})

test('S2: 상태 필터 (반려)', async ({ page }) => {
  await page.goto('/notices/reservations')
  await page.getByRole('button', { name: /반려/ }).click()

  await expect(page.getByText('한빛어린이집')).toBeVisible()
  await expect(page.getByText('대구어린이집')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /반려/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('S3: 검색', async ({ page }) => {
  await page.goto('/notices/reservations')
  const search = page.getByRole('searchbox', { name: '예약 검색' })

  await search.fill('행복')
  await expect(page.getByText('행복유치원')).toBeVisible()
  await expect(page.getByText('대구어린이집')).toHaveCount(0)

  await search.fill('존재하지않는단체')
  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
})

test('S4: 정렬 (상담일순 → 예약일순)', async ({ page }) => {
  await page.goto('/notices/reservations')

  // 기본 상담일순: 첫 행은 상담일이 가장 늦은 대구어린이집
  await expect(page.getByTestId('reservation-row').first()).toContainText(
    '대구어린이집',
  )

  await page.getByRole('button', { name: '예약 정렬' }).click()
  await page.getByRole('menuitemradio', { name: '예약일순' }).click()

  // 예약일순: 첫 행은 예약일이 가장 늦은 무지개어린이집
  await expect(page.getByTestId('reservation-row').first()).toContainText(
    '무지개어린이집',
  )
})

test('S5: 행 클릭 → 상세 이동', async ({ page }) => {
  await page.goto('/notices/reservations')
  await page.getByTestId('reservation-row').first().click()
  await expect(page).toHaveURL(/\/notices\/reservations\/\d+$/)
})

test('S6: 선택 후 권한 모달 열기', async ({ page }) => {
  await page.goto('/notices/reservations')
  await page.getByRole('checkbox', { name: '행복유치원 선택' }).check()
  await page.getByRole('button', { name: '페이지 권한주기' }).click()

  const dialog = page.getByRole('dialog', {
    name: '권한 줄 직원을 선택해주세요',
  })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('김지환 사원').first()).toBeVisible()
})

test('S7: 선택 없으면 권한 주기 비활성화', async ({ page }) => {
  await page.goto('/notices/reservations')
  const grantButton = page.getByRole('button', { name: '페이지 권한주기' })
  await expect(grantButton).toBeDisabled()

  await page.getByRole('checkbox', { name: '행복유치원 선택' }).check()
  await expect(grantButton).toBeEnabled()
})

test('S8: 권한 지정 확인 / 취소', async ({ page }) => {
  await page.goto('/notices/reservations')
  const rowCheckbox = page.getByRole('checkbox', { name: '행복유치원 선택' })
  const dialog = page.getByRole('dialog', {
    name: '권한 줄 직원을 선택해주세요',
  })

  // 확인 → 모달 닫힘 + 선택 초기화
  await rowCheckbox.check()
  await page.getByRole('button', { name: '페이지 권한주기' }).click()
  await dialog.getByRole('button', { name: '김지환 추가' }).first().click()
  await expect(
    dialog.getByRole('button', { name: '김지환 권한 추가됨' }),
  ).toBeVisible()
  await dialog.getByRole('button', { name: '확인' }).click()
  await expect(dialog).toBeHidden()
  await expect(rowCheckbox).not.toBeChecked()

  // 취소/Escape → 변경 없이 닫힘
  await rowCheckbox.check()
  await page.getByRole('button', { name: '페이지 권한주기' }).click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('S9: 데이터 없음 빈 상태', async ({ page }) => {
  await page.goto('/notices/reservations')
  await page.evaluate(() =>
    localStorage.setItem('toyvillage:reservations:empty', '1'),
  )
  await page.reload()

  await expect(page.getByText('아직 단체예약이 없습니다')).toBeVisible()
  await expect(page.getByTestId('reservation-row')).toHaveCount(0)
})

test('S10: 페이지네이션·리셋', async ({ page }) => {
  await page.goto('/notices/reservations')

  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(page.getByRole('button', { name: '2 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  // 정렬 변경 시 1페이지로 리셋
  await page.getByRole('button', { name: '예약 정렬' }).click()
  await page.getByRole('menuitemradio', { name: '예약일순' }).click()
  await expect(page.getByRole('button', { name: '1 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})
