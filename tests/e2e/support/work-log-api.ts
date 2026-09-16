import type { Page, Route } from '@playwright/test'

// 업무일지관리 화면이 쓰는 API mock.
// 대상: GET /work-log, GET·DELETE /work-log/{workLogId},
//       GET·POST /work-log/template, GET·DELETE /work-log/template/{workLogTemplateId}.
// 실제 서버는 호출하지 않으며, 각 spec 은 필요한 응답만 page.route 로 덮어쓴다
// (Playwright 는 나중에 등록한 route 를 먼저 매칭한다).

export const workLogListPattern = /^https:\/\/[^/]+\/work-log(?:\?.*)?$/
export const templateListPattern =
  /^https:\/\/[^/]+\/work-log\/template(?:\?.*)?$/
export const templateItemPattern =
  /^https:\/\/[^/]+\/work-log\/template\/(\d+)(?:\?.*)?$/
export const workLogItemPattern =
  /^https:\/\/[^/]+\/work-log\/(\d+)(?:\?.*)?$/

export type MockServerQuestionType =
  | 'TEXT'
  | 'MULTIPLE_CHOICE'
  | 'CHECK_BOX'
  | 'FILE_UPLOAD'

export interface MockTemplateOption {
  optionId: number
  number: number
  content: string
  etcOption: boolean
}

export interface MockTemplateQuestion {
  questionId: number
  question: string
  questionType: MockServerQuestionType
  options: MockTemplateOption[]
}

export interface MockTemplate {
  templateId: number
  templateTitle: string
  /** YYYY-MM-DD */
  createdAt: string
  sections: { sectionId: number; sectionName: string }[]
  questions: MockTemplateQuestion[]
}

export interface MockAnswer {
  questionId: number
  /** 선택한 보기의 optionId. 기타 보기는 etcText 를 함께 둔다. */
  optionIds?: number[]
  etcText?: string
  answerText?: string
  file?: { fileName: string; fileKey: string }
}

export interface MockWorkLog {
  workLogId: number
  templateId: number
  writer: string
  /** YYYY-MM-DD */
  writeAt: string
  /** 구역 이름 → 답변 목록. 비우면 그 구역의 answers 가 빈 배열이다. */
  answers: Record<string, MockAnswer[]>
}

export function todayIsoDate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

// 양식 상세 화면(Figma 547:14084)이 쓰는 양식. 질문 카드 3종이 한 번씩 나온다.
export const mockTemplates: MockTemplate[] = [
  {
    templateId: 1,
    templateTitle: '사육장점검일지',
    createdAt: todayIsoDate(),
    sections: section(['A1', 'A2', 'A3']),
    questions: [
      question(12, '습도', 'MULTIPLE_CHOICE', ['30%', '1212%', '1%']),
      question(13, '청소여부', 'CHECK_BOX', ['모르겟음', '함', '안함']),
      question(11, '청소 방법이 뭔가요?', 'TEXT'),
    ],
  },
  ...Array.from({ length: 8 }, (_, index) => ({
    templateId: index + 2,
    templateTitle: `양식${index + 2}`,
    createdAt: todayIsoDate(),
    sections: section(['A1']),
    questions: [question(100 + index, '메모', 'TEXT')],
  })),
]

// 오늘 작성된 일지 9건 → 4행 페이지네이션 3쪽.
export const mockWorkLogs: MockWorkLog[] = [
  {
    workLogId: 1,
    templateId: 101,
    writer: '김수인',
    writeAt: todayIsoDate(),
    answers: {
      A1: [
        { questionId: 210, optionIds: [421] },
        {
          questionId: 211,
          answerText:
            '바닥과 벽면을 순서대로 닦고 소독액을 뿌린 뒤 환기까지 마쳤습니다.',
        },
        { questionId: 212, optionIds: [425] },
        { questionId: 213, optionIds: [427] },
        { questionId: 214, answerText: '1kg' },
        {
          questionId: 215,
          file: { fileName: 'feed.png', fileKey: 'work-log/feed.png' },
        },
      ],
      A2: [
        { questionId: 210, optionIds: [422] },
        { questionId: 213, optionIds: [427, 428] },
      ],
      A3: [{ questionId: 213, optionIds: [427, 428, 429], etcText: '야간 소독' }],
    },
  },
  ...Array.from({ length: 8 }, (_, index) => ({
    workLogId: index + 2,
    templateId: index + 2,
    writer: `직원${index + 2}`,
    writeAt: todayIsoDate(),
    answers: { A1: [{ questionId: 100 + index, answerText: '정상' }] },
  })),
]

