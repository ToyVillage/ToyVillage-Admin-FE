import { toIsoDate, todayWorkLogDate } from './date'
import type {
  WorkLog,
  WorkLogDetail,
  WorkLogForm,
  WorkLogFormDetail,
  WorkLogFormQuestion,
  WorkLogSheetColumn,
  WorkLogSheetRow,
} from './types'

export const deletedWorkLogStorageKey = 'toyvillage:work-logs:deleted'
export const deletedWorkLogFormStorageKey = 'toyvillage:work-log-forms:deleted'

// Figma `1:3417` 의 행 값. 페이지네이션(1·2·3)이 재현되도록 9건을 오늘 날짜로 둔다.
const figmaLogRows = [
  { authorName: '김수인', formName: '마감일지' },
  { authorName: '이승현', formName: '사육장점검일지' },
  { authorName: '김수인', formName: '마감일지' },
  { authorName: '김수인', formName: '마감일지' },
  { authorName: '이승현', formName: '사육장점검일지' },
  { authorName: '박지호', formName: '마감일지' },
  { authorName: '김수인', formName: '사육장점검일지' },
  { authorName: '이승현', formName: '마감일지' },
  { authorName: '박지호', formName: '사육장점검일지' },
]

// 슬라이스용 mock. 추후 TanStack Query + Axios로 대체.
// 기본 진입(오늘)에서 Figma 와 같은 목록이 보이도록 오늘 날짜로 생성한다.
export const mockWorkLogs: WorkLog[] = figmaLogRows.map((row, index) => ({
  id: `wl-${index + 1}`,
  authorName: row.authorName,
  formName: row.formName,
  date: toIsoDate(todayWorkLogDate()),
}))

// Figma `479:14386` 의 양식 행 값. 양식은 조회날짜에 종속되지 않는다(spec).
export const mockWorkLogForms: WorkLogForm[] = Array.from(
  { length: 9 },
  (_, index) => ({
    id: `wlf-${index + 1}`,
    name: '그냥 양식 제목',
    authorName: '관리자',
    date: '2026-07-03',
  }),
)

export async function getMockWorkLogs(isoDate: string): Promise<WorkLog[]> {
  const deletedIds = readDeletedIds(deletedWorkLogStorageKey)
  return [...mockWorkLogs, emptyWorkLog].filter(
    (log) => log.date === isoDate && !deletedIds.has(log.id),
  )
}

export async function getMockWorkLogForms(): Promise<WorkLogForm[]> {
  const deletedIds = readDeletedIds(deletedWorkLogFormStorageKey)
  return mockWorkLogForms.filter((form) => !deletedIds.has(form.id))
}

export async function deleteMockWorkLog(id: string): Promise<void> {
  addDeletedId(deletedWorkLogStorageKey, id)
}

export async function deleteMockWorkLogForm(id: string): Promise<void> {
  addDeletedId(deletedWorkLogFormStorageKey, id)
}

function addDeletedId(storageKey: string, id: string): void {
  const deletedIds = readDeletedIds(storageKey)
  deletedIds.add(id)
  localStorage.setItem(storageKey, JSON.stringify([...deletedIds]))
}

function readDeletedIds(storageKey: string): Set<string> {
  const rawIds = localStorage.getItem(storageKey)
  if (!rawIds) return new Set()

  try {
    const ids: unknown = JSON.parse(rawIds)
    return new Set(
      Array.isArray(ids)
        ? ids.filter((id): id is string => typeof id === 'string')
        : [],
    )
  } catch {
    return new Set()
  }
}

// --- 상세 mock -------------------------------------------------------------

const longAnswer = '락스를 뿌리고 솔로 빡빡 닦았습니다. 정말 힘들엇어요'

// Figma 541:14081 — 질문 유형이 모두 나오는 시트.
const allTypeColumns: WorkLogSheetColumn[] = [
  { id: 'q-temp', label: '온도', type: 'SHORT_TEXT' },
  { id: 'q-method', label: '청소방법이 뭔가요?', type: 'LONG_TEXT' },
  { id: 'q-humidity', label: '습도', type: 'CHOICE' },
  { id: 'q-cleaned', label: '청소여부', type: 'CHECKBOX' },
  { id: 'q-amount', label: '급여량', type: 'DROPDOWN' },
  { id: 'q-photo', label: '사진', type: 'FILE' },
]

