import type { TaxonGroup } from './types'

// 탭·분류군 셀·폼 pill 이 쓴다. 순서는 `taxonGroups`(포유류 → 파충류 → 조류 → 어류)를 따른다.
export const taxonGroupLabels: Record<TaxonGroup, string> = {
  MAMMALS: '포유류',
  REPTILES: '파충류',
  BIRDS: '조류',
  FISH: '어류',
}
