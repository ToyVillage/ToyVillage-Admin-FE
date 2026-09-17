import { isAxiosError } from 'axios'
import { api } from '@/shared/api/axios'
import type {
  WorkLog,
  WorkLogDetail,
  WorkLogForm,
  WorkLogFormDetail,
  WorkLogFormDraft,
  WorkLogFormEditorType,
  WorkLogQuestionType,
  WorkLogSheetColumn,
  WorkLogSheetRow,
  WorkLogSheetValue,
} from '../model/types'
import type {
  PageResponse,
  WorkLogAnswerResponse,
  WorkLogDetailResponse,
  WorkLogListItemResponse,
  WorkLogMessageResponse,
  WorkLogQueryAllRequest,
  WorkLogQueryRequest,
  WorkLogSectionResponse,
  WorkLogServerQuestionType,
  WorkLogTemplateCreateQuestion,
  WorkLogTemplateCreateRequest,
  WorkLogTemplateDetailResponse,
  WorkLogTemplateListItemResponse,
  WorkLogTemplateQueryAllRequest,
  WorkLogTemplateQueryRequest,
} from './types'

export interface WorkLogListPage {
  items: WorkLog[]
  totalPages: number
  totalElements: number
}

export interface WorkLogFormListPage {
  items: WorkLogForm[]
  totalPages: number
  totalElements: number
}

// 명세의 질문 유형 → 일지 시트 열 유형.
// `SHORT_TEXT`·`LONG_TEXT` 는 명세 enum 에는 없지만 상세 응답 예시에 나와 함께 받는다.
const sheetTypeByServerType: Record<string, WorkLogQuestionType> = {
  TEXT: 'LONG_TEXT',
  SHORT_TEXT: 'SHORT_TEXT',
  LONG_TEXT: 'LONG_TEXT',
  MULTIPLE_CHOICE: 'CHOICE',
  CHECK_BOX: 'CHECKBOX',
  FILE_UPLOAD: 'FILE',
}

// 명세의 질문 유형 → 양식 화면(상세·편집기) 유형.
const formTypeByServerType: Record<string, WorkLogFormEditorType> = {
  TEXT: 'TEXT',
  SHORT_TEXT: 'TEXT',
  LONG_TEXT: 'TEXT',
  MULTIPLE_CHOICE: 'CHOICE',
  CHECK_BOX: 'CHECKBOX',
  FILE_UPLOAD: 'FILE',
}

const serverTypeByFormType: Record<
  WorkLogFormEditorType,
  WorkLogServerQuestionType
> = {
  TEXT: 'TEXT',
  CHOICE: 'MULTIPLE_CHOICE',
  CHECKBOX: 'CHECK_BOX',
  FILE: 'FILE_UPLOAD',
}

// 기타 보기의 보기명은 고정이다. 양식을 만드는 쪽은 값을 입력하지 않는다.
const etcOptionContent = '기타'

// WORK_LOG_QUERY_ALL — 해당 날짜에 작성된 모든 직원의 업무일지(관리자 전용).
export async function getWorkLogs({
  date,
  page,
  size,
}: WorkLogQueryAllRequest): Promise<WorkLogListPage> {
  assertIsoDate(date)
  assertPaging(page, size)

  const { data } = await api.get<unknown>('/work-log', {
    params: { date, page, size },
  })

  if (!isPageResponse(data, isWorkLogListItem)) {
    throw new Error('업무일지 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    items: data.content.map((item) => ({
      id: String(item.workLogId),
      authorName: item.writer,
      formName: item.templateTitle,
      date: item.writeAt,
    })),
    totalPages: data.totalPages,
    totalElements: data.totalElements,
  }
}

