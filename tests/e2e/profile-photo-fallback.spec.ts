import { expect, test, type Page } from '@playwright/test'
import {
  mockAnimalManageApi,
  storedFilePattern,
} from './support/animal-manage-api'

// 종·개체 프로필 사진을 불러오지 못하면 깨진 이미지 대신 `사진 없음` 을 그린다.
// 가짜 서버가 저장 파일을 1x1 png 로 주므로, 이 파일에서만 CDN 응답을 404 로 덮어쓴다.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('accessToken', 'profile-photo-fallback-test-token')
  })
  await mockAnimalManageApi(page)
})

test('종 사진을 불러오지 못하면 사진 없음을 표시한다', async ({ page }) => {
  await failStoredFiles(page)
  await page.goto('/species/1')

  const photo = page.getByRole('img', { name: '카피바라 사진' })
  await expect(photo).toHaveText('사진 없음')
  await expect(photo).toHaveCSS('width', '260px')
  await expect(photo).toHaveCSS('height', '260px')
})

test('개체 사진을 불러오지 못하면 사진 없음을 표시한다', async ({ page }) => {
  await failStoredFiles(page)
  await page.goto('/species/1/individuals/1')

  const photo = page.getByRole('img', { name: '동식이 사진' })
  await expect(photo).toHaveText('사진 없음')
  await expect(photo).toHaveCSS('width', '180px')
  await expect(photo).toHaveCSS('height', '180px')
})

test('사진을 불러오면 이미지를 그대로 표시한다', async ({ page }) => {
  await page.goto('/species/1')

  const photo = page.getByRole('img', { name: '카피바라 사진' })
  await expect(photo).toHaveJSProperty('tagName', 'IMG')
  await expect
    .poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0)
})

async function failStoredFiles(page: Page) {
  await page.route(storedFilePattern, (route) =>
    route.fulfill({ status: 404, body: '' }),
  )
}
