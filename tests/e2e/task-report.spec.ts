import { expect, test as base, type Page } from '@playwright/test'
import { mockTaskApi } from './support/task-api'

// 승인된 시나리오(task-report.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 localStorage mock 만 사용한다.

const reviewStorageKey = 'toyvillage:task-reports:reviews'
const mutationDelayStorageKey = 'toyvillage:task-reports:mutation-delay'
const mutationLogStorageKey = 'toyvillage:task-reports:mutation-log'
const rejectReasonStorageKey = 'toyvillage:task-reports:reject-reasons'
const failStorageKey = 'toyvillage:task-reports:fail'
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
]

type StorageSeed = Record<string, string>

// localStorage 초기화와 시드는 하나의 init script 안에서 순서대로 실행한다.
// addInitScript 를 두 번 등록하면 실행 순서가 보장되지 않아,
// clear 가 시드보다 나중에 실행되면 시드가 지워진다.
const test = base.extend<{ storageSeed: StorageSeed }>({
  storageSeed: [{}, { option: true }],
  // 두 번째 인자 이름은 react-hooks 린트 규칙과 겹치지 않도록 runTest 로 둔다.
  page: async ({ page, storageSeed }, runTest) => {
    await page.addInitScript((seed: StorageSeed) => {
      localStorage.clear()
      // clear() 는 인증 가드가 보는 세션 토큰까지 지운다. mock 상태만 비우고
      // 보호 경로에 들어갈 수 있도록 토큰을 다시 심는다.
      localStorage.setItem('accessToken', 'test-access-token')
      for (const [key, value] of Object.entries(seed)) {
        localStorage.setItem(key, value)
      }
    }, storageSeed)

    await runTest(page)
  },
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

  for (const header of ['담당자', '상태', '우선순위', '완료기한']) {
    await expect(page.getByText(header, { exact: true }).first()).toBeVisible()
  }
  await expect(page.getByText('제목', { exact: true })).toHaveCount(0)
  await expect(page.getByText('공개범위', { exact: true })).toHaveCount(0)
})

test('S3: 탭 라벨에 건수 표시', async ({ page }) => {
  await page.goto('/task-reports')

  for (const label of ['심사대기 7', '완료 3', '반려 2']) {
    await expect(
      page.getByRole('button', { name: label, exact: true }),
    ).toBeVisible()
  }
  await expect(page.getByRole('button', { name: /재제출/ })).toHaveCount(0)
})

test('S4: 완료 탭 필터', async ({ page }) => {
  await page.goto('/task-reports')
  const tab = page.getByRole('button', { name: '완료 3', exact: true })
  await tab.click()

  await expect(tab).toHaveAttribute('aria-pressed', 'true')
  await expect(rows(page)).toHaveCount(3)
  await expect(rows(page).first()).toContainText('2027-01-08')
  await expect(rows(page).filter({ hasText: '심사대기' })).toHaveCount(0)
})

test('S25: 표 상태 칸은 심사 상태 배지', async ({ page }) => {
  await page.goto('/task-reports')

  await expect(rows(page)).toHaveCount(3)
  await expect(rows(page).filter({ hasText: '심사대기' })).toHaveCount(3)

  await page.getByRole('button', { name: '반려 2', exact: true }).click()
  await expect(rows(page)).toHaveCount(2)
  await expect(rows(page).filter({ hasText: '반려' })).toHaveCount(2)
})

test('S6: 페이지네이션 이동', async ({ page }) => {
  await page.goto('/task-reports')
  await page.getByRole('button', { name: '2 페이지' }).click()

  await expect(rows(page)).toHaveCount(3)
  await expect(rows(page).first()).toContainText('2026-12-05')
})

test('S7: 탭 전환 시 첫 페이지로 복귀', async ({ page }) => {
  await page.goto('/task-reports')
  await page.getByRole('button', { name: '2 페이지' }).click()
  await expect(rows(page).first()).toContainText('2026-12-05')

  await page.getByRole('button', { name: '완료 3', exact: true }).click()

  await expect(rows(page)).toHaveCount(3)
  await expect(rows(page).first()).toContainText('2027-01-08')
})

test('S8: 행 클릭 → 상세 이동', async ({ page }) => {
  await page.goto('/task-reports')
  await rows(page).first().click()

  await expect(page).toHaveURL(/\/task-reports\/r1$/)
})

