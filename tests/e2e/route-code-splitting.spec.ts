import { expect, test } from '@playwright/test'

// 화면 코드는 라우트마다 나뉘어 그 경로에 들어갈 때 받는다.
// dev 서버는 모듈을 파일 단위로 내려주므로 `/src/pages/` 요청으로 어떤 화면 코드를 받았는지 본다.

const pageModulePattern = /\/src\/pages\//

test.use({ storageState: { cookies: [], origins: [] } })

test('로그인 화면은 다른 화면 코드를 받지 않는다', async ({ page }) => {
  const pageModules: string[] = []
  page.on('request', (request) => {
    if (pageModulePattern.test(request.url())) {
      pageModules.push(new URL(request.url()).pathname)
    }
  })

  await page.goto('/login')
  await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()

  expect(pageModules).toContain('/src/pages/login/LoginPage.tsx')
  expect(
    pageModules.filter((path) => !path.startsWith('/src/pages/login/')),
  ).toEqual([])
})

test('로그인 화면 코드를 받는 동안 로그인 스켈레톤을 보인다', async ({
  page,
}) => {
  let release!: () => void
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(/\/src\/pages\/login\/LoginPage\.tsx/, async (route) => {
    await released
    await route.fallback()
  })

  await page.goto('/login')
  const skeleton = page.getByRole('status', { name: '불러오는 중' })
  await expect(skeleton).toBeVisible()
  await expect(skeleton).toHaveAttribute('aria-busy', 'true')
  await expect(page.getByRole('button', { name: '로그인' })).toHaveCount(0)

  release()
  await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
  await expect(skeleton).toHaveCount(0)
})
