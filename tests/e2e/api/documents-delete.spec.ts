import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(documents-delete.test-scenarios.md: S1~S3)를 mock 으로 변환한 것.
// 목록의 행 케밥 `삭제` → 확인 모달 → DELETE /documents/{id} 로 삭제한다.
// 실제 서버는 호출하지 않는다.

const detail = {
  id: 1,
  title: '삭제할 자료',
  type: 'PDF',
  createdAt: '2026-06-30T10:00:00.000',
  files: [{ fileName: '문서.pdf', fileKey: 'key-1' }],
}

// 목록 조회(GET /documents?...)는 삭제 대상 한 건만 돌려준다.
async function routeList(page: Page) {
  await page.route(/\/documents(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        documents: [
          {
            id: detail.id,
            title: detail.title,
            type: detail.type,
            createdAt: detail.createdAt,
          },
        ],
        totalPageSize: 1,
      }),
    })
  })
}

async function openDeleteFromList(page: Page) {
  await page.goto('/notices/resources')
  await page.getByRole('button', { name: `${detail.title} 관리 메뉴` }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  const dialog = page.getByRole('alertdialog', { name: '정말 삭제하시겠습니까?' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: '확인' }).click()
}

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-02-06T19:56:53.62201',
  description: '에러 설명',
})

async function routeDelete(
  page: Page,
  del: { status: number; body: unknown; onCalled?: () => void },
) {
  await page.route('**/documents/*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
      return
    }
    if (method === 'DELETE') {
      del.onCalled?.()
      await route.fulfill({
        status: del.status,
        contentType: 'application/json',
        body: JSON.stringify(del.body),
      })
      return
    }
    await route.fallback()
  })
}

test('S1: 삭제 성공(200) → 행 제거, 상세 재진입은 새로 조회한다', async ({
  page,
}) => {
  let deleteCalled = false
  let detailGetCount = 0
  let deleted = false
  await page.route(/\/documents(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        documents: deleted
          ? []
          : [
              {
                id: detail.id,
                title: detail.title,
                type: detail.type,
                createdAt: detail.createdAt,
              },
            ],
        totalPageSize: 1,
      }),
    })
  })
  await page.route('**/documents/*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      detailGetCount += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(detail),
      })
      return
    }
    if (method === 'DELETE') {
      deleteCalled = true
      deleted = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '자료 삭제 성공' }),
      })
      return
    }
    await route.fallback()
  })

  // 1. 목록 케밥으로 삭제 → 행이 사라지고 상세는 조회하지 않는다
  await openDeleteFromList(page)
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  expect(deleteCalled).toBe(true)
  expect(detailGetCount).toBe(0)

  // 2. 상세로 직접 들어가면 캐시 없이 새로 조회한다(gcTime: 0)
  await page.goto(`/notices/resources/${detail.id}`)
  await expect(page.getByRole('heading', { name: detail.title })).toBeVisible()
  expect(detailGetCount).toBe(1)
})

test('S2: 404 존재하지 않는 자료 → 삭제 실패 토스트', async ({ page }) => {
  await routeDelete(page, {
    status: 404,
    body: errorBody(404, '존재하지 않는 자료입니다.'),
  })
  await routeList(page)
  await openDeleteFromList(page)

  await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
})

test('S3: 500 → 삭제 실패 토스트', async ({ page }) => {
  await routeDelete(page, {
    status: 500,
    body: errorBody(500, '예상하지 못한 에러가 발생했습니다.'),
  })
  await routeList(page)
  await openDeleteFromList(page)

  await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
})

test('S4: 401 만료된 토큰 → 세션을 비우고 로그인으로 이동', async ({ page }) => {
  await routeDelete(page, {
    status: 401,
    body: errorBody(401, '만료된 토큰입니다.'),
  })
  await routeList(page)
  await openDeleteFromList(page)

  await expect(page).toHaveURL(/\/login$/)
  expect(
    await page.evaluate(() => localStorage.getItem('accessToken')),
  ).toBeNull()
})
