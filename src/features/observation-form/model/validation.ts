import type { ObservationFormErrors, ObservationFormValues } from './types'

// 제출 때만 전체를 검증한다(reservation-form 패턴). 공백만 입력한 값은 빈 값이다.
export function validateObservationForm(
  values: ObservationFormValues,
): ObservationFormErrors {
  const errors: ObservationFormErrors = {}

  if (!values.title.trim()) {
    errors.title = '제목을 입력해주세요!'
  }
  if (!values.content.trim()) {
    errors.content = '관찰사항을 입력해주세요!'
  }

  return errors
}
