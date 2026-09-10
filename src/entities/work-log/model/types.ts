// 작성된 업무일지 한 건. 목록 표의 `작성자`/`양식`/`날짜` 열에 대응한다.
export interface WorkLog {
  id: string
  authorName: string
  formName: string
  /** YYYY-MM-DD */
  date: string
}

// 일지 작성에 쓰이는 양식. 목록 표의 `양식`/`작성자`/`날짜` 열에 대응한다.
export interface WorkLogForm {
  id: string
  name: string
  authorName: string
  /** YYYY-MM-DD */
  date: string
}

// 조회날짜 필터. 년/월/일 셀렉트 3개가 함께 움직인다.
export interface WorkLogDate {
  year: number
  /** 1-12 */
  month: number
  /** 1-31 */
  day: number
}

// 일지 시트의 열 = 양식의 질문 하나. 유형에 따라 셀 표기가 달라진다(Figma 541:14081).
export const workLogQuestionTypes = [
  'SHORT_TEXT',
  'LONG_TEXT',
  'CHOICE',
  'CHECKBOX',
  'DROPDOWN',
  'FILE',
] as const
export type WorkLogQuestionType = (typeof workLogQuestionTypes)[number]

export interface WorkLogSheetColumn {
  id: string
  label: string
  type: WorkLogQuestionType
}

export interface WorkLogSheetRow {
  /** `설정된 구역` 열의 값. 행 하나가 구역 하나에 대응한다. */
  zone: string
  /** 질문 id → 답변. CHECKBOX 는 배열, 답변이 없으면 null. */
  values: Record<string, string | string[] | null>
}

export interface WorkLogDetail {
  id: string
  /** YYYY-MM-DD */
  date: string
  formName: string
  authorName: string
  columns: WorkLogSheetColumn[]
  rows: WorkLogSheetRow[]
}

// 양식 상세에 나오는 질문 유형(Figma 547:14084). 시트 열 유형과 체계가 다르다 — spec 비고 참고.
export const workLogFormQuestionTypes = ['CHOICE', 'CHECKBOX', 'TEXT'] as const
export type WorkLogFormQuestionType = (typeof workLogFormQuestionTypes)[number]

export interface WorkLogFormQuestion {
  id: string
  label: string
  type: WorkLogFormQuestionType
  required: boolean
  /** CHOICE·CHECKBOX 의 선택지. TEXT 에는 없다. */
  options?: string[]
}

export interface WorkLogFormDetail {
  id: string
  name: string
  questions: WorkLogFormQuestion[]
}
