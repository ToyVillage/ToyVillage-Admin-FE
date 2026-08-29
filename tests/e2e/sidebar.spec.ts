import { test, expect, type Page } from '@playwright/test'

test('사이드바 열기와 닫기', async ({ page }) => {
  await page.goto('/notices/list')

  await page.getByRole('button', { name: '사이드바 열기' }).click()

  const sidebar = page.getByRole('dialog', { name: '사이드바' })
  await expect(sidebar).toBeVisible()
  await expect(sidebar.getByText('관리자 1')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(sidebar).toBeHidden()
})

test('사이드바 메뉴 클릭 시 이동하고 닫힘', async ({ page }) => {
  await page.goto('/notices/list')

  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await page.getByRole('link', { name: '자료실 바로가기' }).click()

  await expect(page).toHaveURL(/\/notices\/resources$/)
  await expect(page.getByRole('dialog', { name: '사이드바' })).toBeHidden()
})

const activeColor = 'rgb(73, 82, 255)'
const activeBackground = 'rgb(232, 233, 255)'

async function openMenu(page: Page, path: string, name: string) {
  await page.goto(path)
  await page.getByRole('button', { name: '사이드바 열기' }).click()

  const menu = page.getByRole('link', { name })
  await expect(menu).toBeVisible()
  return menu
}

test('현재 라우트의 메뉴를 활성 색으로 표시', async ({ page }) => {
  const menu = await openMenu(page, '/task-reports', '업무 보고 바로가기')

  await expect(menu).toHaveCSS('color', activeColor)
  await expect(menu).toHaveCSS('background-color', activeBackground)
})

test('상세 화면에서도 같은 메뉴가 활성', async ({ page }) => {
  const menu = await openMenu(page, '/task-reports/r1', '업무 보고 바로가기')

  await expect(menu).toHaveCSS('color', activeColor)
  await expect(menu).toHaveCSS('background-color', activeBackground)
})

test('상세 화면에서 다른 메뉴는 비활성', async ({ page }) => {
  const menu = await openMenu(page, '/task-reports/r1', '업무 관리 바로가기')

  await expect(menu).not.toHaveCSS('color', activeColor)
  await expect(menu).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
})
