import type { TaxonGroup } from './types'

// 탭·분류군 셀·폼 pill 이 쓴다. 순서는 `taxonGroups`(포유류 → 파충류 → 조류 → 어류)를 따른다.
export const taxonGroupLabels: Record<TaxonGroup, string> = {
  MAMMALS: '포유류',
  REPTILES: '파충류',
  BIRDS: '조류',
  FISH: '어류',
}

// 종 폼 법정지정분류 기본 선택지. 서버 공용 목록에 없으면 저장할 때 만든다.
export const legalDesignationPresets = [
  '지정관리 야생동물',
  '멸종위기 야생생물 I급',
  '천연기념물',
] as const
