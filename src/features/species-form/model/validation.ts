import type { SpeciesFormErrors, SpeciesFormValues } from './types'

// 제출 때만 전체를 검증한다(reservation-form 패턴). 분류군은 기본값이 있고
// 세부 분류·법정지정분류는 선택 입력이라 오류가 없다.
export function validateSpeciesForm(
  values: SpeciesFormValues,
): SpeciesFormErrors {
  const errors: SpeciesFormErrors = {}

  if (!values.koreanName.trim()) {
    errors.koreanName = '국명을 입력해주세요!'
  }
  if (!values.englishName.trim() || !values.scientificName.trim()) {
    errors.englishScientificName = '영문명과 학명을 모두 입력해주세요!'
  }
  if (!values.photo) {
    errors.photo = '사진을 등록해주세요!'
  }

  return errors
}
