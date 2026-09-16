import { expect, test, type Page } from '@playwright/test'
import { mockWorkLogApi } from '../support/work-log-api'

// 대상: WORK_LOG_QUERY (GET /work-log/{workLogId}) · WORK_LOG_TEMPLATE_QUERY
// (GET /work-log/template/{workLogTemplateId}) · 두 DELETE.
// 일지 시트가 일지 답변 + 양식 질문 두 응답을 합쳐 그려지는 점을 고정한다.

const sheetRows = (page: Page) => page.getByTestId('work-log-sheet-row')

test('S1: 상세는 일지와 그 양식을 함께 조회한다', async ({ page }) => {
  const api = await mockWorkLogApi(page)

  await page.goto('/work-logs/1')
  await expect(sheetRows(page)).toHaveCount(3)

  expect(api.requests.detail).toBe(1)
  expect(api.requests.templateDetail).toBe(1)
})

test('S2: 답변이 없는 일지도 양식 질문으로 열을 그린다', async ({ page }) => {
  await mockWorkLogApi(page)

  await page.goto('/work-logs/100')

  await expect(sheetRows(page)).toHaveCount(6)
  await expect(page.getByText('청소방법이 뭔가요?')).toBeVisible()
})

test('S3: 기타 보기는 직원이 입력한 etcText 로 표기한다', async ({ page }) => {
  await mockWorkLogApi(page)

  await page.goto('/work-logs/1')

  await expect(sheetRows(page).nth(2)).toContainText('야간 소독')
})

test('S4: 404 면 목록으로 되돌린다', async ({ page }) => {
  await mockWorkLogApi(page)

  await page.goto('/work-logs/999')

  await expect(page).toHaveURL(/\/work-logs$/)
})

test('S5: 일지 삭제는 DELETE /work-log/{id} 를 부르고 목록을 다시 조회한다', async ({
  page,
}) => {
  const api = await mockWorkLogApi(page)

  await page.goto('/work-logs')
  await page
    .getByTestId('work-log-row')
    .first()
    .getByRole('button', { name: /관리 메뉴$/ })
    .click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page.getByRole('status')).toContainText(
    '데이터 삭제에 성공했습니다',
  )
  expect(api.requests.delete).toBe(1)
  expect(api.requests.list).toBeGreaterThan(1)
})

test('S6: 양식 삭제는 DELETE /work-log/template/{id} 를 부른다', async ({
  page,
}) => {
  const api = await mockWorkLogApi(page)

  await page.goto('/work-logs?tab=forms')
  await page
    .getByTestId('work-log-form-row')
    .first()
    .getByRole('button', { name: /관리 메뉴$/ })
    .click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page
    .getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
    .getByRole('button', { name: '확인' })
    .click()

  await expect(page.getByRole('status')).toContainText(
    '데이터 삭제에 성공했습니다',
  )
  expect(api.requests.templateDelete).toBe(1)
})