// WORK_LOG_QUERY — 작성된 답변을 구역 순서대로 묶어 시트로 만든다.
// 시트 열(질문)은 답변 순서 그대로다. 서버가 질문 순서를 정해 내려준다(백엔드 확인, 2026-09-16).
export async function getWorkLogDetail({
  workLogId,
}: WorkLogQueryRequest): Promise<WorkLogDetail> {
  assertId(workLogId, '업무일지')

  const { data } = await api.get<unknown>(`/work-log/${workLogId}`)

  if (!isWorkLogDetailResponse(data)) {
    throw new Error('업무일지 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    id: String(data.workLogId),
    date: data.writeAt,
    formName: data.templateTitle,
    authorName: data.writerName,
    columns: toSheetColumns(data.sections),
    rows: data.sections.map(toSheetRow),
  }
}

// WORK_LOG_DELETE — 관리자는 모든 직원의 업무일지를 삭제할 수 있다.
export async function deleteWorkLog({
  workLogId,
}: WorkLogQueryRequest): Promise<WorkLogMessageResponse> {
  assertId(workLogId, '업무일지')

  const { data } = await api.delete<unknown>(`/work-log/${workLogId}`)

  if (!isMessageResponse(data)) {
    throw new Error('업무일지 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

// WORK_LOG_TEMPLATE_QUERY_ALL — date 를 보내면 그 날짜에 생성된 양식만 조회한다.
export async function getWorkLogForms({
  date,
  page,
  size,
}: WorkLogTemplateQueryAllRequest): Promise<WorkLogFormListPage> {
  if (date !== undefined) assertIsoDate(date)
  assertPaging(page, size)

  const { data } = await api.get<unknown>('/work-log/template', {
    params: { date, page, size },
  })

  if (!isPageResponse(data, isWorkLogTemplateListItem)) {
    throw new Error('업무일지 양식 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    items: data.content.map((item) => ({
      id: String(item.templateId),
      name: item.templateTitle,
      // 명세의 양식 목록 응답에 작성자가 없다.
      authorName: '',
      date: item.createdAt,
    })),
    totalPages: data.totalPages,
    totalElements: data.totalElements,
  }
}

// WORK_LOG_TEMPLATE_QUERY — 삭제된 양식은 404 다.
export async function getWorkLogFormDetail({
  workLogTemplateId,
}: WorkLogTemplateQueryRequest): Promise<WorkLogFormDetail> {
  assertId(workLogTemplateId, '업무일지 양식')

  const { data } = await api.get<unknown>(
    `/work-log/template/${workLogTemplateId}`,
  )

  if (!isWorkLogTemplateDetailResponse(data)) {
    throw new Error('업무일지 양식 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    id: String(data.templateId),
    name: data.templateTitle,
    questions: data.questions.map((question) => ({
      id: String(question.questionId),
      label: question.question,
      type: formTypeByServerType[question.questionType] ?? 'TEXT',
      // 업무일지 질문은 모두 필수다(명세에 필드가 없어 고정값으로 둔다).
      required: true,
      options: question.options.map((option) => option.content),
    })),
  }
}

// WORK_LOG_TEMPLATE_CREATE — 구역·질문 배열 순서가 그대로 정렬 순서가 된다.
export async function createWorkLogForm(
  draft: WorkLogFormDraft,
): Promise<WorkLogMessageResponse> {
  const body = toTemplateCreateRequest(draft)

  const { data } = await api.post<unknown>('/work-log/template', body)

  if (!isMessageResponse(data)) {
    throw new Error('업무일지 양식 생성 응답 형식이 올바르지 않습니다.')
  }

  return data
}

// WORK_LOG_TEMPLATE_DELETE — 소프트 삭제다. 이미 작성된 일지는 그대로 남는다.
export async function deleteWorkLogForm({
  workLogTemplateId,
}: WorkLogTemplateQueryRequest): Promise<WorkLogMessageResponse> {
  assertId(workLogTemplateId, '업무일지 양식')

  const { data } = await api.delete<unknown>(
    `/work-log/template/${workLogTemplateId}`,
  )

  if (!isMessageResponse(data)) {
    throw new Error('업무일지 양식 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

/** 지워진 일지·양식은 404 다. 그 외 실패(500·네트워크)와 구분해 다루기 위한 판별이다. */
export function isWorkLogNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404
}

/** 양식명이 이미 있으면 서버가 409 를 준다(WORK_LOG_TEMPLATE_EXIST). */
export function isDuplicateFormNameError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 409
}

export function toTemplateCreateRequest(
  draft: WorkLogFormDraft,
): WorkLogTemplateCreateRequest {
  const templateTitle = draft.name.trim()

  if (templateTitle.length === 0) {
    throw new Error('양식명을 입력해 주세요.')
  }

  if (draft.zones.length === 0) {
    throw new Error('구역을 하나 이상 추가해 주세요.')
  }

  if (draft.questions.length === 0) {
    throw new Error('질문을 하나 이상 추가해 주세요.')
  }

  return {
    templateTitle,
    sections: draft.zones.map((zone) => zone.label),
    questions: draft.questions.map(toCreateQuestion),
  }
}

function toCreateQuestion(
  question: WorkLogFormDraft['questions'][number],
): WorkLogTemplateCreateQuestion {
  if (question.type === null) {
    throw new Error('질문 유형을 선택해 주세요.')
  }

  const questionType = serverTypeByFormType[question.type]
  const options = question.options.map((option) => ({
    content: option.isEtc ? etcOptionContent : option.value.trim(),
    etcOption: option.isEtc,
  }))

  // 객관식·체크박스는 보기가 하나 이상이어야 한다(400 방지).
  if (
    (questionType === 'MULTIPLE_CHOICE' || questionType === 'CHECK_BOX') &&
    options.length === 0
  ) {
    throw new Error('객관식·체크박스 질문은 보기를 하나 이상 등록해야 합니다.')
  }

  return { question: question.label.trim(), questionType, options }
}

// 시트 열은 질문이다. 답변이 없는 구역이 있어 모든 구역을 훑어 처음 나온 순서로 모은다.
function toSheetColumns(
  sections: WorkLogSectionResponse[],
): WorkLogSheetColumn[] {
  const columns = new Map<string, WorkLogSheetColumn>()

  for (const section of sections) {
    for (const answer of section.answers) {
      const id = String(answer.questionId)
      if (columns.has(id)) continue

      columns.set(id, {
        id,
        label: answer.question,
        type: sheetTypeByServerType[answer.questionType] ?? 'LONG_TEXT',
      })
    }
  }

  return [...columns.values()]
}

// 시트 행은 구역이다. 답변이 없는 질문은 값이 없다.
function toSheetRow(section: WorkLogSectionResponse): WorkLogSheetRow {
  const values: WorkLogSheetRow['values'] = {}

  for (const answer of section.answers) {
    values[String(answer.questionId)] = toSheetValue(answer)
  }

  return { zone: section.sectionName, values }
}

function toSheetValue(answer: WorkLogAnswerResponse): WorkLogSheetValue {
  const picked = answer.options.map(
    (option) => option.etcText ?? option.content,
  )

  if (answer.questionType === 'CHECK_BOX') return picked
  if (answer.questionType === 'MULTIPLE_CHOICE') return picked[0] ?? null
  // 파일 답변은 첨부 칩으로 그린다(파일명 + 다운로드).
  if (answer.questionType === 'FILE_UPLOAD') return answer.file ?? null

  return answer.answerText
}

function assertIsoDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('조회 날짜 형식이 올바르지 않습니다.')
  }
}

// 명세상 page 는 0부터 시작한다.
function assertPaging(page: number, size: number): void {
  if (!Number.isSafeInteger(page) || page < 0) {
    throw new Error('페이지 번호가 올바르지 않습니다.')
  }

  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error('페이지 크기가 올바르지 않습니다.')
  }
}

function assertId(id: number, label: string): void {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`${label} ID가 올바르지 않습니다.`)
  }
}

