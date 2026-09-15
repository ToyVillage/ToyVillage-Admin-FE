import type { TaxonGroup } from '@/entities/species'
import type { PhotoValue } from '@/shared/ui'

export interface SpeciesFormValues {
  koreanName: string
  englishName: string
  scientificName: string
  /** 진입 기본값 `MAMMAL`(포유류) */
  taxonGroup: TaxonGroup
  subClassification: string
  /** 선택된 법정지정분류, 화면 순서(기본 선택지 → 직접 추가 항목) */
  legalDesignations: string[]
  photo: PhotoValue | null
}

/** 카드 아래 인라인 오류 줄 문구. 영문명·학명은 한 줄을 함께 쓴다. */
export type SpeciesFormErrors = Partial<
  Record<'koreanName' | 'englishScientificName' | 'photo', string>
>
