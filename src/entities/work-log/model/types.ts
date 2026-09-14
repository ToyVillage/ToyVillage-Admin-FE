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

// --- 양식 생성·수정 (Figma 353:13063) --------------------------------------

// 유형 드롭다운(Figma 1:3797)의 4개 항목. 순서도 Figma 와 같다.
// 2026-09-14 디자인 개정에서 `단답형`·`장문형` 이 `주관식` 하나로 합쳐졌다.
// 양식 상세(`workLogFormQuestionTypes`)의 CHOICE/CHECKBOX/TEXT 와 같은 체계에 `FILE` 이 더해진 꼴이다.
export const workLogFormEditorTypes = [
  'TEXT',
  'CHOICE',
  'CHECKBOX',
  'FILE',
] as const
export type WorkLogFormEditorType = (typeof workLogFormEditorTypes)[number]

// 선택지 한 줄. `기타:` 행은 라벨이 고정이고 값만 입력받는다(Figma 1:4467).
export interface WorkLogFormDraftOption {
  id: string
  value: string
  isEtc: boolean
}

// 편집 중인 질문 항목. 유형 미선택은 `null`(트리거에 `선택`이 보이는 상태).
export interface WorkLogFormDraftQuestion {
  id: string
  label: string
  type: WorkLogFormEditorType | null
  options: WorkLogFormDraftOption[]
}

// 설정된 구역 칩 하나. `persisted` 는 이미 저장되어 있던 구역인지(수정 화면의 삭제 확인 기준).
export interface WorkLogFormZone {
  id: string
  label: string
  persisted: boolean
}

export interface WorkLogFormDraft {
  name: string
  questions: WorkLogFormDraftQuestion[]
  zones: WorkLogFormZone[]
}

// 검증 결과. 값이 있으면 그 자리에 빨간 테두리와 메시지를 붙인다(Figma 1:3981).
export interface WorkLogFormDraftErrors {
  name?: string
  questions: Record<string, string>
}
