import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(reservations-query.test-scenarios.md: S1~S2)를 mock 으로 변환한 것.
// 대상: GET /reservation/{id} (RESERVATION_ADMIN_QUERY). 상세 진입 시 편집 폼 초기값으로 매핑된다.
// 실제 서버는 호출하지 않는다.

const detail = {
  counselDate: '2026-07-02',
  visitDate: '2026-07-13',
  visitTime: '13:01:00',
  exitTime: '15:00:00',
  reservationName: '차은우',
  reservationCount: 20,
  location: '대전광역시 유성구 장동',
  title: '대덕소프트웨어마이스터고',
  money: 200000,
  status: '사전답사 완료',
  leaderCount: 3,
  leaderPhoneNumber: '010-7753-9698',
}

const errorBody = (status: number, message: string) => ({
  message,
  status,
  timestamp: '2026-08-08T12:00:00',
  description: message,
})

async function routeDetail(page: Page, status: number, body: unknown) {
  // 상세(/api/reservation/{id})만 가로챈다.
  await page.route(/\/api\/reservation\/\d+$/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

test('S1: 상세 조회 성공 → 편집 폼 필드에 매핑 값 채움', async ({ page }) => {
  const requestURLs: string[] = []
  await page.route(/\/api\/reservation\/\d+$/, async (route) => {
    requestURLs.push(route.request().url())
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail),
    })
  })

  await page.goto('/notices/reservations/7')

  await expect(page.getByLabel('단체명', { exact: true })).toHaveValue(
    '대덕소프트웨어마이스터고',
  )
  await expect(page.getByLabel('지역', { exact: true })).toHaveValue(
    '대전광역시 유성구 장동',
  )
  await expect(page.getByLabel('예약인 이름')).toHaveValue('차은우')
  await expect(
    page.getByLabel('대표자 연락처를 입력해주세요'),
  ).toHaveValue('010-7753-9698')
  await expect(page.getByLabel('총 인원')).toHaveValue('20')
  await expect(page.getByLabel('인솔자 인원')).toHaveValue('3')
  await expect(page.getByLabel('입장료를 입력해주세요')).toHaveValue('200,000')
  await expect(page.getByLabel('상담일을 선택해주세요')).toHaveValue(
    '2026.07.02',
  )
  await expect(page.getByLabel('방문일을 선택해주세요')).toHaveValue(
    '2026.07.13',
  )
  // 24h "13:01:00" → 12h 01 + pm
  await expect(
    page.getByLabel('방문 시간을 선택해주세요 (입장시간) 시', { exact: true }),
  ).toHaveValue('01')
  await expect(
    page.getByLabel('방문 시간을 선택해주세요 (입장시간) 오전/오후'),
  ).toContainText('pm')

  // 요청 path 확인
  expect(requestURLs).toHaveLength(1)
  expect(new URL(requestURLs[0]).pathname).toBe('/api/reservation/7')
})

test('S2: 404 → 예약을 찾을 수 없습니다', async ({ page }) => {
  await routeDetail(page, 404, errorBody(404, '존재하지 않는 단체예약 목록입니다.'))

  await page.goto('/notices/reservations/999')

  await expect(page.getByText('예약을 찾을 수 없습니다.')).toBeVisible()
})