test('S26: 행 케밥 메뉴 열기', async ({ page }) => {
  await page.goto('/task-reports')
  await rowMenuTrigger(page).click()

  await expect(page.getByRole('menuitem', { name: '승인하기' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: '반려하기' })).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports$/)
})

test('S27: 목록에서 승인', async ({ page }) => {
  await page.goto('/task-reports')
  await rowMenuTrigger(page).click()
  await page.getByRole('menuitem', { name: '승인하기' }).click()

  await expect(page.getByText('승인에 성공했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports$/)
  await expect(
    page.getByRole('button', { name: '심사대기 6', exact: true }),
  ).toBeVisible()
  await expect(rows(page).filter({ hasText: '2026-07-03' })).toHaveCount(0)

  await page.getByRole('button', { name: '완료 4', exact: true }).click()
  await expect(rows(page).filter({ hasText: '2026-07-03' })).toHaveCount(1)
})

test('S28: 목록에서 반려', async ({ page }) => {
  await page.goto('/task-reports')
  await rowMenuTrigger(page).click()
  await page.getByRole('menuitem', { name: '반려하기' }).click()
  await page.getByRole('textbox', { name: '반려 사유' }).fill('점검 항목 누락')
  await rejectDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(rejectDialog(page)).toBeHidden()
  await expect(page.getByText('반려에 성공했습니다')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '심사대기 6', exact: true }),
  ).toBeVisible()

  await page.getByRole('button', { name: '반려 3', exact: true }).click()
  await expect(rows(page).filter({ hasText: '2026-07-03' })).toHaveCount(1)
})

test('S9: 상세 표시 내용', async ({ page }) => {
  await page.goto('/task-reports/r1')

  await expect(page.getByText('우선순위:')).toBeVisible()
  await expect(page.getByText('상태:')).toBeVisible()
  await expect(page.getByText('담당자: 이승현')).toBeVisible()
  await expect(page.getByText('완료 기한: 2026-07-03')).toBeVisible()
  await expect(page.getByText(/공개 범위/)).toHaveCount(0)

  // 제목·상세 업무 내용·첨부자료가 한 카드 안에 있다.
  const contentCard = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: '제목' }) })
    .filter({ has: page.getByRole('group', { name: '첨부자료' }) })
  await expect(contentCard).toHaveCount(1)
  await expect(
    contentCard.getByRole('heading', { name: /상세 업무 내용/ }),
  ).toBeVisible()
  await expect(contentCard.getByText('업무 제목', { exact: true })).toBeVisible()
  await expect(
    contentCard.getByText('상세 업무 내용이 입력되어있음'),
  ).toBeVisible()

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

test('S11: 상세에서 승인', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await page.getByRole('button', { name: '승인하기' }).click()

  await expect(page).toHaveURL(/\/task-reports$/)
  await expect(page.getByText('승인에 성공했습니다')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '심사대기 6', exact: true }),
  ).toBeVisible()

  await page.getByRole('button', { name: '완료 4', exact: true }).click()
  await expect(rows(page).filter({ hasText: '2026-07-03' })).toHaveCount(1)
})

test('S12: 상세에서 반려', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await page.getByRole('button', { name: '반려하기' }).click()
  await page.getByRole('textbox', { name: '반려 사유' }).fill('점검 항목 누락')
  await rejectDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/task-reports$/)
  await expect(page.getByText('반려에 성공했습니다')).toBeVisible()
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

test.describe('결과 없음', () => {
  test.use({ storageSeed: reviewedReportsSeed(allMockReportIds, 'APPROVED') })

  test('S14: 결과 없음 → 빈 상태', async ({ page }) => {
    await page.goto('/task-reports')

    await expect(rows(page)).toHaveCount(0)
    await expect(page.getByText('등록된 업무보고가 없습니다.')).toBeVisible()
    await expect(page.getByRole('button', { name: '2 페이지' })).toHaveCount(0)
  })
})

test('S15: 없는 보고 진입', async ({ page }) => {
  await page.goto('/task-reports/none')

  await expect(page.getByText('업무보고를 찾을 수 없습니다.')).toBeVisible()
  await expect(
    page.getByRole('link', { name: '목록으로 돌아가기' }),
  ).toBeVisible()
})

