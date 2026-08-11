import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(task-report.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 localStorage mock 만 사용한다.

const reviewStorageKey = 'toyvillage:task-reports:reviews'
const mutationDelayStorageKey = 'toyvillage:task-reports:mutation-delay'
const mutationLogStorageKey = 'toyvillage:task-reports:mutation-log'
const allMockReportIds = [
  'r1',
  'r2',
  'r3',
  'r4',
  'r5',
  'r6',
  'r7',
  'r8',
  'r9',
  'r10',
  'r11',
  'r12',
  'r13',
  'r14',
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
  })
})

test('S1: 목록 진입 기본 상태', async ({ page }) => {
  await page.goto('/task-reports')

  await expect(page.getByRole('heading', { name: '업무보고' })).toBeVisible()
  await expect(page.getByText('토이빌리지 업무 보고 관리')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '심사대기 7', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(rows(page)).toHaveCount(3)
})

test('S2: 컬럼 표시 확인', async ({ page }) => {
  await page.goto('/task-reports')

  for (const header of [
    '담당자',
    '제목',
    '상태',
    '우선순위',
    '완료기한',
    '공개범위',
  ]) {
    await expect(page.getByText(header, { exact: true }).first()).toBeVisible()
  }
})

test('S3: 탭 라벨에 건수 표시', async ({ page }) => {
  await page.goto('/task-reports')

  for (const label of ['심사대기 7', '완료 3', '반려 2', '재제출 2']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: /팀이름/ })).toHaveCount(0)
})

test('S4: 완료 탭 필터', async ({ page }) => {
  await page.goto('/task-reports')
  const tab = page.getByRole('button', { name: '완료 3', exact: true })
  await tab.click()

  await expect(tab).toHaveAttribute('aria-pressed', 'true')
  await expect(rows(page)).toHaveCount(3)
  await expect(rows(page).first()).toContainText('자료실 파일 정리 보고')
})

test('S5: 재제출 탭 필터', async ({ page }) => {
  await page.goto('/task-reports')
  const tab = page.getByRole('button', { name: '재제출 2', exact: true })
  await tab.click()

  await expect(tab).toHaveAttribute('aria-pressed', 'true')
  await expect(rows(page)).toHaveCount(2)
  await expect(rows(page).first()).toContainText('전시물 교체 보고')
})

test('S6: 페이지네이션 이동', async ({ page }) => {
  await page.goto('/task-reports')
  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(rows(page)).toHaveCount(3)
  await expect(rows(page).first()).toContainText('여름 프로그램 준비 보고')
})

test('S7: 탭 전환 시 첫 페이지로 복귀', async ({ page }) => {
  await page.goto('/task-reports')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page).first()).toContainText('여름 프로그램 준비 보고')

  await page.getByRole('button', { name: '완료 3', exact: true }).click()

  await expect(rows(page)).toHaveCount(3)
  await expect(rows(page).first()).toContainText('자료실 파일 정리 보고')
})

test('S8: 행 클릭 → 상세 이동', async ({ page }) => {
  await page.goto('/task-reports')
  await rows(page).first().click()

  await expect(page).toHaveURL(/\/task-reports\/r1$/)
})

test('S9: 상세 표시 내용', async ({ page }) => {
  await page.goto('/task-reports/r1')

  await expect(page.getByText('우선순위:')).toBeVisible()
  await expect(page.getByText('상태:')).toBeVisible()
  await expect(page.getByText('담당자: 이승현')).toBeVisible()
  await expect(page.getByText('완료 기한: 2026-07-03')).toBeVisible()
  await expect(page.getByText('공개 범위: 전체 공개')).toBeVisible()

  await expect(page.getByRole('heading', { name: '제목' })).toBeVisible()
  await expect(page.getByText('업무 제목', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /상세 업무 내용/ })).toBeVisible()
  await expect(page.getByText('상세 업무 내용이 입력되어있음')).toBeVisible()
  await expect(page.getByRole('group', { name: '첨부자료' })).toBeVisible()

  await expect(page.getByRole('button', { name: '반려하기' })).toBeVisible()
  await expect(page.getByRole('button', { name: '승인하기' })).toBeVisible()
})

