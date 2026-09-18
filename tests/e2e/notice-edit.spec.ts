import { test, expect } from '@playwright/test'
import { mockNoticeApi, noticeItemPattern } from './support/notice-api'
import { mockTeamList } from './support/team-api'

// 승인된 시나리오(notice-edit.approved.json: S1~S11)를 변환한 것.
// 승인 후에는 시나리오를 재도출하지 않고 실패 시 프로덕션 코드를 수정한다.
// 공지 API 는 page.route mock 을 쓴다. 실제 서버는 호출하지 않는다.

const editPath = '/notices/list/1/edit'

test.beforeEach(async ({ page }) => {
  await mockNoticeApi(page)
  await mockTeamList(page)
})

test('S1: 목록 케밥 수정 → 수정 URL 이동', async ({ page }) => {
  await page.goto('/notices/list')
  await page
    .getByRole('button', { name: '7월 13일 휴관안내 관리 메뉴' })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page).toHaveURL(/\/notices\/list\/1\/edit$/)
})

test('S2: 기존 제목·내용·첨부 복원', async ({ page }) => {
  await page.goto(editPath)

  await expect(page.getByLabel('제목')).toHaveValue('7월 13일 휴관안내')
  await expect(page.getByLabel('내용')).toContainText('그냥 더미 텍스트')
  await expect(page.getByRole('checkbox', { name: '전체' })).toBeChecked()
  await expect(page.getByRole('checkbox')).toHaveCount(3)
  await expect(page.getByRole('button', { name: '팀 추가' })).toHaveCount(0)
  await expect(page.getByText('당일 지침.pdf')).toBeVisible()
  await expect(page.getByText('휴관안내.png')).toBeVisible()
  await expect(page.getByText('휴관안내.jpg')).toBeVisible()
})

test('S3: 수정 저장 → 목록에 같은 ID 수정값 반영', async ({ page }) => {
  await page.goto(editPath)
  await page.getByLabel('제목').fill('수정된 휴관 안내')
  await page.getByLabel('내용').fill('수정된 공지 내용입니다.')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/notices\/list$/)
  await expect(page.getByText('수정된 휴관 안내', { exact: true })).toHaveCount(
    1,
  )
})

test('S4: 빈 제목 → 오류 확인 후 제목 포커스', async ({ page }) => {
  await page.goto(editPath)
  const title = page.getByLabel('제목')
  await title.fill('   ')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(
    page.getByRole('alertdialog', { name: '제목을 입력해 주세요' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '확인' }).click()
  await expect(title).toBeFocused()
})

test('S5: 빈 내용 → 오류 확인 후 내용 포커스', async ({ page }) => {
  await page.goto(editPath)
  const content = page.getByLabel('내용')
  await content.fill('   ')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(
    page.getByRole('alertdialog', { name: '내용을 입력해 주세요' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '확인' }).click()
  await expect(content).toBeFocused()
})

test('S6: 기존 첨부 제거와 새 파일 추가', async ({ page }) => {
  await page.goto(editPath)
  const removeButton = page.getByRole('button', {
    name: '당일 지침.pdf 삭제',
  })
  await removeButton.focus()
  await removeButton.press('Enter')
  await expect(page.getByText('당일 지침.pdf')).toHaveCount(0)

  await page.getByLabel('첨부파일 선택').setInputFiles({
    name: '새 안내.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('notice'),
  })
  await expect(page.getByText('새 안내.pdf')).toBeVisible()
})

test('S7: 삭제 버튼 없음·상세 업무 내용 라벨', async ({ page }) => {
  await page.goto(editPath)
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
  await expect(page.getByRole('button', { name: '삭제하기' })).toHaveCount(0)
  await expect(page.getByText('상세 업무 내용')).toBeVisible()
})

test('S8: 존재하지 않는 공지 → 복구 UI', async ({ page }) => {
  await page.goto('/notices/list/999/edit')
  await expect(
    page.getByRole('heading', { name: '공지사항을 찾을 수 없습니다.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: '공지사항 목록으로 돌아가기' }),
  ).toHaveAttribute('href', '/notices/list')
})

test('S9: 수정 중 사이드바 이동 → 이탈 확인', async ({ page }) => {
  await page.goto(editPath)
  await page.getByLabel('제목').fill('저장 전 제목')
  await page.getByRole('button', { name: '사이드바 열기' }).click()
  // `/notices/list/*` 는 `공지사항` 대분류라 사이드바를 열면 이미 펼쳐져 있다.
  await page.getByRole('link', { name: '자료실', exact: true }).click()

  await expect(
    page.getByRole('alertdialog', { name: '정말 나가시겠습니까?' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/notices\/list\/1\/edit$/)
})

test('S10: 저장 더블클릭 → 수정 요청 한 번', async ({ page }) => {
  let putCount = 0
  page.on('request', (request) => {
    if (request.method() === 'PUT' && noticeItemPattern.test(request.url())) {
      putCount += 1
    }
  })

  await page.goto(editPath)
  await page.getByLabel('제목').fill('중복 없는 수정')
  await page.getByRole('button', { name: '저장하기' }).dblclick()
  await expect(page).toHaveURL(/\/notices\/list$/)
  expect(putCount).toBe(1)
})

test('S11: 키보드로 편집·검증·저장', async ({ page }) => {
  await page.goto(editPath)
  const title = page.getByLabel('제목')
  await title.focus()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.press('Delete')
  await page.getByRole('button', { name: '저장하기' }).focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('alertdialog', { name: '제목을 입력해 주세요' }),
  ).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(title).toBeFocused()

  await page.keyboard.type('키보드 수정 공지')
  await page.getByRole('button', { name: '저장하기' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/notices\/list$/)
  await expect(
    page.getByText('키보드 수정 공지', { exact: true }),
  ).toBeVisible()
})

test('수정에서 팀 목록에 없는 기존 분류도 선택 상태로 표시한다', async ({
  page,
}) => {
  await page.goto('/notices/list/2/edit')

  await expect(page.getByRole('checkbox', { name: '팀 이름1' })).toBeChecked()
  await expect(page.getByRole('checkbox')).toHaveCount(4)

  await page.getByRole('checkbox', { name: '창고팀' }).check()
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page).toHaveURL(/\/notices\/list$/)
})
