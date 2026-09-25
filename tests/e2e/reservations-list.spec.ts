import { test, expect, type Page } from '@playwright/test'

// 단체예약 현황(리스트) 화면 테스트.
// 리스트는 RESERVATION_ADMIN_QUERY_ALL(GET /reservation)로 조회하며, 상태 필터·검색·정렬·
// 페이지네이션을 모두 서버 파라미터(status/title/sort/page/size)로 처리한다. 따라서 mock 도
// 요청 파라미터를 읽어 서버처럼 필터/정렬/페이지 슬라이스해 응답한다(클라이언트 재필터 없음).
// 상태 카운트(beforeVisitSite/doneVisitSite/doneVisit)는 필터와 무관하게 항상 전체 기준이다.

type Item = {
  id: number
  title: string
  counselDate: string
  reservationDate: string
  reservationTime: string
  location: string
  count: number
  status: '사전답사 전' | '사전답사 완료' | '방문 완료'
}

// 사전답사 전 11건(→ 2페이지), 사전답사 완료 1건, 방문 완료 1건.
// 상담일 최댓값은 대구어린이집(id1), 예약일 최댓값은 행복유치원(id2)로 정렬 전환을 검증한다.
const dataset: Item[] = [
  { id: 1, title: '대구어린이집', counselDate: '2026-07-20', reservationDate: '2026-07-10', reservationTime: '13:01:00', location: '대구광역시', count: 18, status: '사전답사 전' },
  { id: 2, title: '행복유치원', counselDate: '2026-07-01', reservationDate: '2026-07-30', reservationTime: '10:30:00', location: '서울특별시', count: 24, status: '사전답사 전' },
  { id: 3, title: '푸른숲어린이집', counselDate: '2026-07-05', reservationDate: '2026-07-16', reservationTime: '14:00:00', location: '부산광역시', count: 15, status: '사전답사 전' },
  { id: 4, title: '햇살유치원', counselDate: '2026-07-03', reservationDate: '2026-07-12', reservationTime: '11:15:00', location: '인천광역시', count: 30, status: '사전답사 전' },
  { id: 5, title: '무지개어린이집', counselDate: '2026-07-02', reservationDate: '2026-07-22', reservationTime: '09:45:00', location: '광주광역시', count: 20, status: '사전답사 전' },
  { id: 6, title: '별빛유치원', counselDate: '2026-06-28', reservationDate: '2026-07-11', reservationTime: '13:30:00', location: '대전광역시', count: 22, status: '사전답사 전' },
  { id: 7, title: '하늘어린이집', counselDate: '2026-06-27', reservationDate: '2026-07-09', reservationTime: '10:00:00', location: '울산광역시', count: 12, status: '사전답사 전' },
  { id: 8, title: '바다유치원', counselDate: '2026-06-26', reservationDate: '2026-07-08', reservationTime: '15:20:00', location: '세종특별자치시', count: 16, status: '사전답사 전' },
  { id: 9, title: '숲속어린이집', counselDate: '2026-06-25', reservationDate: '2026-07-07', reservationTime: '12:10:00', location: '경기도', count: 19, status: '사전답사 전' },
  { id: 10, title: '들꽃유치원', counselDate: '2026-06-24', reservationDate: '2026-07-06', reservationTime: '16:40:00', location: '강원도', count: 14, status: '사전답사 전' },
  { id: 11, title: '새싹어린이집', counselDate: '2026-06-23', reservationDate: '2026-07-05', reservationTime: '08:50:00', location: '충청북도', count: 21, status: '사전답사 전' },
  { id: 12, title: '상록어린이집', counselDate: '2026-06-20', reservationDate: '2026-07-01', reservationTime: '13:00:00', location: '전라남도', count: 17, status: '사전답사 완료' },
  { id: 13, title: '한빛어린이집', counselDate: '2026-06-18', reservationDate: '2026-07-03', reservationTime: '16:20:00', location: '경상북도', count: 12, status: '방문 완료' },
]

const codeToLabel: Record<string, Item['status']> = {
  BEFORE_SITE_VISIT: '사전답사 전',
  SITE_VISIT_COMPLETED: '사전답사 완료',
  VISIT_COMPLETED: '방문 완료',
}

function countBy(rows: Item[], status: Item['status']): number {
  return rows.filter((item) => item.status === status).length
}

