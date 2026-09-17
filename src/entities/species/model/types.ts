export const taxonGroups = ['MAMMALS', 'REPTILES', 'BIRDS', 'FISH'] as const
export type TaxonGroup = (typeof taxonGroups)[number]

/** 대표 사진 1장. 저장소 파일 규약 `{ fileName, fileKey }` 에 표시용 `url` 을 더한다. */
export interface Photo {
  fileName: string
  fileKey: string
  url: string
}

/** 목록 응답으로 채울 수 있는 필드만. 상세 전용 필드는 `Species` 에 있다. */
export interface SpeciesListItem {
  id: string
  koreanName: string
  scientificName: string
  taxonGroup: TaxonGroup
  photo: Photo
  /** 마리수 — 서버가 개체 수로 센다. */
  individualCount: number
}

export interface Species extends SpeciesListItem {
  englishName: string
  /** 서버 값을 그대로 쓴다(`설치목 - 천축서과` 권장). 없으면 생략한다. */
  subClassification?: string
  /** 선택된 법정지정분류 이름, 저장 순서. 공용 목록에서 삭제된 분류도 이름으로 남는다. */
  legalDesignations: string[]
}

/** 사진은 새 파일(생성·교체)이거나 저장된 사진 유지(수정)다. 종·개체 폼이 같은 형태를 쓴다. */
export type PhotoInput =
  { kind: 'new'; file: File } | { kind: 'existing'; photo: Photo }

/** 법정지정분류 공용 목록 항목 */
export interface LegalStatus {
  id: number
  name: string
}

export interface CreateSpeciesInput {
  koreanName: string
  englishName: string
  scientificName: string
  taxonGroup: TaxonGroup
  /** 빈 값이면 생략한다. */
  subClassification?: string
  /** 선택된 법정지정분류 이름, 화면 순서. 저장할 때 id 로 바꾼다. */
  legalDesignations: string[]
  photo: PhotoInput
}

export type UpdateSpeciesInput = CreateSpeciesInput
