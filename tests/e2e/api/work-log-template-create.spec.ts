import { expect, test, type Page } from '@playwright/test'
import { mockWorkLogApi } from '../support/work-log-api'

// 대상: WORK_LOG_TEMPLATE_CREATE (POST /work-log/template).
// 구역·질문 배열 순서가 그대로 정렬 순서가 되고 유형이 명세 enum 으로 나가는지 본다.
// 실제 서버는 호출하지 않는다.

const createPath = '/work-logs/forms/create'

interface CreatedBody {
  templateTitle: string
  sections: string[]
  questions: {
    question: string
    questionType: string
    options: { content: string; etcOption: boolean }[]
  }[]
}

test('S1: 양식명·구역·질문을 명세 형태로 보낸다', async ({ page }) => {
  const api = await mockWorkLogApi(page)

  await page.goto(createPath)
  await page.getByLabel('양식명').fill('사육장점검일지')
  await page.getByLabel('1번 항목 이름').fill('온도')
  await selectType(page, 1, '객관식 질문')
  await page.getByLabel('1번 항목 1번 선택지').first().fill('20도')
  await page.getByLabel('2번 항목 이름').fill('특이사항')
  await selectType(page, 2, '주관식')

  await page.getByRole('button', { name: '다음' }).click()
  await expect(
    page.getByRole('heading', { name: '구역 번호 설정' }),
  ).toBeVisible()
  await autoCreateZones(page, 'A', '1', '2')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page).toHaveURL(/\/work-logs\?tab=forms$/)

  expect(api.requests.templateCreate).toBe(1)
  const body = api.createdBodies[0] as CreatedBody
  expect(body.templateTitle).toBe('사육장점검일지')
  expect(body.sections).toEqual(['A1', 'A2'])
  expect(body.questions.map((item) => item.question)).toEqual([
    '온도',
    '특이사항',
  ])
  expect(body.questions.map((item) => item.questionType)).toEqual([
    'MULTIPLE_CHOICE',
    'TEXT',
  ])
  // 주관식은 보기를 빈 배열로 보낸다(명세).
  expect(body.questions[1].options).toEqual([])
})

test('S2: 중복 양식명이면 409 를 알리고 화면에 머문다', async ({ page }) => {
  await mockWorkLogApi(page)
  await page.route(/^https:\/\/[^/]+\/work-log\/template(?:\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        message: '이미 존재하는 업무일지 템플릿 제목입니다.',
        status: 409,
        timestamp: '2026-08-08T12:00:00',
        description: 'WORK_LOG_TEMPLATE_EXIST',
      }),
    })
  })

  await page.goto(createPath)
  await page.getByLabel('양식명').fill('사육장점검일지')
  await page.getByLabel('1번 항목 이름').fill('온도')
  await selectType(page, 1, '주관식')
  await page.getByLabel('2번 항목 이름').fill('특이사항')
  await selectType(page, 2, '주관식')

  await page.getByRole('button', { name: '다음' }).click()
  await autoCreateZones(page, 'A', '1', '2')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page.getByText('이미 존재하는 양식명입니다')).toBeVisible()

  await page.getByRole('button', { name: '확인' }).click()
  await expect(page.getByText('이미 존재하는 양식명입니다')).toBeHidden()
  await expect(page).toHaveURL(new RegExp(`${createPath}/zones$`))
})

test('S3: 생성 실패(500)는 일반 오류로 알린다', async ({ page }) => {
  await mockWorkLogApi(page)
  await page.route(/^https:\/\/[^/]+\/work-log\/template(?:\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback()
      return
    }

    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
  })

  await page.goto(createPath)
  await page.getByLabel('양식명').fill('조사')
  await page.getByLabel('1번 항목 이름').fill('온도')
  await selectType(page, 1, '주관식')
  await page.getByLabel('2번 항목 이름').fill('특이사항')
  await selectType(page, 2, '주관식')

  await page.getByRole('button', { name: '다음' }).click()
  await autoCreateZones(page, 'A', '1', '2')
  await page.getByRole('button', { name: '생성하기' }).click()

  await expect(page.getByText('생성에 실패했습니다')).toBeVisible()
})

async function selectType(page: Page, index: number, label: string) {
  await page.getByRole('button', { name: `${index}번 항목 유형` }).click()
  await page
    .getByRole('listbox', { name: `${index}번 항목 유형` })
    .getByRole('option', { name: label, exact: true })
    .click()
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