test('S16: 업무 상세의 보고 줄은 연동 전까지 진입 보류', async ({ page }) => {
  // 업무 상세의 담당자별 보고 현황은 상세 조회 응답(`reports`)에서 온다.
  await mockTaskApi(page)
  await page.goto('/tasks/1')

  // 진입은 막아 뒀다. 실 API 의 `workReportId`(숫자)로는 아직 localStorage mock 을 읽는
  // 업무보고 상세를 열 수 없어 항상 `찾을 수 없습니다` 였다. 줄은 그대로 보이되 버튼이 아니다.
  await expect(page.getByTestId('task-report-row').first()).toBeVisible()
  await expect(
    page
      .locator('section')
      .filter({ hasText: '업무 보고' })
      .getByRole('button'),
  ).toHaveCount(0)
  await expect(page).toHaveURL(/\/tasks\/1$/)
  // 업무보고 API 가 붙으면 여기서 보고 내용을 확인하도록 되돌린다.
})

test('S17: 사이드바 업무보고 메뉴 이동', async ({ page }) => {
  await page.goto('/notices/list')
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  await page.getByRole('link', { name: '업무 보고 바로가기' }).click()

  await expect(page).toHaveURL(/\/task-reports$/)
  await expect(page.getByRole('heading', { name: '업무보고' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '사이드바' })).toBeHidden()
})

test('S18: 상세에서 뒤로가기', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/task-reports$/)
  // 심사대기 건수가 그대로면 승인·반려 처리가 일어나지 않은 것이다.
  await expect(
    page.getByRole('button', { name: '심사대기 7', exact: true }),
  ).toBeVisible()
  expect(await mutationCount(page)).toBe(0)
})

test('S19: 반려하기 → 반려 사유 모달 표시', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await page.getByRole('button', { name: '반려하기' }).click()

  const dialog = rejectDialog(page)
  await expect(
    dialog.getByRole('heading', { name: '반려 사유를 작성해주세요' }),
  ).toBeVisible()
  await expect(
    dialog.getByPlaceholder('반려 사유 작성'),
  ).toBeVisible()
  await expect(dialog.getByRole('button', { name: '확인' })).toBeVisible()

  // 모달만 열릴 뿐 화면은 상세에 머무르고 반려 요청은 아직 없다.
  await expect(page).toHaveURL(/\/task-reports\/r1$/)
  expect(await mutationCount(page)).toBe(0)
})

test('S20: 사유 미입력 시 확인 불가', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await page.getByRole('button', { name: '반려하기' }).click()

  const confirmButton = rejectDialog(page).getByRole('button', { name: '확인' })
  await expect(confirmButton).toBeDisabled()

  await page.getByRole('textbox', { name: '반려 사유' }).fill('   ')
  await expect(confirmButton).toBeDisabled()
})

test('S21: 모달 이탈 시 반려되지 않음', async ({ page }) => {
  await page.goto('/task-reports/r1')

  await page.getByRole('button', { name: '반려하기' }).click()
  await page.keyboard.press('Escape')
  await expect(rejectDialog(page)).toBeHidden()

  // Figma 에 취소 버튼이 없어 오버레이 클릭도 같은 이탈 수단이다.
  await page.getByRole('button', { name: '반려하기' }).click()
  await page.mouse.click(10, 10)
  await expect(rejectDialog(page)).toBeHidden()

  await expect(page).toHaveURL(/\/task-reports\/r1$/)
  expect(await mutationCount(page)).toBe(0)
})

test('S29: 목록 반려 모달 이탈 시 반려되지 않음', async ({ page }) => {
  await page.goto('/task-reports')
  const trigger = rowMenuTrigger(page)
  await trigger.click()
  await page.getByRole('menuitem', { name: '반려하기' }).click()
  await expect(rejectDialog(page)).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(rejectDialog(page)).toBeHidden()
  await expect(page).toHaveURL(/\/task-reports$/)
  expect(await mutationCount(page)).toBe(0)
  await expect(trigger).toBeFocused()
})

test('S22: 입력한 반려 사유 저장', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await page.getByRole('button', { name: '반려하기' }).click()
  await page
    .getByRole('textbox', { name: '반려 사유' })
    .fill('첨부 자료가 누락되었습니다')
  await rejectDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/task-reports$/)
  expect(await storedRejectReasons(page)).toEqual({
    r1: '첨부 자료가 누락되었습니다',
  })
})

test('S23: 모달 처리 중 중복 확인 차단', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await delayReportMutation(page)

  await page.getByRole('button', { name: '반려하기' }).click()
  await page.getByRole('textbox', { name: '반려 사유' }).fill('사유 입력')

  const confirmButton = rejectDialog(page).getByRole('button', { name: '확인' })
  await confirmButton.click()

  await expect(confirmButton).toBeDisabled()
  await confirmButton.click({ force: true })

  await expect(page).toHaveURL(/\/task-reports$/)
  expect(await mutationCount(page)).toBe(1)
})

