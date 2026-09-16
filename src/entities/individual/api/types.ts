import type { TaxonGroup } from '@/entities/species'
import type { IndividualSex } from '../model/types'

export interface AnimalManageQueryAllRequest {
  animalKindId: number
  /** 빈 값이면 보내지 않는다. */
  keyword?: string
  /** 1부터 시작한다. */
  page: number
  size: number
}

export interface AnimalManageQueryAllResponseItem {
  animalManageId: number
  animalName: string
  animalGender: IndividualSex
  birthYear: number
}

export interface AnimalManageQueryResponse {
  animalManageId: number
  animalName: string
  animalGender: IndividualSex
  birthYear: number
  otherInfo: string | null
  animalImage: { fileName: string; fileKey: string }
  animalKindId: number
  kindName: string
  scientificName: string
  animalTaxonomic: TaxonGroup
  detailKind: string | null
}

export interface AnimalManageCreateRequest {
  animalKindId: number
  animalName: string
  animalGender: IndividualSex
  birthYear: number
  /** 빈 값이면 생략한다. */
  otherInfo?: string
  fileKey: string
}

/** 전체를 다시 보낸다. */
export type AnimalManageUpdateRequest = AnimalManageCreateRequest
