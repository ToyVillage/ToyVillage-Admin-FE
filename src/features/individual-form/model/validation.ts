import type { IndividualFormErrors, IndividualFormValues } from './types'

const minBirthYear = 1900

// 제출 때만 전체를 검증한다(reservation-form 패턴). 기타정보는 선택 입력이다.
export function validateIndividualForm(
  values: IndividualFormValues,
  currentYear: number,
): IndividualFormErrors {
  const errors: IndividualFormErrors = {}

  if (!values.name.trim()) {
    errors.name = '개체명을 입력해주세요!'
  }
  if (!values.sex) {
    errors.sex = '성별을 선택해주세요!'
  }
  if (!values.birthYear) {
    errors.birthYear = '출생연도를 입력해주세요!'
  } else if (!isValidBirthYear(values.birthYear, currentYear)) {
    errors.birthYear = '올바른 출생연도를 입력해주세요!'
  }
  if (!values.photo) {
    errors.photo = '사진을 등록해주세요!'
  }

  return errors
}

function isValidBirthYear(birthYear: string, currentYear: number) {
  if (!/^\d{4}$/.test(birthYear)) return false
  const year = Number(birthYear)
  return year >= minBirthYear && year <= currentYear
}