function isPageResponse<T>(
  value: unknown,
  isItem: (item: unknown) => item is T,
): value is PageResponse<T> {
  if (typeof value !== 'object' || value === null) return false

  const page = value as Record<string, unknown>

  return (
    Array.isArray(page.content) &&
    page.content.every(isItem) &&
    Number.isInteger(page.totalPages) &&
    Number.isInteger(page.totalElements)
  )
}

function isWorkLogListItem(value: unknown): value is WorkLogListItemResponse {
  if (typeof value !== 'object' || value === null) return false

  const item = value as Record<string, unknown>

  return (
    Number.isInteger(item.workLogId) &&
    typeof item.writer === 'string' &&
    typeof item.writeAt === 'string' &&
    typeof item.templateTitle === 'string'
  )
}

function isWorkLogTemplateListItem(
  value: unknown,
): value is WorkLogTemplateListItemResponse {
  if (typeof value !== 'object' || value === null) return false

  const item = value as Record<string, unknown>

  return (
    Number.isInteger(item.templateId) &&
    typeof item.templateTitle === 'string' &&
    typeof item.createdAt === 'string'
  )
}

function isWorkLogDetailResponse(
  value: unknown,
): value is WorkLogDetailResponse {
  if (typeof value !== 'object' || value === null) return false

  const detail = value as Record<string, unknown>

  return (
    Number.isInteger(detail.workLogId) &&
    typeof detail.templateTitle === 'string' &&
    typeof detail.writerName === 'string' &&
    typeof detail.writeAt === 'string' &&
    Array.isArray(detail.sections) &&
    detail.sections.every(isSectionResponse)
  )
}

