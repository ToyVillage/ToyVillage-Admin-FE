import {
  assertPageRequest,
  assertPositiveId,
  expectStatus,
  isFileResponse,
  isMessageResponse,
  isPageResponse,
  isRecord,
  toPhoto,
  type AnimalMessageResponse,
} from '@/entities/species'
import { api } from '@/shared/api/axios'
import { individualSexes } from '../model/types'
import type {
  Individual,
  IndividualListItem,
  IndividualSex,
} from '../model/types'
import type {
  AnimalManageCreateRequest,
  AnimalManageQueryAllRequest,
  AnimalManageQueryAllResponseItem,
  AnimalManageQueryResponse,
  AnimalManageUpdateRequest,
} from './types'

export interface IndividualListPage {
  items: IndividualListItem[]
  totalPages: number
  /** 검색 결과 전체 마리수 */
  totalElements: number
}

export async function getIndividuals({
  animalKindId,
  keyword,
  page,
  size,
}: AnimalManageQueryAllRequest): Promise<IndividualListPage> {
  assertPositiveId(animalKindId, '종 ID가 올바르지 않습니다.')
  assertPageRequest(page, size, '개체 목록')

  // sort 는 보내지 않는다(정렬 제거, 2026-09-16 개발자 결정).
  const params = { page, size, ...(keyword ? { keyword } : {}) }
  const { data } = await api.get<unknown>(
    `/animal-manage/kind/${animalKindId}/animal`,
    { params },
  )

  if (!isPageResponse(data, isAnimalManageQueryAllResponseItem)) {
    throw new Error('개체 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    items: data.content.map((animal) => ({
      id: String(animal.animalManageId),
      name: animal.animalName,
      sex: animal.animalGender,
      birthYear: animal.birthYear,
    })),
    totalPages: data.totalPages,
    totalElements: data.totalElements,
  }
}

export async function getIndividual({
  animalManageId,
}: {
  animalManageId: number
}): Promise<Individual> {
  assertPositiveId(animalManageId, '개체 ID가 올바르지 않습니다.')

  const { data } = await api.get<unknown>(`/animal-manage/${animalManageId}`)

  if (!isAnimalManageQueryResponse(data)) {
    throw new Error('개체 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    id: String(data.animalManageId),
    speciesId: String(data.animalKindId),
    name: data.animalName,
    sex: data.animalGender,
    birthYear: data.birthYear,
    ...(data.otherInfo ? { note: data.otherInfo } : {}),
    photo: toPhoto(data.animalImage),
  }
}

/**
 * 개체가 속한 종 id 만 뽑는다.
 *
 * `getIndividual` 은 응답 전체를 검증하면서 사진 URL 까지 만들기 때문에 파일 서버
 * 설정(`VITE_FILE_BASE_URL`)이 없으면 실패한다. 개체 상세로 가는 링크를 만드는
 * 자리에서는 종 id 하나면 충분하므로 그 의존을 두지 않는다.
 */
export async function getIndividualSpeciesId({
  animalManageId,
}: {
  animalManageId: number
}): Promise<string> {
  assertPositiveId(animalManageId, '개체 ID가 올바르지 않습니다.')

  const { data } = await api.get<unknown>(`/animal-manage/${animalManageId}`)

  if (!isRecord(data) || !Number.isInteger(data.animalKindId)) {
    throw new Error('개체 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return String(data.animalKindId)
}

export async function createIndividual(
  request: AnimalManageCreateRequest,
): Promise<AnimalMessageResponse> {
  const { data, status } = await api.post<unknown>('/animal-manage', request)

  expectStatus(status, 201, '개체 생성')
  if (!isMessageResponse(data)) {
    throw new Error('개체 생성 응답 형식이 올바르지 않습니다.')
  }

  return data
}

export async function updateIndividual({
  animalManageId,
  request,
}: {
  animalManageId: number
  request: AnimalManageUpdateRequest
}): Promise<AnimalMessageResponse> {
  assertPositiveId(animalManageId, '개체 수정 요청 ID가 올바르지 않습니다.')

  const { data, status } = await api.patch<unknown>(
    `/animal-manage/${animalManageId}`,
    request,
  )

  expectStatus(status, 200, '개체 수정')
  if (!isMessageResponse(data)) {
    throw new Error('개체 수정 응답 형식이 올바르지 않습니다.')
  }

  return data
}

/** 그 개체의 관찰 기록도 함께 삭제된다. */
export async function deleteIndividual({
  animalManageId,
}: {
  animalManageId: number
}): Promise<AnimalMessageResponse> {
  assertPositiveId(animalManageId, '개체 삭제 요청 ID가 올바르지 않습니다.')

  const { data, status } = await api.delete<unknown>(
    `/animal-manage/${animalManageId}`,
  )

  expectStatus(status, 200, '개체 삭제')
  if (!isMessageResponse(data)) {
    throw new Error('개체 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isIndividualSex(value: unknown): value is IndividualSex {
  return individualSexes.some((sex) => sex === value)
}

function isAnimalManageQueryAllResponseItem(
  value: unknown,
): value is AnimalManageQueryAllResponseItem {
  return (
    isRecord(value) &&
    Number.isInteger(value.animalManageId) &&
    typeof value.animalName === 'string' &&
    isIndividualSex(value.animalGender) &&
    Number.isInteger(value.birthYear)
  )
}

// 화면이 쓰는 필드만 검사한다. 종 정보(kindName 등)는 종 상세 query 로 따로 받는다.
function isAnimalManageQueryResponse(
  value: unknown,
): value is AnimalManageQueryResponse {
  return (
    isRecord(value) &&
    Number.isInteger(value.animalManageId) &&
    typeof value.animalName === 'string' &&
    isIndividualSex(value.animalGender) &&
    Number.isInteger(value.birthYear) &&
    (value.otherInfo === null ||
      value.otherInfo === undefined ||
      typeof value.otherInfo === 'string') &&
    isFileResponse(value.animalImage) &&
    Number.isInteger(value.animalKindId)
  )
}