// 요청 파라미터로 서버처럼 필터/정렬/페이지 처리해 API 응답 형태로 만든다.
function buildBody(url: URL, rows: Item[] = dataset) {
  const status = url.searchParams.get('status')
  const title = (url.searchParams.get('title') ?? '').trim()
  const sort = url.searchParams.get('sort') ?? 'RESERVATION_DATE'
  // 단체예약 목록은 1-based 로 요청한다.
  const page = Number(url.searchParams.get('page') ?? '1')
  const size = Number(url.searchParams.get('size') ?? '10')

  const label = status ? codeToLabel[status] : undefined
  let items = label ? rows.filter((i) => i.status === label) : rows
  if (title) items = items.filter((i) => i.title.includes(title))

  const key = sort === 'COUNSEL_DATE' ? 'counselDate' : 'reservationDate'
  const sorted = [...items].sort((a, b) => {
    if (a[key] !== b[key]) return a[key] < b[key] ? 1 : -1 // 내림차순
    return b.id - a.id // 동률 시 id 내림차순
  })

  const totalPages = Math.ceil(sorted.length / size)
  const start = (page - 1) * size
  const content = sorted.slice(start, start + size)

  return {
    beforeVisitSite: countBy(rows, '사전답사 전'),
    doneVisitSite: countBy(rows, '사전답사 완료'),
    doneVisit: countBy(rows, '방문 완료'),
    reservationAdminQueryListObjectResponse: {
      content,
      pageable: { pageNumber: page, pageSize: size, offset: start, paged: true, unpaged: false },
      totalPages,
      totalElements: sorted.length,
      size,
      number: page,
      first: page === 0,
      last: start + size >= sorted.length,
      numberOfElements: content.length,
      empty: content.length === 0,
    },
  }
}

// `rows` 를 넘기면 매 요청마다 그 시점의 목록으로 응답한다(삭제 후 재조회 검증용).
async function routeList(page: Page, rows: () => Item[] = () => dataset) {
  await page.route(/^https:\/\/[^/]+\/reservation\?/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildBody(new URL(route.request().url()), rows())),
    })
  })
}

// 삭제 라우트. `ok` 가 false 면 서버 오류로 응답해 실패 토스트를 검증한다.
// 실패 응답에 message 를 넣지 않는다 — 서버 사유가 없을 때의 Figma 기본 문구를 본다.
async function routeDelete(
  page: Page,
  ok = true,
  onDeleted?: (id: number) => void,
) {
  await page.route(/^https:\/\/[^/]+\/reservation\/\d+$/, async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback()
    if (ok) onDeleted?.(Number(new URL(route.request().url()).pathname.split('/').pop()))
    await route.fulfill({
      status: ok ? 200 : 500,
      contentType: 'application/json',
      body: JSON.stringify(ok ? { message: '삭제되었습니다' } : {}),
    })
  })
}

test('S1: 리스트 표시', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')

  await expect(page.getByRole('heading', { name: '단체예약 현황' })).toBeVisible()
  await expect(page.getByRole('button', { name: /사전답사 전/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /사전답사 완료/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /방문 완료/ })).toBeVisible()
  await expect(
    page.getByRole('button', { name: '단체예약 생성하기' }),
  ).toBeVisible()
  await expect(page.getByText('상담일', { exact: true })).toBeVisible()
  await expect(page.getByRole('searchbox', { name: '예약 검색' })).toBeVisible()
  await expect(page.getByTestId('reservation-row').first()).toBeVisible()
  // 사전답사 전 11건 → 2페이지.
  await expect(page.getByRole('button', { name: '2 페이지' })).toBeVisible()

  // 개편으로 사라진 것들: 행 체크박스와 일괄 `페이지 권한주기` 버튼.
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: '페이지 권한주기' }),
  ).toHaveCount(0)
})

test('S2: 상태 필터 (방문 완료)', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')
  await page.getByRole('button', { name: /방문 완료/ }).click()

  // 서버가 VISIT_COMPLETED 만 반환 → 한빛어린이집만 보이고 사전답사 전 항목은 사라진다.
  await expect(page.getByText('한빛어린이집')).toBeVisible()
  await expect(page.getByText('대구어린이집')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /방문 완료/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('S3: 검색', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')
  const search = page.getByRole('searchbox', { name: '예약 검색' })

  await search.fill('행복')
  await expect(page.getByText('행복유치원')).toBeVisible()
  await expect(page.getByText('대구어린이집')).toHaveCount(0)

  await search.fill('존재하지않는단체')
  await expect(page.getByText('검색결과가 없습니다')).toBeVisible()
})

test('S4: 정렬 (상담일순 → 예약일순)', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')

  // 기본 상담일순: 첫 행은 상담일이 가장 늦은 대구어린이집
  await expect(page.getByTestId('reservation-row').first()).toContainText(
    '대구어린이집',
  )

  await page.getByRole('button', { name: '예약 정렬' }).click()
  await page.getByRole('menuitemradio', { name: '예약일순' }).click()

  // 예약일순: 첫 행은 예약일이 가장 늦은 행복유치원
  await expect(page.getByTestId('reservation-row').first()).toContainText(
    '행복유치원',
  )
  await expect(page.getByRole('menuitemradio', { name: '예약일순' })).toHaveCount(
    0,
  )
})

