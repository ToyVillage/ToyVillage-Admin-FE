import type { Photo, PhotoInput } from '@/entities/species'

export type { Photo, PhotoInput }

// 폼 pill 순서(암컷 → 수컷 → 미상)와 같다.
export const individualSexes = ['WOMAN', 'MAN', 'UNKNOWN'] as const
export type IndividualSex = (typeof individualSexes)[number]

/** 목록 응답으로 채울 수 있는 필드만 */
export interface IndividualListItem {
  id: string
  name: string
  sex: IndividualSex
  /** 4자리 연도, 표시 `{birthYear}년` */
  birthYear: number
}

export interface Individual extends IndividualListItem {
  speciesId: string
  /** 기타정보. 없으면 `—` 로 표시한다. */
  note?: string
  photo: Photo
}

export interface CreateIndividualInput {
  speciesId: string
  name: string
  sex: IndividualSex
  birthYear: number
  /** 빈 값이면 생략한다. */
  note?: string
  photo: PhotoInput
}

export interface UpdateIndividualInput {
  name: string
  sex: IndividualSex
  birthYear: number
  /** 빈 값이면 생략한다. */
  note?: string
  photo: PhotoInput
}
