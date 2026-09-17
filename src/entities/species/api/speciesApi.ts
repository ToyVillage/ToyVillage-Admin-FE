import { api } from '@/shared/api/axios'
import { storedFileUrl } from '@/shared/api/fileStorage'
import type { Photo, Species, SpeciesListItem } from '../model/types'
import {
  assertPageRequest,
  assertPositiveId,
  expectStatus,
  isFileResponse,
  isMessageResponse,
  isRecord,
  isTaxonGroup,
} from './guards'
import type {
  AnimalKindCreateRequest,
  AnimalKindImageResponse,
  AnimalKindLegalStatusResponse,
  AnimalKindQueryAllRequest,
  AnimalKindQueryAllResponse,
  AnimalKindQueryAllResponseItem,
  AnimalKindQueryResponse,
  AnimalKindUpdateRequest,
  AnimalMessageResponse,
} from './types'

export interface SpeciesListPage {
  items: SpeciesListItem[]
  /** 총 페이지 수 */
  totalPageSize: number
}

export async function getSpeciesList({
  animalTaxonomic,
  keyword,
  page,
  size,
}: AnimalKindQueryAllRequest): Promise<SpeciesListPage> {
  assertPageRequest(page, size, '종 목록')

  // sort 는 보내지 않는다(정렬 제거, 2026-09-16 개발자 결정).
  const params = {
    page,
    size,
    ...(animalTaxonomic ? { animalTaxonomic } : {}),
    ...(keyword ? { keyword } : {}),
  }
  const { data } = await api.get<unknown>('/animal-manage/kind', { params })

  if (!isAnimalKindQueryAllResponse(data)) {
    throw new Error('종 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    items: data.animalKinds.map((kind) => ({
      id: String(kind.animalKindId),
      koreanName: kind.kindName,
      scientificName: kind.scientificName,
      taxonGroup: kind.animalTaxonomic,
      photo: toPhoto(kind.kindImage),
      individualCount: kind.animalCount,
    })),
    totalPageSize: data.totalPageSize,
  }
}

export async function getSpecies({
  animalKindId,
}: {
  animalKindId: number
}): Promise<Species> {
  assertPositiveId(animalKindId, '종 ID가 올바르지 않습니다.')

  const { data } = await api.get<unknown>(`/animal-manage/kind/${animalKindId}`)

  if (!isAnimalKindQueryResponse(data)) {
    throw new Error('종 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    id: String(data.animalKindId),
    koreanName: data.kindName,
    englishName: data.engName,
    scientificName: data.scientificName,
    taxonGroup: data.animalTaxonomic,
    ...(data.detailKind ? { subClassification: data.detailKind } : {}),
    legalDesignations: data.legalStatuses.map(toLegalStatusName),
    photo: toPhoto(data.kindImage),
    individualCount: data.animalCount,
  }
}

export async function createSpecies(
  request: AnimalKindCreateRequest,
): Promise<AnimalMessageResponse> {
  const { data, status } = await api.post<unknown>(
    '/animal-manage/kind',
    request,
  )

  expectStatus(status, 201, '종 생성')
  if (!isMessageResponse(data)) {
    throw new Error('종 생성 응답 형식이 올바르지 않습니다.')
  }

  return data
}

export async function updateSpecies({
  animalKindId,
  request,
}: {
  animalKindId: number
  request: AnimalKindUpdateRequest
}): Promise<AnimalMessageResponse> {
  assertPositiveId(animalKindId, '종 수정 요청 ID가 올바르지 않습니다.')

  const { data, status } = await api.patch<unknown>(
    `/animal-manage/kind/${animalKindId}`,
    request,
  )

  expectStatus(status, 200, '종 수정')
  if (!isMessageResponse(data)) {
    throw new Error('종 수정 응답 형식이 올바르지 않습니다.')
  }

  return data
}

/** 그 종의 개체·관찰 기록도 함께 삭제된다. */
export async function deleteSpecies({
  animalKindId,
}: {
  animalKindId: number
}): Promise<AnimalMessageResponse> {
  assertPositiveId(animalKindId, '종 삭제 요청 ID가 올바르지 않습니다.')

  const { data, status } = await api.delete<unknown>(
    `/animal-manage/kind/${animalKindId}`,
  )

  expectStatus(status, 200, '종 삭제')
  if (!isMessageResponse(data)) {
    throw new Error('종 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

export function toPhoto({ fileName, fileKey }: AnimalKindImageResponse): Photo {
  return { fileName, fileKey, url: storedFileUrl(fileKey) }
}

function toLegalStatusName(value: AnimalKindLegalStatusResponse | string) {
  return typeof value === 'string' ? value : value.kind
}

function isAnimalKindQueryAllResponse(
  value: unknown,
): value is AnimalKindQueryAllResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.animalKinds) &&
    value.animalKinds.every(isAnimalKindQueryAllResponseItem) &&
    Number.isInteger(value.totalPageSize)
  )
}

function isAnimalKindQueryAllResponseItem(
  value: unknown,
): value is AnimalKindQueryAllResponseItem {
  return (
    isRecord(value) &&
    Number.isInteger(value.animalKindId) &&
    isTaxonGroup(value.animalTaxonomic) &&
    typeof value.kindName === 'string' &&
    typeof value.scientificName === 'string' &&
    Number.isInteger(value.animalCount) &&
    isFileResponse(value.kindImage)
  )
}

function isAnimalKindQueryResponse(
  value: unknown,
): value is AnimalKindQueryResponse {
  return (
    isRecord(value) &&
    Number.isInteger(value.animalKindId) &&
    typeof value.kindName === 'string' &&
    typeof value.engName === 'string' &&
    typeof value.scientificName === 'string' &&
    isTaxonGroup(value.animalTaxonomic) &&
    (value.detailKind === null || typeof value.detailKind === 'string') &&
    Array.isArray(value.legalStatuses) &&
    value.legalStatuses.every(isKindLegalStatus) &&
    Number.isInteger(value.animalCount) &&
    isFileResponse(value.kindImage)
  )
}

// BE PR #162 이전 서버는 이름 문자열만 준다. 배포 전 스테이징에서도 화면이 뜨도록 둘 다 받는다.
function isKindLegalStatus(
  value: unknown,
): value is AnimalKindLegalStatusResponse | string {
  if (typeof value === 'string') return true

  return (
    isRecord(value) &&
    (value.animalLegalStatusId === null ||
      Number.isInteger(value.animalLegalStatusId)) &&
    typeof value.kind === 'string'
  )
}