// 일지 시트(Figma 541:14081)가 쓰는 양식. 질문 유형이 모두 나온다.
// 양식 목록에는 노출하지 않는다(id >= 100).
export const sheetTemplate: MockTemplate = {
  templateId: 101,
  templateTitle: '사육장점검일지',
  createdAt: todayIsoDate(),
  sections: section(['A1', 'A2', 'A3']),
  questions: [
    question(210, '온도', 'MULTIPLE_CHOICE', ['20도', '25도', '기타']),
    question(211, '청소방법이 뭔가요?', 'TEXT'),
    question(212, '습도', 'MULTIPLE_CHOICE', ['40%', '60%']),
    question(213, '청소여부', 'CHECK_BOX', ['바닥', '벽면', '기타']),
    question(214, '급여량', 'TEXT'),
    question(215, '사진', 'FILE_UPLOAD'),
  ],
}

/** 답변이 하나도 없는 일지(구역 6개). `/work-logs/100` 으로 진입한다. */
export const emptyWorkLog: MockWorkLog = {
  workLogId: 100,
  templateId: 100,
  writer: '이서준',
  writeAt: todayIsoDate(),
  answers: { A1: [], A2: [], A3: [], A4: [], A5: [], A6: [] },
}

export const emptyTemplate: MockTemplate = {
  templateId: 100,
  templateTitle: '빈 일지 양식',
  createdAt: todayIsoDate(),
  sections: section(['A1', 'A2', 'A3', 'A4', 'A5', 'A6']),
  questions: sheetTemplate.questions,
}

function section(names: string[]) {
  return names.map((sectionName, index) => ({
    sectionId: index + 1,
    sectionName,
  }))
}

function question(
  questionId: number,
  text: string,
  questionType: MockServerQuestionType,
  options: string[] = [],
): MockTemplateQuestion {
  return {
    questionId,
    question: text,
    questionType,
    options: options.map((content, index) => ({
      optionId: questionId * 2 + index + 1,
      number: index,
      content,
      etcOption: content === '기타',
    })),
  }
}

export interface WorkLogApiRequests {
  list: number
  detail: number
  delete: number
  templateList: number
  templateDetail: number
  templateCreate: number
  templateDelete: number
}

export interface WorkLogApiHandle {
  workLogs: MockWorkLog[]
  templates: MockTemplate[]
  requests: WorkLogApiRequests
  listQueries: URLSearchParams[]
  templateListQueries: URLSearchParams[]
  createdBodies: unknown[]
}

export interface WorkLogApiOptions {
  workLogs?: MockWorkLog[]
  templates?: MockTemplate[]
}