const allTypeRows: WorkLogSheetRow[] = [
  {
    zone: 'A1',
    values: {
      'q-temp': '20°',
      'q-method': longAnswer,
      'q-humidity': '1212%',
      'q-cleaned': ['함'],
      'q-amount': '20°',
      'q-photo': null,
    },
  },
  {
    zone: 'A2',
    values: {
      'q-temp': '20°',
      'q-method': longAnswer,
      'q-humidity': '1212%',
      'q-cleaned': ['함', '20°'],
      'q-amount': '20°',
      'q-photo': null,
    },
  },
  {
    zone: 'A3',
    values: {
      'q-temp': '20°',
      'q-method': longAnswer,
      'q-humidity': '1212%',
      'q-cleaned': ['함', '20°', '함'],
      'q-amount': '20°',
      'q-photo': null,
    },
  },
]

// Figma 1:5694 — 질문 4개짜리 시트.
const basicColumns: WorkLogSheetColumn[] = [
  { id: 'q-temp', label: '온도', type: 'SHORT_TEXT' },
  { id: 'q-humidity', label: '습도', type: 'SHORT_TEXT' },
  { id: 'q-cleaned', label: '청소여부', type: 'SHORT_TEXT' },
  { id: 'q-method', label: '청소방법이 뭔가요?', type: 'LONG_TEXT' },
]

const basicRows: WorkLogSheetRow[] = ['A1', 'A2', 'A3', 'A1', 'A2', 'A3'].map(
  (zone) => ({
    zone,
    values: {
      'q-temp': '20°',
      'q-humidity': '1212%',
      'q-cleaned': '함',
      'q-method': longAnswer,
    },
  }),
)

// 아직 아무 답변도 기록되지 않은 일지(Figma 516:14068). 목록에는 어제 날짜로 들어간다.
const emptyWorkLogDate = toIsoDate(shiftDays(todayWorkLogDate(), -1))

const emptyWorkLog: WorkLog = {
  id: 'wl-empty',
  authorName: '박지호',
  formName: '사육장점검일지',
  date: emptyWorkLogDate,
}

const workLogDetails: WorkLogDetail[] = [
  ...mockWorkLogs.map((log, index) => ({
    id: log.id,
    date: log.date,
    formName: log.formName,
    authorName: log.authorName,
    // 홀수 번째 일지는 유형이 모두 나오는 시트, 짝수 번째는 Figma 1:5694 시트를 쓴다.
    columns: index % 2 === 0 ? allTypeColumns : basicColumns,
    rows: index % 2 === 0 ? allTypeRows : basicRows,
  })),
  {
    id: emptyWorkLog.id,
    date: emptyWorkLog.date,
    formName: emptyWorkLog.formName,
    authorName: emptyWorkLog.authorName,
    columns: basicColumns,
    rows: basicRows.map((row) => ({
      zone: row.zone,
      values: Object.fromEntries(
        basicColumns.map((column) => [column.id, null]),
      ),
    })),
  },
]

// Figma 547:14084 의 질문 구성.
const formQuestions: WorkLogFormQuestion[] = [
  {
    id: 'fq-humidity',
    label: '습도',
    type: 'CHOICE',
    required: true,
    options: ['30%', '1212%', '1%'],
  },
  {
    id: 'fq-cleaned',
    label: '청소여부',
    type: 'CHECKBOX',
    required: true,
    options: ['모르겟음', '함', '안함'],
  },
  {
    id: 'fq-method',
    label: '청소 방법이 뭔가요?',
    type: 'TEXT',
    required: true,
  },
]

export async function getMockWorkLogDetail(
  id: string,
): Promise<WorkLogDetail | null> {
  const deletedIds = readDeletedIds(deletedWorkLogStorageKey)
  if (deletedIds.has(id)) return null

  return workLogDetails.find((detail) => detail.id === id) ?? null
}

export async function getMockWorkLogFormDetail(
  id: string,
): Promise<WorkLogFormDetail | null> {
  const deletedIds = readDeletedIds(deletedWorkLogFormStorageKey)
  if (deletedIds.has(id)) return null

  const form = mockWorkLogForms.find((item) => item.id === id)
  if (!form) return null

  return { id: form.id, name: form.name, questions: formQuestions }
}

function shiftDays(
  date: { year: number; month: number; day: number },
  days: number,
) {
  const shifted = new Date(date.year, date.month - 1, date.day + days)
  return {
    year: shifted.getFullYear(),
    month: shifted.getMonth() + 1,
    day: shifted.getDate(),
  }
}