test('S5: 행 클릭 → 상세 이동', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')
  await page.getByTestId('reservation-row').first().click()
  await expect(page).toHaveURL(/\/notices\/reservations\/\d+$/)
})

test('S6: 행 케밥 메뉴는 한 번에 하나만 열린다', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')

  await page.getByRole('button', { name: '대구어린이집 관리 메뉴' }).click()
  await expect(page.getByRole('menuitem', { name: '수정' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '삭제' })).toBeVisible()

  await page.getByRole('button', { name: '행복유치원 관리 메뉴' }).click()
  await expect(
    page.getByRole('menu', { name: '대구어린이집 관리 메뉴' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('menu', { name: '행복유치원 관리 메뉴' }),
  ).toBeVisible()
})

test('S7: 케밥 수정 → 수정 페이지 이동', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')

  await page.getByRole('button', { name: '대구어린이집 관리 메뉴' }).click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/notices\/reservations\/1\/edit$/)
})

test('S8: 케밥 삭제 → 확인 모달 → 성공·실패 토스트', async ({ page }) => {
  // 삭제에 성공하면 서버 목록에서도 빠진다.
  let rows = dataset
  await routeList(page, () => rows)
  await routeDelete(page, true, (id) => {
    rows = rows.filter((item) => item.id !== id)
  })
  await page.goto('/notices/reservations')

  await page.getByRole('button', { name: '대구어린이집 관리 메뉴' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()

  await expect(page.getByText('정말 삭제하시겠습니까?')).toBeVisible()
  await page.getByRole('button', { name: '확인' }).click()
  await expect(page.getByText('데이터 삭제에 성공했습니다')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '대구어린이집 관리 메뉴' }),
  ).toHaveCount(0)

  // 서버가 실패로 응답하면 실패 토스트를 보인다.
  await routeDelete(page, false)
  await page.getByRole('button', { name: '행복유치원 관리 메뉴' }).click()
  await page.getByRole('menuitem', { name: '삭제' }).click()
  await page.getByRole('button', { name: '확인' }).click()
  await expect(page.getByText('데이터 삭제에 실패했습니다')).toBeVisible()
})

test('S9: 데이터 없음 빈 상태', async ({ page }) => {
  // 전체가 빈 응답(카운트·목록 모두 0).
  await page.route(/^https:\/\/[^/]+\/reservation\?/, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        beforeVisitSite: 0,
        doneVisitSite: 0,
        doneVisit: 0,
        reservationAdminQueryListObjectResponse: {
          content: [],
          pageable: { pageNumber: 0, pageSize: 10, offset: 0, paged: true, unpaged: false },
          totalPages: 0,
          totalElements: 0,
          size: 10,
          number: 0,
          first: true,
          last: true,
          numberOfElements: 0,
          empty: true,
        },
      }),
    })
  })
  await page.goto('/notices/reservations')

  await expect(page.getByText('아직 단체예약이 없습니다')).toBeVisible()
  await expect(page.getByTestId('reservation-row')).toHaveCount(0)
})

test('S10: 페이지네이션·리셋', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')

  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(page.getByRole('button', { name: '2 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  // 정렬 변경 시 1페이지로 리셋
  await page.getByRole('button', { name: '예약 정렬' }).click()
  await page.getByRole('menuitemradio', { name: '예약일순' }).click()
  await expect(page.getByRole('button', { name: '1 페이지' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('S11: 생성 복귀 토스트는 한 번만 뜬다', async ({ page }) => {
  await routeList(page)
  await page.goto('/notices/reservations')
  // 생성 화면이 넘기는 이동 state 를 그대로 재현한다.
  await page.evaluate(() => {
    window.history.replaceState({ usr: { toast: 'created' } }, '')
  })
  await page.reload()

  await expect(page.getByText('데이터 생성에 성공했습니다')).toBeVisible()

  await page.reload()
  await expect(page.getByText('데이터 생성에 성공했습니다')).toHaveCount(0)
})
