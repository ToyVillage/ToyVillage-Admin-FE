import type {
  WorkLogFormDraft,
  WorkLogFormDraftErrors,
  WorkLogFormDraftOption,
  WorkLogFormDraftQuestion,
  WorkLogFormEditorType,
  WorkLogFormZone,
} from '@/entities/work-log'

export const formNameErrorMessage = '양식명을 입력해주세요!'
export const questionErrorMessage = '해당 항목을 입력해주세요!'

// 선택지를 갖는 유형. 나머지는 밑줄 한 줄(placeholder `텍스트`)만 보여준다.
const optionTypes: WorkLogFormEditorType[] = ['CHOICE', 'CHECKBOX']

export function hasOptions(type: WorkLogFormEditorType | null): boolean {
  return type !== null && optionTypes.includes(type)
}

export function createDraftQuestion(): WorkLogFormDraftQuestion {
  return { id: crypto.randomUUID(), label: '', type: null, options: [] }
}

export function createDraftOption(isEtc: boolean): WorkLogFormDraftOption {
  return { id: crypto.randomUUID(), value: '', isEtc }
}

// Figma 1:3710 — 생성 진입 시 빈 질문 카드 2개로 시작한다.
export function createEmptyDraft(): WorkLogFormDraft {
  return {
    name: '',
    questions: [createDraftQuestion(), createDraftQuestion()],
    zones: [],
  }
}

export function createZone(label: string, persisted: boolean): WorkLogFormZone {
  return { id: crypto.randomUUID(), label, persisted }
}

// 유형이 바뀌면 그 유형에 필요 없는 선택지는 버린다(spec 1단계 조작).
export function changeQuestionType(
  question: WorkLogFormDraftQuestion,
  type: WorkLogFormEditorType,
): WorkLogFormDraftQuestion {
  return { ...question, type, options: hasOptions(type) ? question.options : [] }
}

export function validateDraft(draft: WorkLogFormDraft): WorkLogFormDraftErrors {
  const questions: Record<string, string> = {}

  for (const question of draft.questions) {
    if (isQuestionInvalid(question)) questions[question.id] = questionErrorMessage
  }

  return {
    name: draft.name.trim() ? undefined : formNameErrorMessage,
    questions,
  }
}

export function hasDraftErrors(errors: WorkLogFormDraftErrors): boolean {
  return Boolean(errors.name) || Object.keys(errors.questions).length > 0
}

export function isQuestionInvalid(question: WorkLogFormDraftQuestion): boolean {
  if (!question.label.trim()) return true
  if (question.type === null) return true
  if (!hasOptions(question.type)) return false

  return (
    question.options.length === 0 ||
    question.options.some((option) => !option.value.trim())
  )
}

// 자동 생성 — 접두 + 시작~끝 범위. 접두 `없음` 은 숫자만 만든다(Figma 1:5438).
export function buildAutoZoneLabels(
  prefix: string,
  start: string,
  end: string,
): string[] {
  const from = Number(start)
  const to = Number(end)
  if (!Number.isInteger(from) || !Number.isInteger(to)) return []
  if (start.trim() === '' || end.trim() === '') return []
  if (from < 1 || to < from) return []

  const labels: string[] = []
  for (let number = from; number <= to; number += 1) {
    labels.push(`${prefix}${number}`)
  }
  return labels
}

// 이미 있는 값은 중복 추가하지 않고, 추가한 순서를 유지한다(spec 2단계 조작).
export function appendZones(
  zones: WorkLogFormZone[],
  labels: string[],
): WorkLogFormZone[] {
  const existing = new Set(zones.map((zone) => zone.label))
  const added: WorkLogFormZone[] = []

  for (const label of labels) {
    const trimmed = label.trim()
    if (!trimmed || existing.has(trimmed)) continue
    existing.add(trimmed)
    added.push(createZone(trimmed, false))
  }

  return added.length === 0 ? zones : [...zones, ...added]
}

// 처음 불러온 값에서 바뀌었는지(수정 화면의 나가기 확인 기준).
export function isDraftDirty(
  draft: WorkLogFormDraft,
  initial: WorkLogFormDraft,
): boolean {
  return serializeDraft(draft) !== serializeDraft(initial)
}

// 생성 화면은 "하나라도 입력했는지"만 본다(spec 뒤로가기).
export function isDraftTouched(draft: WorkLogFormDraft): boolean {
  return isDraftDirty(draft, createBlankDraftShape(draft))
}

function createBlankDraftShape(draft: WorkLogFormDraft): WorkLogFormDraft {
  return {
    name: '',
    questions: draft.questions.map((question) => ({
      ...question,
      label: '',
      type: null,
      options: [],
    })),
    zones: [],
  }
}

function serializeDraft(draft: WorkLogFormDraft): string {
  return JSON.stringify({
    name: draft.name.trim(),
    questions: draft.questions.map((question) => ({
      label: question.label.trim(),
      type: question.type,
      options: question.options.map((option) => ({
        value: option.value.trim(),
        isEtc: option.isEtc,
      })),
    })),
    zones: draft.zones.map((zone) => zone.label),
  })
}
