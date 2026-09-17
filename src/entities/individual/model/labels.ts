import type { IndividualSex } from './types'

export const individualSexLabels: Record<IndividualSex, string> = {
  WOMAN: '암컷',
  MAN: '수컷',
  UNKNOWN: '미상',
}

// 라벨 앞 장식 기호. 값은 라벨 텍스트로 전달하고 기호는 `aria-hidden` 으로 둔다.
export const individualSexSymbols: Record<IndividualSex, string> = {
  WOMAN: '♀',
  MAN: '♂',
  UNKNOWN: '?',
}
