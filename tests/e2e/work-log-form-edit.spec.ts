import { expect, test as base, type Page } from '@playwright/test'

// 승인된 시나리오(work-log-form-edit.approved.json)를 변환한 것.
// 양식 수정 기능을 되살리며(#255) localStorage mock 대신 `support/work-log-api` 의
// page.route mock 으로 옮겼다. 실제 서버는 호출하지 않는다.

import { mockWorkLogApi, type WorkLogApiHandle } from './support/work-log-api'

const editPath = '/work-logs/forms/1/edit'
const listUrl = /\/work-logs\?tab=forms$/

const test = base.extend<{ workLogApi: WorkLogApiHandle }>({
  workLogApi: [
    async ({ page }, runTest) => {
      await runTest(await mockWorkLogApi(page))
    },
    { auto: true },
  ],
})

interface UpdatedBody {
  templateTitle: string
  sections: string[]
  questions: {
    question: string
    questionType: string
    required: boolean
    options: { content: string; etcOption: boolean }[]
  }[]
}

test('S1: 수정 화면 진입 기본 표시', async ({ page }) => {
  await page.goto('/work-logs?tab=forms')
  await openEditFromList(page)

  await expect(page).toHaveURL(new RegExp(`${editPath}$`))
  await expect(page.getByText('항목 설정')).toBeVisible()
  await expect(page.getByLabel('양식명')).toHaveValue('사육장점검일지')
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

test('S2-1: 저장된 필수 여부가 토글에 그대로 보인다', async ({ page }) => {
  await page.goto(editPath)

  await expect(
    page.getByRole('switch', { name: '1번 항목 필수' }),
  ).toHaveAttribute('aria-checked', 'true')
  await expect(
    page.getByRole('switch', { name: '2번 항목 필수' }),
  ).toHaveAttribute('aria-checked', 'false')
  await expect(
    page.getByRole('switch', { name: '3번 항목 필수' }),
  ).toHaveAttribute('aria-checked', 'true')
})

test('S3: 변경 없이 뒤로가기', async ({ page }) => {
  await page.goto(editPath)
  await expect(page.getByLabel('양식명')).toHaveValue('사육장점검일지')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page).toHaveURL(listUrl)
})

test('S4: 변경 후 뒤로가기 → 나가기 확인 모달', async ({ page }) => {
  await page.goto(editPath)
  await page.getByLabel('양식명').fill('조사')
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page.getByText('정말 나가시겠습니까?')).toBeVisible()
  await expect(page.getByText('저장하지 않고 돌아갈 시')).toBeVisible()
})

test('S4-1: 필수 여부만 바꿔도 나가기 확인 모달이 뜬다', async ({ page }) => {
  await page.goto(editPath)
  await page.getByRole('switch', { name: '2번 항목 필수' }).click()
  await page.getByRole('link', { name: '뒤로가기' }).click()

  await expect(page.getByText('정말 나가시겠습니까?')).toBeVisible()
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

  await expect(page).toHaveURL(listUrl)
})

test('S7: 1단계 저장 검증', async ({ page, workLogApi }) => {
  await page.goto(editPath)
  await expect(page.getByLabel('양식명')).toHaveValue('사육장점검일지')
  await page.getByLabel('양식명').fill('')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByText('양식명을 입력해주세요!')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${editPath}$`))
  expect(workLogApi.requests.templateUpdate).toBe(0)
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

test('S12: 구역을 모두 지우고 저장하면 막힌다', async ({
  page,
  workLogApi,
}) => {
  await page.goto(editPath)
  await goToStepTwo(page)
  await page.getByRole('button', { name: '전체 삭제' }).click()
  await page.getByRole('button', { name: '확인' }).click()
  await expect(page.getByText('(0)')).toBeVisible()

  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByText('구역 번호를 설정해주세요')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${editPath}/zones$`))
  expect(workLogApi.requests.templateUpdate).toBe(0)
})

test('S13: 저장 성공 — 양식 전체를 PATCH 로 보낸다', async ({
  page,
  workLogApi,
}) => {
  await page.goto(editPath)
  await page.getByLabel('양식명').fill('조사')
  await page.getByRole('switch', { name: '2번 항목 필수' }).click()
  await goToStepTwo(page)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(listUrl)
  // 목록 표가 불러오는 동안의 스켈레톤도 status 라 문구로 고른다.
  await expect(
    page.getByRole('status').filter({ hasText: '양식 저장에 성공했습니다' }),
  ).toBeVisible()
  await expect(page.getByText('조사').first()).toBeVisible()

  expect(workLogApi.requests.templateUpdate).toBe(1)
  const body = workLogApi.updatedBodies[0] as UpdatedBody
  expect(body.templateTitle).toBe('조사')
  expect(body.sections).toEqual(['A1', 'A2', 'A3'])
  expect(body.questions.map((item) => item.question)).toEqual([
    '습도',
    '청소여부',
    '청소 방법이 뭔가요?',
  ])
  expect(body.questions.map((item) => item.required)).toEqual([
    true,
    true,
    true,
  ])
  expect(body.questions[0].options).toEqual([
    { content: '30%', etcOption: false },
    { content: '1212%', etcOption: false },
    { content: '1%', etcOption: false },
  ])
})

test('S13-1: 1단계에서 바로 저장하면 구역은 그대로 보낸다', async ({
  page,
  workLogApi,
}) => {
  await page.goto(editPath)
  await page.getByLabel('1번 항목 이름').fill('온도')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page).toHaveURL(listUrl)
  const body = workLogApi.updatedBodies[0] as UpdatedBody
  expect(body.questions[0].question).toBe('온도')
  expect(body.sections).toEqual(['A1', 'A2', 'A3'])
})

