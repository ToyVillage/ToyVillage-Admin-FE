import { expect, test } from '@playwright/test'
import { mockCloseDayApi, thisMonthDate } from './support/close-day-api'

// 승인된 시나리오(close-schedule-detail.approved.json: S1~S5)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 휴무일 API 는 page.route mock 을 쓴다. 실제 서버는 호출하지 않는다.

const detailPath = '/notices/guide/1'
const title = '토이빌리지 동물 정기검진'

test('S1: 목록 카드 → 상세 이동', async ({ page }) => {
  await mockCloseDayApi(page)
  await page.goto('/notices/guide')
  await page.getByRole('link', { name: `${title} 휴무 일정 상세` }).click()

  await expect(page).toHaveURL(/\/notices\/guide\/1$/)
})

test('S2: 읽기 전용 표시', async ({ page }) => {
  await mockCloseDayApi(page)
  await page.goto('/notices/guide')
  await page.getByRole('link', { name: `${title} 휴무 일정 상세` }).click()

  await expect(page.getByText('시작일', { exact: true })).toBeVisible()
  await expect(page.getByText(dotted(thisMonthDate(13)))).toBeVisible()
  await expect(page.getByText('종료일', { exact: true })).toBeVisible()
  await expect(page.getByText(dotted(thisMonthDate(14)))).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: title }),
  ).toBeVisible()
  await expect(page.getByRole('textbox')).toHaveCount(0)
  await expect(page.locator('input')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '저장하기' })).toHaveCount(0)
})

test('S3: 뒤로가기 → 휴무일 관리', async ({ page }) => {
  await mockCloseDayApi(page)
  await page.goto(detailPath)
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/notices\/guide$/)
})

test('S4: 존재하지 않는 ID → 휴무일 관리로 replace 이동', async ({ page }) => {
  await mockCloseDayApi(page)
  await page.goto('/notices/guide')
  await page.goto('/notices/guide/999')

  await expect(page).toHaveURL(/\/notices\/guide$/)
  await page.goBack()
  await expect(page).not.toHaveURL(/\/notices\/guide\/999$/)
})

test('S5: 새로고침 직접 진입 → 조회값 표시', async ({ page }) => {
  await mockCloseDayApi(page)
  await page.goto(detailPath)

  await expect(
    page.getByRole('heading', { level: 1, name: title }),
  ).toBeVisible()
  await expect(page.getByText(dotted(thisMonthDate(13)))).toBeVisible()
  await expect(page.getByText(dotted(thisMonthDate(14)))).toBeVisible()
})

function dotted(date: string) {
  return date.replaceAll('-', '.')
}
