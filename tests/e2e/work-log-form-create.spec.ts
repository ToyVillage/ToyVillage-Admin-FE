import { expect, test as base, type Page } from '@playwright/test'

// 승인된 시나리오(work-log-form-create.approved.json)를 변환한 것.
// AI는 이 파일을 재도출하지 않는다(동결). 실패 시 코드를 수정한다.

const createPath = '/work-logs/forms/create'

import { mockWorkLogApi, type WorkLogApiHandle } from './support/work-log-api'

// 업무일지 API 연동 이후 localStorage mock 대신 `support/work-log-api` 의
// page.route mock 을 쓴다. 실제 서버는 호출하지 않는다.
const test = base.extend<{ workLogApi: WorkLogApiHandle }>({
  workLogApi: [
    async ({ page }, runTest) => {
      await runTest(await mockWorkLogApi(page))
    },
    { auto: true },
  ],
})

test('S1: 생성 화면 진입 기본 표시', async ({ page }) => {
  await page.goto('/work-logs?tab=forms')
  await page.getByRole('link', { name: '양식 생성하기' }).click()

  await expect(page).toHaveURL(new RegExp(`${createPath}$`))
  await expect(page.getByRole('link', { name: '뒤로가기' })).toBeVisible()
  await expect(page.getByText('1단계')).toBeVisible()
  await expect(page.getByText('항목 설정')).toBeVisible()
  await expect(page.getByLabel('양식명')).toBeVisible()
  await expect(page.getByTestId('work-log-form-question')).toHaveCount(2)
  await expect(
    page.getByRole('button', { name: '항목 추가하기' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '다음' })).toBeVisible()
})

test('S2: 항목 추가', async ({ page }) => {
  await page.goto(createPath)
  await page.getByRole('button', { name: '항목 추가하기' }).click()

  await expect(page.getByTestId('work-log-form-question')).toHaveCount(3)
  await expect(page.getByLabel('3번 항목 이름')).toBeFocused()
})

test('S3: 항목 삭제', async ({ page }) => {
  await page.goto(createPath)
  await page.getByRole('button', { name: '2번 항목 삭제' }).click()

  await expect(page.getByTestId('work-log-form-question')).toHaveCount(1)
})

test('S4: 유형 드롭다운 항목', async ({ page }) => {
  await page.goto(createPath)
  await page.getByRole('button', { name: '1번 항목 유형' }).click()

  const list = page.getByRole('listbox', { name: '1번 항목 유형' })
  await expect(list.getByRole('option')).toHaveCount(4)
  for (const label of ['주관식', '객관식 질문', '체크박스', '파일 업로드']) {
    await expect(list.getByRole('option', { name: label })).toBeVisible()
  }
})

test('S26: 파일 업로드 유형의 답변 영역', async ({ page }) => {
  await page.goto(createPath)
  await selectType(page, 1, '파일 업로드')

  const card = questionCard(page, 1)
  await expect(
    card.getByText('클릭하거나 파일을 끌어다 놓으세요'),
  ).toBeVisible()
  await expect(
    card.getByText('JPG · PNG · PDF · 최대 10MB · 최대 5개'),
  ).toBeVisible()
})

test('S5: 유형 선택', async ({ page }) => {
  await page.goto(createPath)
  await selectType(page, 1, '객관식 질문')

  const card = questionCard(page, 1)
  await expect(
    page.getByRole('button', { name: '1번 항목 유형' }),
  ).toContainText('객관식 질문')
  await expect(card.getByRole('button', { name: '옵션 추가' })).toBeVisible()
})

test('S27: 객관식·체크박스는 빈 선택지 하나로 시작한다', async ({ page }) => {
  await page.goto(createPath)

  await selectType(page, 1, '객관식 질문')
  await expect(optionInput(page, 1, 1)).toBeVisible()

  await selectType(page, 2, '체크박스')
  await expect(optionInput(page, 2, 1)).toBeVisible()
})

test('S6: 선택지 추가', async ({ page }) => {
  await page.goto(createPath)
  await selectType(page, 1, '객관식 질문')
  await questionCard(page, 1).getByRole('button', { name: '옵션 추가' }).click()

  await expect(optionInput(page, 1, 2)).toBeVisible()
  await expect(
    questionCard(page, 1).getByRole('button', { name: '기타 추가' }),
  ).toBeVisible()
})

