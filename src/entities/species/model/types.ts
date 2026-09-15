export const taxonGroups = ['MAMMAL', 'REPTILE', 'BIRD', 'FISH'] as const
export type TaxonGroup = (typeof taxonGroups)[number]

/** 대표 사진 1장. 저장소 파일 규약 `{ fileName, fileKey }` 에 표시용 `url` 을 더한다. */
export interface Photo {
  fileName: string
  fileKey: string
  url: string
}

export interface Species {
  id: string
  koreanName: string
  englishName: string
  scientificName: string
  taxonGroup: TaxonGroup
  /** `{목} - {과}` 형식 권장(예: `설치목 - 천축서과`). 형식 검사는 하지 않는다. */
  subClassification?: string
  /** 선택된 기본 선택지 + 직접 추가 항목, 저장 순서 */
  legalDesignations: string[]
  photo: Photo
  /** 마리수 — 저장하지 않고 개체 수에서 파생한다. */
  individualCount: number
}

/** 사진은 새 파일(생성·교체)이거나 저장된 사진 유지(수정)다. 종·개체 폼이 같은 형태를 쓴다. */
export type PhotoInput =
  { kind: 'new'; file: File } | { kind: 'existing'; photo: Photo }

export interface CreateSpeciesInput {
  koreanName: string
  englishName: string
  scientificName: string
  taxonGroup: TaxonGroup
  /** 빈 값이면 생략한다. */
  subClassification?: string
  legalDesignations: string[]
  photo: PhotoInput
}

export type UpdateSpeciesInput = CreateSpeciesInput
