import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(team-settings.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 mock 만 사용한다.

const railRows = (page: Page) => page.getByTestId('team-rail-row')
const memberRows = (page: Page) => page.getByTestId('team-member-row')
const staffRows = (page: Page) => page.getByTestId('staff-row')

test('S1: 진입 시 첫 번째 팀이 선택되어 상세가 보인다', async ({ page }) => {
  await page.goto('/settings/teams')

  await expect(page.getByRole('heading', { name: '팀 관리' })).toBeVisible()
  await expect(page.getByText('토이빌리지 부서별 팀 인원 설정')).toBeVisible()
  await expect(page.getByRole('heading', { name: '팀', exact: true })).toBeVisible()
  await expect(page.getByText('4개')).toBeVisible()

  await expect(railRows(page).first()).toHaveAttribute('aria-current', 'true')
  await expect(
    page.getByRole('heading', { name: '동물 관리팀' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: '팀원' })).toBeVisible()
  await expect(memberRows(page)).toHaveCount(5)
})

test('S2: rail 에서 다른 팀을 고르면 상세가 바뀐다', async ({ page }) => {
  await page.goto('/settings/teams')

  await railRows(page).nth(1).click()

  await expect(railRows(page).nth(1)).toHaveAttribute('aria-current', 'true')
  await expect(railRows(page).first()).not.toHaveAttribute('aria-current', 'true')
  await expect(page.getByRole('heading', { name: '창고팀' })).toBeVisible()
  await expect(memberRows(page)).toHaveCount(3)
})

test('S3: 팀을 추가하면 rail 에 생기고 바로 선택된다', async ({ page }) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '팀 추가하기' }).click()
  await page.getByLabel('팀 이름').fill('야간 경비팀')
  await page.getByRole('button', { name: '완료' }).click()

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(railRows(page)).toHaveCount(5)
  await expect(railRows(page).last()).toContainText('야간 경비팀')
  await expect(railRows(page).last()).toContainText('0명')
  await expect(railRows(page).last()).toHaveAttribute('aria-current', 'true')
  await expect(page.getByText('5개')).toBeVisible()
  await expect(page.getByRole('heading', { name: '야간 경비팀' })).toBeVisible()
  await expect(page.getByText('아직 팀원이 없어요')).toBeVisible()
})

test('S4: 팀명을 변경하면 패널과 rail 이 함께 바뀐다', async ({ page }) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '팀명 변경' }).click()
  await page.getByLabel('팀 이름').fill('동물 돌봄팀')
  await page.getByRole('button', { name: '저장' }).click()

  await expect(page.getByLabel('팀 이름')).toBeHidden()
  await expect(page.getByRole('heading', { name: '동물 돌봄팀' })).toBeVisible()
  await expect(railRows(page).first()).toContainText('동물 돌봄팀')
  await expect(page.getByRole('button', { name: '팀명 변경' })).toBeVisible()
  await expect(page.getByRole('button', { name: '팀 삭제' })).toBeVisible()
})

test('S5: 팀원 추가 모달에서 여러 명을 골라 추가한다', async ({ page }) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '인원 추가하기' }).click()
  await page.getByRole('button', { name: '박서준 추가' }).click()
  await page.getByRole('button', { name: '정하윤 추가' }).click()
  await page.getByRole('button', { name: '2명 추가' }).click()

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(memberRows(page)).toHaveCount(7)
  await expect(memberRows(page).nth(5)).toContainText('박서준')
  await expect(memberRows(page).nth(6)).toContainText('정하윤')
  await expect(page.getByText('7명').first()).toBeVisible()
  await expect(railRows(page).first()).toContainText('7명')
})

test('S6: 팀을 삭제하면 성공 토스트가 뜨고 rail 에서 사라진다', async ({
  page,
}) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '팀 삭제' }).click()
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(railRows(page)).toHaveCount(3)
  await expect(page.getByText('3개')).toBeVisible()
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(railRows(page).first()).toContainText('창고팀')
  await expect(railRows(page).first()).toHaveAttribute('aria-current', 'true')
})

test('S7: 팀원을 제거하면 확인 없이 바로 빠진다', async ({ page }) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '이승현 제거' }).click()

  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(memberRows(page)).toHaveCount(4)
  await expect(page.getByText('이승현')).toBeHidden()
  await expect(railRows(page).first()).toContainText('4명')
})