function isSectionResponse(value: unknown): value is WorkLogSectionResponse {
  if (typeof value !== 'object' || value === null) return false

  const section = value as Record<string, unknown>

  return (
    typeof section.sectionName === 'string' &&
    Array.isArray(section.answers) &&
    section.answers.every(isAnswerResponse)
  )
}

function isAnswerResponse(value: unknown): value is WorkLogAnswerResponse {
  if (typeof value !== 'object' || value === null) return false

  const answer = value as Record<string, unknown>

  return (
    Number.isInteger(answer.questionId) &&
    typeof answer.question === 'string' &&
    typeof answer.questionType === 'string' &&
    Array.isArray(answer.options) &&
    answer.options.every(isAnswerOption)
  )
}

// 보기 배열만 확인하면 null 이나 필드가 빠진 항목이 그대로 시트로 흘러간다.
function isAnswerOption(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false

  const option = value as Record<string, unknown>

  return (
    Number.isInteger(option.optionId) &&
    Number.isInteger(option.number) &&
    typeof option.content === 'string' &&
    typeof option.etcOption === 'boolean' &&
    (option.etcText === null || typeof option.etcText === 'string')
  )
}

function isWorkLogTemplateDetailResponse(
  value: unknown,
): value is WorkLogTemplateDetailResponse {
  if (typeof value !== 'object' || value === null) return false

  const detail = value as Record<string, unknown>

  return (
    Number.isInteger(detail.templateId) &&
    typeof detail.templateTitle === 'string' &&
    Array.isArray(detail.questions) &&
    detail.questions.every(isTemplateQuestion)
  )
}

function isTemplateQuestion(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false

  const question = value as Record<string, unknown>

  return (
    Number.isInteger(question.questionId) &&
    typeof question.question === 'string' &&
    typeof question.questionType === 'string' &&
    Array.isArray(question.options) &&
    question.options.every(isTemplateOption)
  )
}

function isTemplateOption(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false

  const option = value as Record<string, unknown>

  return (
    Number.isInteger(option.optionId) &&
    Number.isInteger(option.number) &&
    typeof option.content === 'string' &&
    typeof option.etcOption === 'boolean'
  )
}

function isMessageResponse(value: unknown): value is WorkLogMessageResponse {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as Record<string, unknown>).message === 'string'
}