export async function mockWorkLogApi(
  page: Page,
  options: WorkLogApiOptions = {},
): Promise<WorkLogApiHandle> {
  const {
    workLogs = [...mockWorkLogs, emptyWorkLog].map((item) => ({ ...item })),
    templates = [...mockTemplates, sheetTemplate, emptyTemplate].map(
      (item) => ({ ...item }),
    ),
  } = options

  const handle: WorkLogApiHandle = {
    workLogs,
    templates,
    requests: {
      list: 0,
      detail: 0,
      delete: 0,
      templateList: 0,
      templateDetail: 0,
      templateCreate: 0,
      templateDelete: 0,
    },
    listQueries: [],
    templateListQueries: [],
    createdBodies: [],
  }

  await page.route(workLogListPattern, async (route) => {
    handle.requests.list += 1
    const query = new URL(route.request().url()).searchParams
    handle.listQueries.push(query)

    // 목록에는 답변이 없는 일지(상세 전용)를 넣지 않는다.
    const matched = handle.workLogs.filter(
      (item) => item.writeAt === query.get('date') && item.workLogId < 100,
    )

    await json(
      route,
      200,
      pageBody(
        matched.map((item) => ({
          workLogId: item.workLogId,
          writer: item.writer,
          writeAt: item.writeAt,
          templateTitle: titleOf(handle, item.templateId),
        })),
        query,
      ),
    )
  })

  await page.route(templateListPattern, async (route) => {
    if (route.request().method() === 'POST') {
      handle.requests.templateCreate += 1
      handle.createdBodies.push(route.request().postDataJSON())
      await json(route, 201, { message: '업무일지 양식 생성 성공' })
      return
    }

    handle.requests.templateList += 1
    const query = new URL(route.request().url()).searchParams
    handle.templateListQueries.push(query)

    const date = query.get('date')
    const matched = handle.templates.filter(
      (item) =>
        item.templateId < 100 && (date === null || item.createdAt === date),
    )

    await json(
      route,
      200,
      pageBody(
        matched.map((item) => ({
          templateId: item.templateId,
          templateTitle: item.templateTitle,
          createdAt: item.createdAt,
        })),
        query,
      ),
    )
  })

  await page.route(templateItemPattern, async (route) => {
    const templateId = Number(matchId(route, templateItemPattern))
    const index = handle.templates.findIndex(
      (item) => item.templateId === templateId,
    )

    if (route.request().method() === 'DELETE') {
      handle.requests.templateDelete += 1

      if (index === -1) {
        await json(route, 404, errorBody(404, '존재하지 않는 업무일지 입니다.'))
        return
      }

      handle.templates.splice(index, 1)
      await json(route, 200, { message: '업무일지 양식 삭제 성공' })
      return
    }

    handle.requests.templateDetail += 1

    if (index === -1) {
      await json(route, 404, errorBody(404, '존재하지 않는 업무일지 입니다.'))
      return
    }

    const template = handle.templates[index]
    await json(route, 200, {
      templateId: template.templateId,
      templateTitle: template.templateTitle,
      sections: template.sections,
      questions: template.questions,
    })
  })

  await page.route(workLogItemPattern, async (route) => {
    const workLogId = Number(matchId(route, workLogItemPattern))
    const index = handle.workLogs.findIndex(
      (item) => item.workLogId === workLogId,
    )

    if (route.request().method() === 'DELETE') {
      handle.requests.delete += 1

      if (index === -1) {
        await json(route, 404, errorBody(404, '존재하지 않는 업무일지입니다.'))
        return
      }

      handle.workLogs.splice(index, 1)
      await json(route, 200, { message: '업무일지 삭제 성공' })
      return
    }

    handle.requests.detail += 1

    if (index === -1) {
      await json(route, 404, errorBody(404, '존재하지 않는 업무일지입니다.'))
      return
    }

    await json(route, 200, toDetailBody(handle, handle.workLogs[index]))
  })

  return handle
}

function toDetailBody(handle: WorkLogApiHandle, log: MockWorkLog) {
  const template = handle.templates.find(
    (item) => item.templateId === log.templateId,
  )
  const questions = template?.questions ?? []
  const sections = template?.sections ?? []

  return {
    workLogId: log.workLogId,
    templateId: log.templateId,
    templateTitle: template?.templateTitle ?? '',
    writerName: log.writer,
    writeAt: log.writeAt,
    sections: sections.map(({ sectionId, sectionName }) => ({
      sectionId,
      sectionName,
      answers: (log.answers[sectionName] ?? []).map((answer) =>
        toAnswerBody(questions, answer),
      ),
    })),
  }
}

function toAnswerBody(
  questions: MockTemplateQuestion[],
  answer: MockAnswer,
) {
  const question = questions.find(
    (item) => item.questionId === answer.questionId,
  )
  const options = (answer.optionIds ?? []).map((optionId) => {
    const option = question?.options.find((item) => item.optionId === optionId)

    return {
      optionId,
      number: option?.number ?? 0,
      content: option?.content ?? '',
      etcOption: option?.etcOption ?? false,
      etcText: option?.etcOption ? (answer.etcText ?? null) : null,
    }
  })

  return {
    questionId: answer.questionId,
    question: question?.question ?? '',
    questionType: question?.questionType ?? 'TEXT',
    answerText: answer.answerText ?? null,
    options,
    file: answer.file ?? null,
  }
}

function titleOf(handle: WorkLogApiHandle, templateId: number): string {
  return (
    handle.templates.find((item) => item.templateId === templateId)
      ?.templateTitle ?? ''
  )
}

// 명세의 page 는 0부터 시작한다.
function pageBody<T>(items: T[], query: URLSearchParams) {
  const size = Number(query.get('size') ?? 4)
  const number = Number(query.get('page') ?? 0)

  return {
    content: items.slice(number * size, (number + 1) * size),
    pageable: { pageNumber: number, pageSize: size },
    totalPages: Math.ceil(items.length / size),
    totalElements: items.length,
    size,
    number,
    first: number === 0,
    last: (number + 1) * size >= items.length,
    numberOfElements: items.length,
    empty: items.length === 0,
  }
}

export function errorBody(status: number, message: string) {
  return {
    message,
    status,
    timestamp: '2026-08-08T12:00:00',
    description: message,
  }
}

function matchId(route: Route, pattern: RegExp): string {
  return pattern.exec(route.request().url())?.[1] ?? ''
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}
