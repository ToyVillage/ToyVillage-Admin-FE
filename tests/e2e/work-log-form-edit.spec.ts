import { expect, test, type Page } from '@playwright/test'

// 승인된 시나리오(work-log-form-edit.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.
// 퍼블리싱 슬라이스이므로 실제 API를 호출하지 않고 localStorage mock 만 사용한다.

const deletedWorkLogFormStorageKey = 'toyvillage:work-log-forms:deleted'
const editPath = '/work-logs/forms/wlf-1/edit'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    // clear() 는 인증 가드가 보는 세션 토큰까지 지운다. mock 상태만 비우고
    // 보호 경로에 들어갈 수 있도록 토큰을 다시 심는다.
    localStorage.setItem('accessToken', 'test-access-token')
  })
})

test('S1: 수정 화면 진입 기본 표시', async ({ page }) => {
  await page.goto('/work-logs?tab=forms')
  await page
    .getByTestId('work-log-form-row')
    .first()
    .getByRole('button', { name: /관리 메뉴$/ })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page).toHaveURL(new RegExp(`${editPath}$`))
  await expect(page.getByText('항목 설정')).toBeVisible()
  await expect(page.getByLabel('양식명')).toHaveValue('그냥 양식 제목')
  await expect(page.getByRole('button', { name: '다음' })).toBeVisible()
  await expect(page.getByRole('button', { name: '저장하기' })).toBeVisible()
})

test('S2: 저장된 질문 값이 그대로 보인다', async ({ page }) => {
  await page.goto(editPath)

  await expect(page.getByLabel('1번 항목 이름')).toHaveValue('습도')
  await expect(
    page.getByRole('button', { name: '1번 항목 유형' }),
  ).toContainText('객관식 질문')
  await expect(
    page.getByRole('textbox', { name: '1번 항목 1번 선택지', exact: true }),
  ).toHaveValue('30%')
  await expect(page.getByLabel('2번 항목 이름')).toHaveValue('청소여부')
  await expect(page.getByLabel('3번 항목 이름')).toHaveValue(
    '청소 방법이 뭔가요?',
  )
})

test('S3: 변경 없이 뒤로가기', async ({ page }) => {
  await page.goto(editPath)
  await expect(page.getByLabel('양식명')).toHaveValue('그냥 양식 제목')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
})

test('S4: 변경 후 뒤로가기 → 나가기 확인 모달', async ({ page }) => {
  await page.goto(editPath)
  await page.getByLabel('양식명').fill('조사')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page.getByText('정말 나가시겠습니까?')).toBeVisible()
  await expect(page.getByText('저장하지 않고 돌아갈 시')).toBeVisible()
})

test('S5: 나가기 취소', async ({ page }) => {
  await page.goto(editPath)
  await page.getByLabel('양식명').fill('조사')
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page).toHaveURL(new RegExp(`${editPath}$`))
  await expect(page.getByLabel('양식명')).toHaveValue('조사')
})

test('S6: 나가기 확인', async ({ page }) => {
  await page.goto(editPath)
  await page.getByLabel('양식명').fill('조사')
  await page.getByRole('link', { name: '뒤로가기' }).click()
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
})

test('S7: 1단계 저장 검증', async ({ page }) => {
  await page.goto(editPath)
  await page.getByLabel('양식명').fill('')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByText('양식명을 입력해주세요!')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${editPath}$`))
})

test('S17: 수정에서 항목 추가', async ({ page }) => {
  await page.goto(editPath)
  await expect(page.getByTestId('work-log-form-question')).toHaveCount(3)
  await page.getByRole('button', { name: '항목 추가하기' }).click()

  await expect(page.getByTestId('work-log-form-question')).toHaveCount(4)
})

test('S8: 1단계에서 2단계로 — 저장된 구역이 보인다', async ({ page }) => {
  await page.goto(editPath)
  await goToStepTwo(page)

  await expect(page.getByText('(3)')).toBeVisible()
  for (const label of ['A1', 'A2', 'A3']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible()
  }
})

test('S9: 저장된 구역 삭제는 확인 모달을 띄운다', async ({ page }) => {
  await page.goto(editPath)
  await goToStepTwo(page)
  await page.getByRole('button', { name: 'A1 구역 삭제' }).click()

  await expect(page.getByText('정말 삭제하시겠습니까?')).toBeVisible()
  await expect(page.getByText('삭제하신 뒤에는 영구삭제되며')).toBeVisible()
})

test('S10: 구역 삭제 취소와 확인', async ({ page }) => {
  await page.goto(editPath)
  await goToStepTwo(page)

  await page.getByRole('button', { name: 'A1 구역 삭제' }).click()
  await page.getByRole('button', { name: '취소' }).click()
  await expect(page.getByText('(3)')).toBeVisible()

  await page.getByRole('button', { name: 'A1 구역 삭제' }).click()
  await page.getByRole('button', { name: '확인' }).click()
  await expect(page.getByText('(2)')).toBeVisible()
})

test('S11: 새로 추가한 구역은 확인 없이 삭제된다', async ({ page }) => {
  await page.goto(editPath)
  await goToStepTwo(page)
  await page.getByLabel('구역 직접 추가').fill('B4')
  await page.getByRole('button', { name: '추가' }).click()
  await expect(page.getByText('(4)')).toBeVisible()

  await page.getByRole('button', { name: 'B4 구역 삭제' }).click()

  await expect(page.getByText('정말 삭제하시겠습니까?')).toBeHidden()
  await expect(page.getByText('(3)')).toBeVisible()
})

test('S12: 구역을 모두 지우고 저장하면 막힌다', async ({ page }) => {
  await page.goto(editPath)
  await goToStepTwo(page)
  await page.getByRole('button', { name: '전체 삭제' }).click()
  await page.getByRole('button', { name: '확인' }).click()
  await expect(page.getByText('(0)')).toBeVisible()

  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByText('구역 번호를 설정해주세요')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${editPath}/zones$`))
})

