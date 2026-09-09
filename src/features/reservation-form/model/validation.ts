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

// 시간 필드는 12시간제 raw 자릿수 "HHMM"만 유효하다: 시 01–12, 분 00–59.
// (예: "9900"·"1360"·자릿수 부족은 거부해 잘못된 값이 API 요청에 실리지 않게 한다.)
function isValidClock12(rawDigits: string): boolean {
  const digits = rawDigits.replace(/\D/g, '')
  if (digits.length !== 4) return false
  const hour = Number(digits.slice(0, 2))
  const minute = Number(digits.slice(2, 4))
  return hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59
}

export function validateReservationForm(
  value: ReservationFormValue,
): ReservationFormErrors {
  const errors: ReservationFormErrors = {}
  for (const { key, kind } of requiredFields) {
    if (!value[key].trim()) {
      errors[key] = messageByKind[kind]
      continue
    }
    // 채워졌더라도 12시간제 형식(시 01–12, 분 00–59)이 아니면 거부한다.
    if (kind === 'time' && !isValidClock12(value[key])) {
      errors[key] = '시간을 확인해주세요!'
    }
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