test('S14: 저장 실패 → 입력값과 단계가 유지되고 다시 저장할 수 있다', async ({
  page,
  workLogApi,
}) => {
  let failNext = true
  await page.route(
    /^https:\/\/[^/]+\/work-log\/template\/1$/,
    async (route) => {
      if (route.request().method() !== 'PATCH' || !failNext) {
        await route.fallback()
        return
      }
      failNext = false
      await route.fulfill({ status: 500, body: '' })
    },
  )

  await page.goto(editPath)
  await page.getByLabel('양식명').fill('조사')
  await goToStepTwo(page)
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByText('저장에 실패했습니다')).toBeVisible()
  await page.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(new RegExp(`${editPath}/zones$`))

  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page).toHaveURL(listUrl)
  expect(workLogApi.requests.templateUpdate).toBe(1)
})

test('S14-1: 중복 양식명(409)은 따로 알린다', async ({ page }) => {
  await page.route(
    /^https:\/\/[^/]+\/work-log\/template\/1$/,
    async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.fallback()
        return
      }
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: '이미 존재하는 업무일지 양식입니다.' }),
      })
    },
  )

  await page.goto(editPath)
  await page.getByLabel('양식명').fill('양식2')
  await page.getByRole('button', { name: '저장하기' }).click()

  await expect(page.getByText('이미 존재하는 양식명입니다')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${editPath}$`))
})

test('S15-1: 편집 중 네트워크가 다시 연결돼도 입력값이 유지된다', async ({
  page,
  context,
  workLogApi,
}) => {
  await page.goto(editPath)
  await page.getByLabel('양식명').fill('조사')
  const detailRequests = workLogApi.requests.templateDetail

  // 다시 불러오면 실패하도록 막아 둔다. 재조회가 일어나면 오류 화면으로 바뀐다.
  await page.route(
    /^https:\/\/[^/]+\/work-log\/template\/1$/,
    async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback()
        return
      }
      await route.fulfill({ status: 500, body: '' })
    },
  )
  await context.setOffline(true)
  await context.setOffline(false)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))

  await expect(page.getByLabel('양식명')).toHaveValue('조사')
  await expect(page.getByText('양식을 불러오지 못했습니다')).toHaveCount(0)
  expect(workLogApi.requests.templateDetail).toBe(detailRequests)
})

test('S15: 삭제된 양식으로 진입하면 목록으로 되돌린다', async ({ page }) => {
  await page.goto('/work-logs/forms/999/edit')

  await expect(page).toHaveURL(listUrl)
})

test('S16: 키보드만으로 값을 고치고 단계를 옮긴다', async ({ page }) => {
  await page.goto(editPath)
  await expect(page.getByLabel('양식명')).toHaveValue('사육장점검일지')

  await page.getByLabel('양식명').focus()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('조사')
  await expect(page.getByLabel('양식명')).toHaveValue('조사')

  await page.getByRole('switch', { name: '2번 항목 필수' }).focus()
  await page.keyboard.press('Space')
  await expect(
    page.getByRole('switch', { name: '2번 항목 필수' }),
  ).toHaveAttribute('aria-checked', 'true')

  await page.getByRole('button', { name: '다음' }).focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { name: '구역 번호 설정' }),
  ).toBeVisible()

  await page.getByRole('link', { name: '뒤로가기' }).click()
  await expect(page.getByLabel('양식명')).toHaveValue('조사')
})

test('S18: 수정도 브라우저 뒤로가기에서 나가기 확인이 뜬다', async ({
  page,
}) => {
  await page.goto('/work-logs?tab=forms')
  await openEditFromList(page)
  await expect(page.getByLabel('양식명')).toHaveValue('사육장점검일지')

  await page.getByLabel('양식명').fill('조사')
  await page.goBack()

  await expect(page.getByText('정말 나가시겠습니까?')).toBeVisible()
})

test('S19: 저장한 질문 구성이 다시 들어와도 남아 있다', async ({ page }) => {
  await page.goto('/work-logs?tab=forms')
  await openEditFromList(page)
  await expect(page.getByLabel('1번 항목 이름')).toHaveValue('습도')

  await page.getByLabel('1번 항목 이름').fill('온도')
  await page.getByRole('button', { name: '3번 항목 삭제' }).click()
  await page.getByRole('button', { name: '다음' }).click()
  await expect(
    page.getByRole('heading', { name: '구역 번호 설정' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '저장하기' }).click()
  await expect(page).toHaveURL(listUrl)

  await openEditFromList(page)

  await expect(page.getByLabel('1번 항목 이름')).toHaveValue('온도')
  await expect(page.getByTestId('work-log-form-question')).toHaveCount(2)
})

test('S20: 양식 상세 화면에는 수정 진입 버튼이 없다', async ({ page }) => {
  await page.goto('/work-logs/forms/1')
  await expect(
    page.getByRole('button', { name: '표로 미리보기' }),
  ).toBeVisible()

  await expect(page.getByRole('button', { name: '수정하기' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: '수정하기' })).toHaveCount(0)
})

async function openEditFromList(page: Page) {
  await page
    .getByTestId('work-log-form-row')
    .first()
    .getByRole('button', { name: /관리 메뉴$/ })
    .click()
  await page.getByRole('menuitem', { name: '수정' }).click()
}

async function goToStepTwo(page: Page) {
  await expect(page.getByLabel('1번 항목 이름')).toHaveValue('습도')
  await page.getByRole('button', { name: '다음' }).click()
  await expect(
    page.getByRole('heading', { name: '구역 번호 설정' }),
  ).toBeVisible()
}
