import type { IndividualSex } from '@/entities/individual'
import type { PhotoValue } from '@/shared/ui'

export interface IndividualFormValues {
  /** 입력 원문(검증·제출 시 trim) */
  name: string
  /** 미선택 = null */
  sex: IndividualSex | null
  /** 숫자 0~4자리 원문 */
  birthYear: string
  note: string
  photo: PhotoValue | null
}

/** 카드 아래 인라인 오류 줄 문구(카드 순서). */
export type IndividualFormErrors = Partial<
  Record<'name' | 'sex' | 'birthYear' | 'photo', string>
>