test('S10: 첨부자료는 조회 전용', async ({ page }) => {
  await page.goto('/task-reports/r1')
  const attachments = page.getByRole('group', { name: '첨부자료' })

  await expect(
    attachments.getByRole('button', { name: '당일 지침.pdf 다운로드' }),
  ).toBeVisible()
  await expect(attachments.getByRole('button', { name: /삭제/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '파일 업로드' })).toHaveCount(0)
})

test('S11: 승인 처리', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await page.getByRole('button', { name: '승인하기' }).click()

  await expect(page).toHaveURL(/\/task-reports$/)
  await expect(
    page.getByRole('button', { name: '심사대기 6', exact: true }),
  ).toBeVisible()

  await page.getByRole('button', { name: '완료 4', exact: true }).click()
  await expect(rows(page).filter({ hasText: '2026-07-03' })).toHaveCount(1)
})

test('S12: 반려 처리', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await page.getByRole('button', { name: '반려하기' }).click()

  await expect(page).toHaveURL(/\/task-reports$/)
  await expect(
    page.getByRole('button', { name: '심사대기 6', exact: true }),
  ).toBeVisible()

  await page.getByRole('button', { name: '반려 3', exact: true }).click()
  await expect(rows(page).filter({ hasText: '2026-07-03' })).toHaveCount(1)
})

test('S13: 처리 중 중복 제출 차단', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await delayReportMutation(page)

  const approveButton = page.getByRole('button', { name: '승인하기' })
  await approveButton.click()

  // 처리 중에는 두 버튼이 비활성이라 사용자가 다시 눌러도 요청되지 않는다.
  await expect(approveButton).toBeDisabled()
  await expect(page.getByRole('button', { name: '반려하기' })).toBeDisabled()
  await approveButton.click({ force: true })

  await expect(page).toHaveURL(/\/task-reports$/)
  expect(await mutationCount(page)).toBe(1)
})

test('S14: 결과 없음 → 빈 상태', async ({ page }) => {
  await seedReviewedReports(page, allMockReportIds, 'APPROVED')
  await page.goto('/task-reports')

  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByText('등록된 업무보고가 없습니다.')).toBeVisible()
  await expect(page.getByRole('button', { name: '2 페이지' })).toHaveCount(0)
})

test('S15: 없는 보고 진입', async ({ page }) => {
  await page.goto('/task-reports/none')

  await expect(page.getByText('업무보고를 찾을 수 없습니다.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: '목록으로 돌아가기' }),
  ).toBeVisible()
})

test('S16: 업무 상세에서 그 업무의 업무보고 상세로 진입', async ({ page }) => {
  await page.goto('/tasks/1')
  await page.getByRole('button', { name: '업무 보고 상세조회' }).click()

  // 1번 업무의 보고는 r1 이다.
  await expect(page).toHaveURL(/\/task-reports\/r1$/)
  await expect(page.getByText('담당자: 이승현')).toBeVisible()
})

function rows(page: Page) {
  return page.getByTestId('task-report-row')
}

async function seedReviewedReports(
  page: Page,
  ids: string[],
  reviewStatus: string,
) {
  await page.addInitScript(
    ({ key, seededIds, status }) => {
      localStorage.setItem(
        key,
        JSON.stringify(
          Object.fromEntries(seededIds.map((id: string) => [id, status])),
        ),
      )
    },
    { key: reviewStorageKey, seededIds: ids, status: reviewStatus },
  )
}

async function delayReportMutation(page: Page, delay = 700) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, String(value)),
    { key: mutationDelayStorageKey, value: delay },
  )
}

async function mutationCount(page: Page) {
  return page.evaluate((key) => {
    const rawLog = localStorage.getItem(key)
    if (!rawLog) return 0

    const log: unknown = JSON.parse(rawLog)
    return Array.isArray(log) ? log.length : 0
  }, mutationLogStorageKey)
}
