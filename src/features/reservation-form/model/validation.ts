import type { ReservationFormErrors, ReservationFormValue } from './types'

type FieldKind = 'text' | 'date' | 'time'

// 필수 필드와 종류(에러 문구 분기). am/pm은 기본값이 있어 필수에서 제외.
const requiredFields: { key: keyof ReservationFormValue; kind: FieldKind }[] = [
  { key: 'groupName', kind: 'text' },
  { key: 'region', kind: 'text' },
  { key: 'counselDate', kind: 'date' },
  { key: 'reserverName', kind: 'text' },
  { key: 'representativeContact', kind: 'text' },
  { key: 'headcount', kind: 'text' },
  { key: 'guideCount', kind: 'text' },
  { key: 'admissionFee', kind: 'text' },
  { key: 'visitDate', kind: 'date' },
  { key: 'visitTime', kind: 'time' },
  { key: 'exitTime', kind: 'time' },
  { key: 'surveyCount', kind: 'text' },
  { key: 'surveyDate', kind: 'date' },
  { key: 'surveyEnterTime', kind: 'time' },
  { key: 'surveyExitTime', kind: 'time' },
]

const messageByKind: Record<FieldKind, string> = {
  text: '내용을 입력해주세요!',
  date: '날짜를 선택해주세요!',
  time: '시간을 선택해주세요!',
}

// 섹션별 필수 키(완료 배지 판정용).
export const sectionRequiredKeys: Record<
  'counsel' | 'visit' | 'survey',
  (keyof ReservationFormValue)[]
> = {
  counsel: ['groupName', 'region', 'counselDate', 'reserverName', 'representativeContact'],
  visit: ['headcount', 'guideCount', 'admissionFee', 'visitDate', 'visitTime', 'exitTime'],
  survey: ['surveyCount', 'surveyDate', 'surveyEnterTime', 'surveyExitTime'],
}

export function validateReservationForm(
  value: ReservationFormValue,
): ReservationFormErrors {
  const errors: ReservationFormErrors = {}
  for (const { key, kind } of requiredFields) {
    if (!value[key].trim()) errors[key] = messageByKind[kind]
  }
  return errors
}

// 제출 시 첫 번째 에러 필드로 스크롤한다. DOM 순서가 화면 순서와 같으므로
// 문서상 첫 [data-field-error="true"] 요소가 곧 화면 맨 위 에러다.
export function scrollToFirstError() {
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>('[data-field-error="true"]')
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

// 섹션의 필수 필드가 모두 채워졌는지(완료 배지).
export function isSectionComplete(
  value: ReservationFormValue,
  section: keyof typeof sectionRequiredKeys,
): boolean {
  return sectionRequiredKeys[section].every((key) => value[key].trim().length > 0)
}