test('S24: 모달 처리 중 초점 유지', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await delayReportMutation(page)

  await page.getByRole('button', { name: '반려하기' }).click()
  const reasonField = page.getByRole('textbox', { name: '반려 사유' })
  await reasonField.fill('사유 입력')
  await rejectDialog(page).getByRole('button', { name: '확인' }).click()

  // 처리 중 `확인` 이 비활성이 되어도 초점은 모달 안에 남아야 한다.
  await expect(rejectDialog(page)).toHaveAttribute('aria-busy', 'true')
  await expect(reasonField).toBeFocused()

  // 초점 트랩이 유지되므로 Tab 을 눌러도 모달 밖으로 나가지 않는다.
  await page.keyboard.press('Tab')
  await expect(reasonField).toBeFocused()

  await expect(page).toHaveURL(/\/task-reports$/)
})

test('S30: 목록 승인 실패', async ({ page }) => {
  await page.goto('/task-reports')
  await injectReviewFailure(page, 'approve')

  await rowMenuTrigger(page).click()
  await page.getByRole('menuitem', { name: '승인하기' }).click()

  await expect(page.getByText('승인에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports$/)
  await expect(
    page.getByRole('button', { name: '심사대기 7', exact: true }),
  ).toBeVisible()
  await expect(rows(page).filter({ hasText: '2026-07-03' })).toHaveCount(1)
})

test('S31: 목록 반려 실패', async ({ page }) => {
  await page.goto('/task-reports')
  await injectReviewFailure(page, 'reject')

  await rowMenuTrigger(page).click()
  await page.getByRole('menuitem', { name: '반려하기' }).click()
  await page.getByRole('textbox', { name: '반려 사유' }).fill('점검 항목 누락')
  await rejectDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(rejectDialog(page)).toBeHidden()
  await expect(page.getByText('반려에 실패했습니다')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '심사대기 7', exact: true }),
  ).toBeVisible()
  await expect(rows(page).filter({ hasText: '2026-07-03' })).toHaveCount(1)
})

test('S32: 상세 승인 실패', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await injectReviewFailure(page, 'approve')

  await page.getByRole('button', { name: '승인하기' }).click()

  await expect(page.getByText('승인에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports\/r1$/)
  await expect(page.getByRole('button', { name: '승인하기' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '반려하기' })).toBeEnabled()
})

test('S33: 상세 반려 실패', async ({ page }) => {
  await page.goto('/task-reports/r1')
  await injectReviewFailure(page, 'reject')

  await page.getByRole('button', { name: '반려하기' }).click()
  await page.getByRole('textbox', { name: '반려 사유' }).fill('점검 항목 누락')
  await rejectDialog(page).getByRole('button', { name: '확인' }).click()

  await expect(rejectDialog(page)).toBeHidden()
  await expect(page.getByText('반려에 실패했습니다')).toBeVisible()
  await expect(page).toHaveURL(/\/task-reports\/r1$/)
  await expect(page.getByRole('button', { name: '승인하기' })).toBeEnabled()
  await expect(page.getByRole('button', { name: '반려하기' })).toBeEnabled()
})

function rejectDialog(page: Page) {
  return page.getByRole('dialog', { name: '반려 사유를 작성해주세요' })
}

// 1페이지 첫 행(r1 · 이승현 · 2026-07-03)의 `⋮` 버튼.
function rowMenuTrigger(page: Page) {
  return rows(page).first().getByRole('button', { name: /메뉴 열기/ })
}

async function storedRejectReasons(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{}') as unknown,
    rejectReasonStorageKey,
  )
}

function rows(page: Page) {
  return page.getByTestId('task-report-row')
}

function reviewedReportsSeed(ids: string[], reviewStatus: string): StorageSeed {
  return {
    [reviewStorageKey]: JSON.stringify(
      Object.fromEntries(ids.map((id) => [id, reviewStatus])),
    ),
  }
}

async function delayReportMutation(page: Page, delay = 700) {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, String(value)),
    { key: mutationDelayStorageKey, value: delay },
  )
}

async function injectReviewFailure(page: Page, action: 'approve' | 'reject') {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: failStorageKey, value: action },
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
