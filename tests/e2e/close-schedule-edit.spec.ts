import { expect, test } from '@playwright/test'
import {
  closeDayItemPattern,
  mockCloseDayApi,
  thisMonthDate,
} from './support/close-day-api'

// 승인된 시나리오(close-schedule-edit.approved.json: S1~S8)를 변환한 것.
// 승인 후에는 시나리오를 재도출하지 않고 실패 시 프로덕션 코드를 수정한다.
// 휴관일 API 는 page.route mock 을 쓴다. 실제 서버는 호출하지 않는다.

const editPath = '/notices/guide/1/edit'
const cardMenu = '토이빌리지 동물 정기검진 메뉴'

test('S1: 오른쪽 휴관 일정 카드 케밥 수정 → 해당 일정 수정 화면 이동', async ({
  page,
}) => {
  await mockCloseDayApi(page)
  await page.goto('/notices/guide')
  await page.getByRole('button', { name: cardMenu }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(editPath)
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
})

test('S2: 수정 페이지 → 기존 날짜와 제목 표시', async ({ page }) => {
  await mockCloseDayApi(page)
  await page.goto(editPath)

  await expect(page.getByLabel('시작일')).toHaveValue(thisMonthDate(13))
  await expect(page.getByLabel('종료일')).toHaveValue(thisMonthDate(14))
  await expect(page.getByLabel(/제목/)).toHaveValue('토이빌리지 동물 정기검진')
})

test('S3: 유효한 값 수정 → 동일 ID 카드 하나에 수정값 반영', async ({
  page,
}) => {
  await mockCloseDayApi(page)
  await page.goto(editPath)
  await page.getByLabel('시작일').fill(thisMonthDate(15))
  await page.getByLabel('종료일').fill(thisMonthDate(16))
  await page.getByLabel(/제목/).fill('수정된 정기검진')

  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL('/notices/guide')
  const editedCard = page.getByRole('link', {
    name: '수정된 정기검진 휴관 일정 상세',
  })
  await expect(editedCard).toHaveCount(1)
  const month = new Date().getMonth() + 1
  await expect(editedCard).toContainText(`${month}월 15일 ~ ${month}월 16일`)
  await expect(page.getByText('토이빌리지 동물 정기검진')).toHaveCount(0)
})

test('S4: 잘못된 입력 → 수정하지 않고 오류 dialog 표시', async ({ page }) => {
  let putCount = 0
  page.on('request', (request) => {
    if (request.method() === 'PUT' && closeDayItemPattern.test(request.url())) {
      putCount += 1
    }
  })
  await mockCloseDayApi(page)
  await page.goto(editPath)
  await page.getByLabel('시작일').fill('')
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    '휴관일을 입력해 주세요',
  )
  await page.getByRole('button', { name: '확인' }).click()

  await page.getByLabel('시작일').fill(thisMonthDate(20))
  await page.getByLabel('종료일').fill(thisMonthDate(19))
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    '종료일은 시작일과 같거나 이후여야 합니다',
  )
  await page.getByRole('button', { name: '확인' }).click()

  await page.getByLabel('종료일').fill(thisMonthDate(20))
  await page.getByLabel(/제목/).fill('   ')
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page.getByRole('alertdialog')).toContainText(
    '제목을 입력해 주세요',
  )
  expect(putCount).toBe(0)
})

test('S5: 존재하지 않는 일정 ID → 휴관일 관리로 replace 이동', async ({
  page,
}) => {
  await mockCloseDayApi(page)
  await page.goto('/notices/guide/999/edit')

  await expect(page).toHaveURL('/notices/guide')
  await expect(page.getByRole('heading', { name: '휴관일 관리' })).toBeVisible()
})

test('S6: 수정 실패 → URL과 입력값 유지', async ({ page }) => {
  await mockCloseDayApi(page, { updateStatus: 500 })
  await page.goto(editPath)
  await page.getByLabel(/제목/).fill('보존할 수정 제목')

  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(editPath)
  await expect(page.getByRole('status')).toHaveText(
    '수정하지 못했습니다. 다시 시도해 주세요.',
  )
  await expect(page.getByLabel(/제목/)).toHaveValue('보존할 수정 제목')
  await expect(page.getByRole('button', { name: '저장하기' })).toBeEnabled()
})

test('S7: 키보드만으로 케밥 수정 진입·제목 편집·수정 저장', async ({
  page,
}) => {
  await mockCloseDayApi(page)
  await page.goto('/notices/guide')
  await page.getByRole('button', { name: cardMenu }).focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('menuitem', { name: '수정' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(editPath)

  const backLink = page.getByRole('link', { name: '뒤로가기' })
  await backLink.focus()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('시작일')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('종료일')).toBeFocused()
  await page.keyboard.press('Tab')
  const titleInput = page.getByLabel(/제목/)
  await expect(titleInput).toBeFocused()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.type('키보드 수정 일정')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: '저장하기' })).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL('/notices/guide')
  await expect(
    page.getByRole('link', { name: '키보드 수정 일정 휴관 일정 상세' }),
  ).toHaveCount(1)
})

test('S8: 삭제 버튼 없음', async ({ page }) => {
  await mockCloseDayApi(page)
  await page.goto(editPath)
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
  await expect(page.getByRole('button', { name: '삭제하기' })).toHaveCount(0)
})