test('S28: 새로 추가한 선택지에 바로 입력할 수 있다', async ({ page }) => {
  await page.goto(createPath)
  await selectType(page, 1, '객관식 질문')
  await questionCard(page, 1).getByRole('button', { name: '옵션 추가' }).click()

  await expect(optionInput(page, 1, 2)).toBeFocused()
  await page.keyboard.type('30%')
  await expect(optionInput(page, 1, 2)).toHaveValue('30%')
})

test('S7: 기타 추가', async ({ page }) => {
  await page.goto(createPath)
  await selectType(page, 1, '객관식 질문')
  const card = questionCard(page, 1)
  await card.getByRole('button', { name: '기타 추가' }).click()

  await expect(card.getByText('기타:')).toBeVisible()
  await expect(card.getByRole('button', { name: '기타 추가' })).toBeHidden()
})

test('S29: 기타 행에는 입력란이 없다', async ({ page }) => {
  await page.goto(createPath)
  await selectType(page, 1, '객관식 질문')
  const card = questionCard(page, 1)
  await card.getByRole('button', { name: '기타 추가' }).click()

  // 선택지 입력은 일반 선택지 1개뿐이다. 기타 행은 응답자가 적을 자리만 보여준다.
  await expect(card.getByRole('textbox', { name: /선택지$/ })).toHaveCount(1)
})

test('S30: 기타는 항상 선택지보다 아래에 있다', async ({ page }) => {
  await page.goto(createPath)
  await selectType(page, 1, '객관식 질문')
  const card = questionCard(page, 1)
  await card.getByRole('button', { name: '기타 추가' }).click()
  await card.getByRole('button', { name: '옵션 추가' }).click()

  const etcBox = await card.getByText('기타:').boundingBox()
  const lastOptionBox = await optionInput(page, 1, 2).boundingBox()
  expect(lastOptionBox!.y).toBeLessThan(etcBox!.y)
})

test('S8: 선택지 삭제', async ({ page }) => {
  await page.goto(createPath)
  await selectType(page, 1, '객관식 질문')
  const card = questionCard(page, 1)
  await card.getByRole('button', { name: '옵션 추가' }).click()
  await expect(optionInput(page, 1, 2)).toBeVisible()

  await page.getByRole('button', { name: '1번 항목 1번 선택지 삭제' }).click()

  await expect(optionInput(page, 1, 2)).toBeHidden()
  await expect(optionInput(page, 1, 1)).toBeVisible()
})

test('S9: 양식명 미입력 검증', async ({ page }) => {
  await page.goto(createPath)
  await page.getByRole('button', { name: '다음' }).click()

  await expect(page.getByText('양식명을 입력해주세요!')).toBeVisible()
  await expect(page.getByText('구역 번호 설정', { exact: true })).toHaveCount(1)
})

test('S10: 질문명 미입력 검증', async ({ page }) => {
  await page.goto(createPath)
  await page.getByLabel('양식명').fill('조사')
  await page.getByRole('button', { name: '다음' }).click()

  await expect(page.getByText('해당 항목을 입력해주세요!')).toHaveCount(2)
})

test('S11: 2단계 진입', async ({ page }) => {
  await page.goto(createPath)
  await fillStepOne(page)
  await page.getByRole('button', { name: '다음' }).click()

  await expect(
    page.getByRole('heading', { name: '구역 번호 설정' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: '생성하기' })).toBeVisible()
  await expect(page.getByLabel('구역 직접 추가')).toBeVisible()
})

test('S12: 2단계에서 1단계로 복귀', async ({ page }) => {
  await page.goto(createPath)
  await fillStepOne(page)
  await page.getByRole('button', { name: '다음' }).click()
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(new RegExp(`${createPath}$`))
  await expect(page.getByLabel('양식명')).toHaveValue('조사')
  await expect(page.getByLabel('1번 항목 이름')).toHaveValue('습도')
})

test('S31: 단계가 URL 로 바뀐다', async ({ page }) => {
  await page.goto(createPath)
  await fillStepOne(page)
  await page.getByRole('button', { name: '다음' }).click()

  await expect(page).toHaveURL(new RegExp(`${createPath}/zones$`))

  // 브라우저 뒤로가기로 1단계에 돌아와도 입력값이 남아 있다.
  await page.goBack()
  await expect(page).toHaveURL(new RegExp(`${createPath}$`))
  await expect(page.getByLabel('양식명')).toHaveValue('조사')
})