test('S13: 저장 성공', async ({ page }) => {
  await page.goto(editPath)
  await page.getByLabel('양식명').fill('조사')
  await goToStepTwo(page)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
  await expect(page.getByText('조사').first()).toBeVisible()
})

test('S15: 삭제된 양식으로 진입하면 목록으로 되돌린다', async ({ page }) => {
  await page.addInitScript(
    ([storageKey, id]) => {
      localStorage.setItem(storageKey, JSON.stringify([id]))
    },
    [deletedWorkLogFormStorageKey, 'wlf-1'] as const,
  )
  await page.goto(editPath)

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
})

test('S16: 키보드만으로 값을 고치고 단계를 옮긴다', async ({ page }) => {
  await page.goto(editPath)
  await expect(page.getByLabel('양식명')).toHaveValue('그냥 양식 제목')

  await page.getByLabel('양식명').focus()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('조사')
  await expect(page.getByLabel('양식명')).toHaveValue('조사')

  await page.getByRole('button', { name: '다음' }).click()
  await expect(
    page.getByRole('heading', { name: '구역 번호 설정' }),
  ).toBeVisible()

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page.getByLabel('양식명')).toHaveValue('조사')
})

test('S14: 저장 중에는 저장 버튼을 다시 누를 수 없다', async ({ page }) => {
  await page.goto(editPath)
  await goToStepTwo(page)

  const save = page.getByRole('button', { name: '저장하기' })
  await save.click()

  // 저장이 끝나면 목록으로 이동한다. 이동 전까지 중복 제출 경로가 열리지 않는다.
  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
})

test('S18: 수정도 브라우저 뒤로가기에서 나가기 확인이 뜬다', async ({
  page,
}) => {
  await page.goto('/work-logs?tab=forms')
  await page
    .getByTestId('work-log-form-row')
    .first()
    .getByRole('button', { name: /관리 메뉴$/ })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()
  await expect(page.getByLabel('양식명')).toHaveValue('그냥 양식 제목')

  await page.getByLabel('양식명').fill('조사')
  await page.goBack()

  await expect(page.getByText('정말 나가시겠습니까?')).toBeVisible()
})

test('S19: 저장한 질문 구성이 다시 들어와도 남아 있다', async ({ page }) => {
  await page.goto(editPath)
  await expect(page.getByLabel('1번 항목 이름')).toHaveValue('습도')

  await page.getByLabel('1번 항목 이름').fill('온도')
  await page.getByRole('button', { name: '3번 항목 삭제' }).click()
  await page.getByRole('button', { name: '다음' }).click()
  await expect(
    page.getByRole('heading', { name: '구역 번호 설정' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)

  // mock 은 페이지 수명 동안만 값을 들고 있으므로 새로고침 없이 다시 들어간다.
  await page
    .getByTestId('work-log-form-row')
    .first()
    .getByRole('button', { name: /관리 메뉴$/ })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()

  await expect(page.getByLabel('1번 항목 이름')).toHaveValue('온도')
  await expect(page.getByTestId('work-log-form-question')).toHaveCount(2)
})

async function goToStepTwo(page: Page) {
  await expect(page.getByLabel('1번 항목 이름')).toHaveValue('습도')
  await page.getByRole('button', { name: '다음' }).click()
  await expect(
    page.getByRole('heading', { name: '구역 번호 설정' }),
  ).toBeVisible()
}
