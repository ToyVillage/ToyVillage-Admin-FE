// Notion API 명세서(카테고리 `업무일지`) 중 ADMIN 권한이 있는 7개 API 의 요청·응답 스키마.
// 런타임 값은 신뢰하지 않고 `unknown` 으로 받은 뒤 workLogApi 에서 검증한다.

/** 서버 공통 페이지 응답(Spring Page). 화면이 쓰는 필드만 선언한다. */
export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
}

/** WORK_LOG_QUERY_ALL — `GET /work-log` 의 content 항목 */
export interface WorkLogListItemResponse {
  workLogId: number
  /** 작성자 이름(로그인 아이디가 아니다) */
  writer: string
  /** YYYY-MM-DD */
  writeAt: string
  templateTitle: string
}

/** 명세의 질문 유형. 양식 생성 요청과 조회 응답이 같은 값을 쓴다. */
export const workLogServerQuestionTypes = [
  'TEXT',
  'MULTIPLE_CHOICE',
  'CHECK_BOX',
  'FILE_UPLOAD',
] as const
export type WorkLogServerQuestionType =
  (typeof workLogServerQuestionTypes)[number]

export interface WorkLogAnswerOptionResponse {
  optionId: number
  number: number
  content: string
  etcOption: boolean
  /** 기타 보기를 고른 경우 직접 입력한 값. 기타가 아니면 null. */
  etcText: string | null
}

export interface WorkLogAnswerFileResponse {
  fileName: string
  fileKey: string
}

export interface WorkLogAnswerResponse {
  questionId: number
  question: string
  questionType: string
  answerText: string | null
  options: WorkLogAnswerOptionResponse[]
  file: WorkLogAnswerFileResponse | null
}

export interface WorkLogSectionResponse {
  sectionId: number
  sectionName: string
  answers: WorkLogAnswerResponse[]
}

/** WORK_LOG_QUERY — `GET /work-log/{workLogId}` */
export interface WorkLogDetailResponse {
  workLogId: number
  templateId: number
  templateTitle: string
  writerName: string
  /** YYYY-MM-DD */
  writeAt: string
  sections: WorkLogSectionResponse[]
}

/** WORK_LOG_TEMPLATE_QUERY_ALL — `GET /work-log/template` 의 content 항목 */
export interface WorkLogTemplateListItemResponse {
  templateId: number
  templateTitle: string
  /** YYYY-MM-DD */
  createdAt: string
}

export interface WorkLogTemplateSectionResponse {
  sectionId: number
  sectionName: string
}

export interface WorkLogTemplateOptionResponse {
  optionId: number
  number: number
  content: string
  etcOption: boolean
}

export interface WorkLogTemplateQuestionResponse {
  questionId: number
  question: string
  questionType: string
  options: WorkLogTemplateOptionResponse[]
}

/** WORK_LOG_TEMPLATE_QUERY — `GET /work-log/template/{workLogTemplateId}` */
export interface WorkLogTemplateDetailResponse {
  templateId: number
  templateTitle: string
  sections: WorkLogTemplateSectionResponse[]
  questions: WorkLogTemplateQuestionResponse[]
}

/** WORK_LOG_TEMPLATE_CREATE — `POST /work-log/template` 요청 바디 */
export interface WorkLogTemplateCreateRequest {
  templateTitle: string
  /** 배열 순서가 구역 정렬 순서(sectionOrder)가 된다. */
  sections: string[]
  questions: WorkLogTemplateCreateQuestion[]
}

export interface WorkLogTemplateCreateQuestion {
  question: string
  questionType: WorkLogServerQuestionType
  options: WorkLogTemplateCreateOption[]
}

export interface WorkLogTemplateCreateOption {
  content: string
  etcOption: boolean
}

export interface WorkLogMessageResponse {
  message: string
}

export interface WorkLogQueryAllRequest {
  /** YYYY-MM-DD */
  date: string
  /** 0부터 시작한다(명세). */
  page: number
  size: number
}

export interface WorkLogQueryRequest {
  workLogId: number
}

export interface WorkLogTemplateQueryAllRequest {
  /** 보내면 그 날짜에 생성된 양식만 조회한다. */
  date?: string
  page: number
  size: number
}

export interface WorkLogTemplateQueryRequest {
  workLogTemplateId: number
}