test('S32: 항목이 하나도 없으면 다음으로 넘어가지 않는다', async ({ page }) => {
  await page.goto(createPath)
  await page.getByLabel('양식명').fill('조사')
  await page.getByRole('button', { name: '2번 항목 삭제' }).click()
  await page.getByRole('button', { name: '1번 항목 삭제' }).click()
  await expect(page.getByTestId('work-log-form-question')).toHaveCount(0)

  await page.getByRole('button', { name: '다음' }).click()

  await expect(page.getByText('해당 항목을 입력해주세요!')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${createPath}$`))
})

test('S33: 자동 생성 번호는 숫자만 입력된다', async ({ page }) => {
  await page.goto(createPath)
  await goToStepTwo(page)

  await page.getByLabel('시작 번호').fill('1a2-b')
  await page.getByLabel('끝 번호').fill('3c')

  await expect(page.getByLabel('시작 번호')).toHaveValue('12')
  await expect(page.getByLabel('끝 번호')).toHaveValue('3')
})

test('S34: 브라우저 뒤로가기에도 나가기 확인이 뜬다', async ({ page }) => {
  await page.goto('/work-logs?tab=forms')
  await page.getByRole('link', { name: '양식 생성하기' }).click()
  await page.getByLabel('양식명').fill('조사')

  await page.goBack()

  await expect(page.getByText('정말 나가시겠습니까?')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${createPath}$`))

  await page.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
})

test('S35: 1단계 없이 2단계 URL 로 들어오면 1단계로 되돌린다', async ({
  page,
}) => {
  await page.goto(`${createPath}/zones`)

  await expect(page).toHaveURL(new RegExp(`${createPath}$`))
  await expect(page.getByLabel('양식명')).toBeVisible()
})

test('S36: 자동 생성 범위가 너무 크면 아무것도 만들지 않는다', async ({
  page,
}) => {
  await page.goto(createPath)
  await goToStepTwo(page)

  // 상한이 없으면 루프가 끝나지 않아 화면이 멈춘다.
  await autoCreateZones(page, 'A', '1', '99999999999')

  await expect(page.getByText('(0)')).toBeVisible()
})

test('S13: 구역 자동 생성', async ({ page }) => {
  await page.goto(createPath)
  await goToStepTwo(page)
  await autoCreateZones(page, 'A', '1', '3')

  await expect(page.getByText('(3)')).toBeVisible()
  for (const label of ['A1', 'A2', 'A3']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible()
  }
})

test('S14: 구역 직접 추가', async ({ page }) => {
  await page.goto(createPath)
  await goToStepTwo(page)
  await page.getByLabel('구역 직접 추가').fill('기타')
  await page.getByRole('button', { name: '추가' }).click()

  await expect(page.getByText('기타', { exact: true })).toBeVisible()
  await expect(page.getByLabel('구역 직접 추가')).toHaveValue('')
  await expect(page.getByText('(1)')).toBeVisible()
})

test('S15: 중복 구역 추가 차단', async ({ page }) => {
  await page.goto(createPath)
  await goToStepTwo(page)
  await autoCreateZones(page, 'A', '1', '1')
  await page.getByLabel('구역 직접 추가').fill('A1')
  await page.getByRole('button', { name: '추가' }).click()

  await expect(page.getByText('(1)')).toBeVisible()
})

test('S16: 구역 개별 삭제', async ({ page }) => {
  await page.goto(createPath)
  await goToStepTwo(page)
  await autoCreateZones(page, 'A', '1', '3')
  await page.getByRole('button', { name: 'A1 구역 삭제' }).click()

  await expect(page.getByText('(2)')).toBeVisible()
  await expect(page.getByText('A1', { exact: true })).toBeHidden()
})

test('S17: 구역 전체 삭제', async ({ page }) => {
  await page.goto(createPath)
  await goToStepTwo(page)
  await autoCreateZones(page, 'A', '1', '3')
  await page.getByRole('button', { name: '전체 삭제' }).click()
  await expect(page.getByText('정말 삭제하시겠습니까?')).toBeVisible()
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page.getByText('(0)')).toBeVisible()
})

test('S24: 전체 삭제 취소', async ({ page }) => {
  await page.goto(createPath)
  await goToStepTwo(page)
  await autoCreateZones(page, 'A', '1', '3')
  await page.getByRole('button', { name: '전체 삭제' }).click()
  await page.getByRole('button', { name: '취소' }).click()

  await expect(page.getByText('(3)')).toBeVisible()
})

