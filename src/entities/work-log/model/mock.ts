import { toIsoDate, todayWorkLogDate } from './date'
import type { WorkLog, WorkLogForm } from './types'

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
  return mockWorkLogs.filter(
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

