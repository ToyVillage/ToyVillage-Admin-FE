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
// 선택지를 갖는 유형은 비어 있는 채로 두지 않고 빈 선택지 하나로 시작한다.
export function changeQuestionType(
  question: WorkLogFormDraftQuestion,
  type: WorkLogFormEditorType,
): WorkLogFormDraftQuestion {
  if (!hasOptions(type)) return { ...question, type, options: [] }

  const options =
    question.options.length > 0 ? question.options : [createDraftOption(false)]
  return { ...question, type, options }
}

// `기타:` 행은 항상 일반 선택지 아래에 둔다. 새 선택지는 기타 앞에 끼워 넣는다.
export function addQuestionOption(
  question: WorkLogFormDraftQuestion,
  isEtc: boolean,
): WorkLogFormDraftQuestion {
  const option = createDraftOption(isEtc)
  if (isEtc) return { ...question, options: [...question.options, option] }

  const etcIndex = question.options.findIndex((item) => item.isEtc)
  if (etcIndex === -1) {
    return { ...question, options: [...question.options, option] }
  }

  const options = [...question.options]
  options.splice(etcIndex, 0, option)
  return { ...question, options }
}

export function validateDraft(draft: WorkLogFormDraft): WorkLogFormDraftErrors {
  const questions: Record<string, string> = {}

  for (const question of draft.questions) {
    if (isQuestionInvalid(question)) questions[question.id] = questionErrorMessage
  }

  return {
    name: draft.name.trim() ? undefined : formNameErrorMessage,
    // 항목이 하나도 없는 양식은 만들 수 없다.
    emptyQuestions: draft.questions.length === 0 ? questionErrorMessage : undefined,
    questions,
  }
}

export function hasDraftErrors(errors: WorkLogFormDraftErrors): boolean {
  return (
    Boolean(errors.name) ||
    Boolean(errors.emptyQuestions) ||
    Object.keys(errors.questions).length > 0
  )
}

export function isQuestionInvalid(question: WorkLogFormDraftQuestion): boolean {
  if (!question.label.trim()) return true
  if (question.type === null) return true
  if (!hasOptions(question.type)) return false

  // `기타:` 행은 값을 입력받지 않으므로(응답자가 적는 자리) 검증 대상이 아니다.
  const filled = question.options.filter((option) => !option.isEtc)
  return filled.length === 0 || filled.some((option) => !option.value.trim())
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