test('S18: 구역 미설정 검증', async ({ page }) => {
  await page.goto(createPath)
  await goToStepTwo(page)
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page.getByText('구역 번호를 설정해주세요')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${createPath}/zones$`))
})

test('S19: 생성 성공', async ({ page }) => {
  await page.goto(createPath)
  await goToStepTwo(page)
  await autoCreateZones(page, 'A', '1', '2')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
})

test('S20: 입력이 없으면 뒤로가기는 바로 이동한다', async ({ page }) => {
  await page.goto(createPath)
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
})

test('S25: 입력 후 뒤로가기는 나가기 확인을 띄운다', async ({ page }) => {
  await page.goto(createPath)
  await page.getByLabel('양식명').fill('조사')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page.getByText('정말 나가시겠습니까?')).toBeVisible()
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)
})

test('S22: 잘못된 자동 생성 범위는 아무것도 만들지 않는다', async ({
  page,
}) => {
  await page.goto(createPath)
  await goToStepTwo(page)
  await autoCreateZones(page, 'A', '5', '3')

  await expect(page.getByText('(0)')).toBeVisible()
})

test('S23: 유형을 바꾸면 선택지가 정리된다', async ({ page }) => {
  await page.goto(createPath)
  await selectType(page, 1, '객관식 질문')
  const card = questionCard(page, 1)
  await card.getByRole('button', { name: '옵션 추가' }).click()
  await page
    .getByRole('textbox', { name: '1번 항목 1번 선택지', exact: true })
    .fill('30%')

  await selectType(page, 1, '주관식')

  await expect(
    page.getByRole('textbox', { name: '1번 항목 1번 선택지', exact: true }),
  ).toBeHidden()
  await expect(card.getByText('텍스트')).toBeVisible()
})

test('S21: 키보드만으로 1단계를 채우고 2단계로 넘어간다', async ({ page }) => {
  await page.goto(createPath)

  await page.getByLabel('양식명').focus()
  await page.keyboard.type('조사')
  await page.keyboard.press('Tab')
  await page.keyboard.type('습도')

  // 유형 셀렉트로 이동해 Enter 로 열고 항목을 고른다.
  await page.keyboard.press('Tab')
  await expect(
    page.getByRole('button', { name: '1번 항목 유형' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await page
    .getByRole('listbox', { name: '1번 항목 유형' })
    .getByRole('option', { name: '주관식' })
    .press('Enter')

  await page.getByLabel('2번 항목 이름').focus()
  await page.keyboard.type('청소여부')
  await selectType(page, 2, '주관식')

  await page.getByRole('button', { name: '다음' }).click()
  await expect(
    page.getByRole('heading', { name: '구역 번호 설정' }),
  ).toBeVisible()
})

function optionInput(page: Page, questionIndex: number, optionIndex: number) {
  return page.getByRole('textbox', {
    name: `${questionIndex}번 항목 ${optionIndex}번 선택지`,
    exact: true,
  })
}

function questionCard(page: Page, index: number) {
  return page.getByTestId('work-log-form-question').nth(index - 1)
}

async function selectType(page: Page, index: number, label: string) {
  await page.getByRole('button', { name: `${index}번 항목 유형` }).click()
  await page
    .getByRole('listbox', { name: `${index}번 항목 유형` })
    .getByRole('option', { name: label, exact: true })
    .click()
}

async function fillStepOne(page: Page) {
  await page.getByLabel('양식명').fill('조사')
  await page.getByLabel('1번 항목 이름').fill('습도')
  await selectType(page, 1, '주관식')
  await page.getByLabel('2번 항목 이름').fill('청소여부')
  await selectType(page, 2, '주관식')
}

async function goToStepTwo(page: Page) {
  await fillStepOne(page)
  await page.getByRole('button', { name: '다음' }).click()
  await expect(
    page.getByRole('heading', { name: '구역 번호 설정' }),
  ).toBeVisible()
}

async function autoCreateZones(
  page: Page,
  prefix: string,
  start: string,
  end: string,
) {
  await page.getByRole('button', { name: '구역 접두' }).click()
  await page
    .getByRole('listbox', { name: '구역 접두' })
    .getByRole('option', { name: prefix, exact: true })
    .click()
  await page.getByLabel('시작 번호').fill(start)
  await page.getByLabel('끝 번호').fill(end)
  await page.getByRole('button', { name: '생성', exact: true }).click()
}
