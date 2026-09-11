import { expect, test } from '@playwright/test'

// 2026-09-11 회귀: 표 컨테이너(`DataTable`)의 `overflow: hidden` 이 행 안에서
// 열리는 케밥 메뉴를 잘라, 마지막 행에서 `수정`·`삭제` 가 화면에 보이지 않았다.
// 행이 하나뿐일 때 표가 가장 짧아 재현이 확실하다.

const taskListPath = /\/api\/tasks(?:\?.*)?$/

const singleRowBody = {
  tasks: [
    {
      id: 1,
      title: '테스트',
      assignees: [{ id: 2, name: '김직원', position: null }],
      assigneeCount: 1,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      finishDate: '2026-09-16',
    },
  ],
  totalPageSize: 1,
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'row-action-menu-test-token')
  })

  await page.route(taskListPath, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(singleRowBody),
    })
  })
})

test('마지막 행의 케밥 메뉴가 표에 잘리지 않는다', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('button', { name: '김직원 테스트 업무 메뉴 열기' }).click()

  const editItem = page.getByRole('menuitem', { name: '수정' })
  await expect(editItem).toBeVisible()

  // `toBeVisible()` 은 조상의 overflow 클리핑을 보지 못한다. 메뉴 항목 중심에서
  // 실제로 잡히는 요소가 그 항목인지 확인해야 잘림을 잡을 수 있다.
  const box = await editItem.boundingBox()
  expect(box).not.toBeNull()

  const hitsMenuItem = await page.evaluate(
    ([x, y]) =>
      document.elementFromPoint(x, y)?.closest('[role="menuitem"]') !== null,
    [box!.x + box!.width / 2, box!.y + box!.height / 2],
  )
  expect(hitsMenuItem).toBe(true)
})

test('케밥 `수정` 으로 수정 화면에 들어간다', async ({ page }) => {
  await page.goto('/tasks')
  await page.getByRole('button', { name: '김직원 테스트 업무 메뉴 열기' }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(/\/tasks\/1\/edit$/)
})