test('S8: 팀원이 0명이면 빈 상태를 보여준다', async ({ page }) => {
  await page.goto('/settings/teams')

  await railRows(page).nth(2).click()

  await expect(page.getByRole('heading', { name: '사육장 청소팀' })).toBeVisible()
  await expect(memberRows(page)).toHaveCount(0)
  await expect(page.getByText('아직 팀원이 없어요')).toBeVisible()
  await expect(
    page.getByText('인원 추가하기를 눌러 이 팀에서 일할 직원을 넣어 주세요'),
  ).toBeVisible()
})

test('S9: 팀 이름이 비어 있으면 `완료` 가 비활성이다', async ({ page }) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '팀 추가하기' }).click()
  const submit = page.getByRole('button', { name: '완료' })
  await expect(submit).toBeDisabled()

  await page.getByLabel('팀 이름').fill('   ')
  await expect(submit).toBeDisabled()

  await page.getByLabel('팀 이름').fill('창고 보조팀')
  await expect(submit).toBeEnabled()
})

test('S10: 팀 추가 모달에서 취소하면 팀이 생기지 않는다', async ({ page }) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '팀 추가하기' }).click()
  await page.getByLabel('팀 이름').fill('임시팀')
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(railRows(page)).toHaveCount(4)
  await expect(page.getByText('4개')).toBeVisible()
  await expect(page.getByText('임시팀')).toBeHidden()
})

test('S11: 팀명 변경을 취소하면 원래 이름으로 돌아간다', async ({ page }) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '팀명 변경' }).click()
  await page.getByLabel('팀 이름').fill('잘못 입력')
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page.getByLabel('팀 이름')).toBeHidden()
  await expect(page.getByRole('heading', { name: '동물 관리팀' })).toBeVisible()
  await expect(railRows(page).first()).toContainText('동물 관리팀')
})

test('S12: 팀원 추가 모달에서 이름으로 검색하면 목록이 걸러진다', async ({
  page,
}) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '인원 추가하기' }).click()
  const allCount = await staffRows(page).count()

  await page.getByLabel('이름으로 검색').fill('박서준')
  await expect(staffRows(page)).toHaveCount(1)
  await expect(staffRows(page).first()).toContainText('박서준')

  await page.getByLabel('이름으로 검색').fill('')
  await expect(staffRows(page)).toHaveCount(allCount)
})

test('S13: 아무도 고르지 않으면 `추가 완료` 가 비활성이다', async ({ page }) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '인원 추가하기' }).click()

  const submit = page.getByRole('button', { name: '추가 완료' })
  await expect(submit).toBeVisible()
  await expect(submit).toBeDisabled()

  await page.getByRole('button', { name: '박서준 추가' }).click()
  await expect(page.getByRole('button', { name: '1명 추가' })).toBeEnabled()
})

test('S14: 고른 직원을 선택 취소하면 전체 그룹으로 돌아간다', async ({
  page,
}) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '인원 추가하기' }).click()
  await page.getByRole('button', { name: '박서준 추가' }).click()
  await expect(page.getByText('추가할 인원 1명')).toBeVisible()

  await page.getByRole('button', { name: '박서준 선택 취소' }).click()

  await expect(page.getByText('추가할 인원 1명')).toBeHidden()
  await expect(page.getByText('전체 직원')).toBeHidden()
  await expect(page.getByRole('button', { name: '박서준 추가' })).toBeVisible()
  await expect(page.getByRole('button', { name: '추가 완료' })).toBeDisabled()
})

test('S15: 팀 삭제 확인 모달에서 취소하면 팀이 남는다', async ({ page }) => {
  await page.goto('/settings/teams')

  await page.getByRole('button', { name: '팀 삭제' }).click()
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page.getByRole('alertdialog')).toBeHidden()
  await expect(railRows(page)).toHaveCount(4)
  await expect(page.getByText('4개')).toBeVisible()
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeHidden()
})

test('S16: 이미 팀에 속한 직원은 팀원 추가 목록에 없다', async ({ page }) => {
  await page.goto('/settings/teams')

  const memberNames = await memberRows(page).allInnerTexts()

  await page.getByRole('button', { name: '인원 추가하기' }).click()
  const staffNames = (await staffRows(page).allInnerTexts()).join('\n')

  for (const row of memberNames) {
    const name = row.split('\n')[0]
    expect(staffNames).not.toContain(name)
  }
})
