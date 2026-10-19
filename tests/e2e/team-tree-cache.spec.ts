import { expect, test, type Page } from '@playwright/test'
import { mockEmployeeApi } from './support/employee-api'
import { mockTaskApi } from './support/task-api'

// 업무 만들기의 담당자 트리(GET /team/tree)는 응답이 느려 업무 목록·상세에서 미리 받아 둔다.
// 캐시는 새로고침하면 사라지므로 화면 이동은 앱 안에서 한다(page.goto 는 처음 한 번만).

const allEmployees = (page: Page) =>
  page.getByRole('checkbox', { name: /^전체 직원/ })

async function navigateInApp(page: Page, path: string) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

test('업무 목록에서 미리 받은 팀 구조로 업무 만들기를 연다', async ({
  page,
}) => {
  const taskApi = await mockTaskApi(page)

  await page.goto('/tasks')
  await expect.poll(() => taskApi.requests.tree).toBe(1)

  await page.getByRole('link', { name: '업무 등록하기' }).click()

  await expect(allEmployees(page)).toBeVisible()
  expect(taskApi.requests.tree).toBe(1)
})

test('업무 상세에서 미리 받은 팀 구조로 업무 수정을 연다', async ({ page }) => {
  const taskApi = await mockTaskApi(page)
  const [task] = taskApi.tasks

  await page.goto(`/tasks/${task.id}`)
  await expect.poll(() => taskApi.requests.tree).toBe(1)

  await navigateInApp(page, `/tasks/${task.id}/edit`)

  await expect(allEmployees(page)).toBeVisible()
  expect(taskApi.requests.tree).toBe(1)
})

test('직원 계정을 만들면 업무 만들기에서 팀 구조를 다시 받는다', async ({
  page,
}) => {
  const taskApi = await mockTaskApi(page)
  await mockEmployeeApi(page)

  await page.goto('/tasks')
  await expect.poll(() => taskApi.requests.tree).toBe(1)

  await navigateInApp(page, '/settings/accounts')
  await page.getByRole('button', { name: '계정 생성하기' }).click()
  const dialog = page.getByRole('dialog', { name: '계정 생성' })
  await dialog.getByLabel('이름').fill('박새롬')
  await dialog.getByLabel('아이디').fill('saerom.park')
  await dialog.getByRole('button', { name: '계정 생성' }).click()
  await expect(page.getByText('계정 생성에 성공했습니다')).toBeVisible()

  await navigateInApp(page, '/tasks/create')

  await expect(allEmployees(page)).toBeVisible()
  expect(taskApi.requests.tree).toBe(2)
})
