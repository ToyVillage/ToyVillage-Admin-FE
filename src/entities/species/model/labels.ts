import type { TaxonGroup } from './types'

// 탭·분류군 셀·폼 pill 이 쓴다. 순서는 `taxonGroups`(포유류 → 파충류 → 조류 → 어류)를 따른다.
export const taxonGroupLabels: Record<TaxonGroup, string> = {
  MAMMAL: '포유류',
  REPTILE: '파충류',
  BIRD: '조류',
  FISH: '어류',
}

// 종 폼 법정지정분류 기본 선택지. 직접 추가한 항목은 그 종의 값으로만 저장한다.
export const legalDesignationPresets = [
  '지정관리 야생동물',
  '멸종위기 야생생물 I급',
  '천연기념물',
] as const
