import type { TaxonGroup } from '../model/types'

export interface AnimalKindImageResponse {
  fileName: string
  fileKey: string
}

export interface AnimalKindQueryAllRequest {
  /** `전체` 탭은 보내지 않는다. */
  animalTaxonomic?: TaxonGroup
  /** 빈 값이면 보내지 않는다. */
  keyword?: string
  /** 1부터 시작한다(2026-09-16 개발자 확정). */
  page: number
  size: number
}

export interface AnimalKindQueryAllResponseItem {
  animalKindId: number
  animalTaxonomic: TaxonGroup
  kindName: string
  scientificName: string
  animalCount: number
  kindImage: AnimalKindImageResponse
}

export interface AnimalKindQueryAllResponse {
  animalKinds: AnimalKindQueryAllResponseItem[]
  /** 총 페이지 수 */
  totalPageSize: number
}

export interface AnimalKindLegalStatusResponse {
  /** 공용 목록에서 삭제된 분류는 null (BE PR #162) */
  animalLegalStatusId: number | null
  kind: string
}

export interface AnimalKindQueryResponse {
  animalKindId: number
  kindName: string
  engName: string
  scientificName: string
  animalTaxonomic: TaxonGroup
  detailKind: string | null
  legalStatuses: AnimalKindLegalStatusResponse[]
  animalCount: number
  kindImage: AnimalKindImageResponse
}

export interface AnimalKindCreateRequest {
  animalName: string
  animalEngName: string
  animalScientificName: string
  animalTaxonomic: TaxonGroup
  fileKey: string
  /** 빈 값이면 생략한다. */
  animalDetailKind?: string
  /** 법정지정분류 id. 선택이 없으면 생략한다. */
  animalLegalDesignation?: number[]
}

/** 전체를 다시 보낸다. 세부 분류는 null, 법정지정분류는 [] 로 비운다. */
export interface AnimalKindUpdateRequest {
  animalName: string
  animalEngName: string
  animalScientificName: string
  animalTaxonomic: TaxonGroup
  fileKey: string
  animalDetailKind: string | null
  animalLegalDesignation: number[]
}

export interface AnimalMessageResponse {
  message: string
}

export interface AnimalLegalStatusResponse {
  animalLegalStatusId: number
  kind: string
}

export interface AnimalLegalStatusCreateRequest {
  kind: string
}
