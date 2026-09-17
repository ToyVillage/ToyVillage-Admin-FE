import { api } from '@/shared/api/axios'
import type { LegalStatus } from '../model/types'
import {
  assertPositiveId,
  expectStatus,
  isMessageResponse,
  isRecord,
} from './guards'
import type {
  AnimalLegalStatusCreateRequest,
  AnimalLegalStatusResponse,
  AnimalMessageResponse,
} from './types'

/** 공용 목록. 서버는 기본 3개를 내려주지 않는다(처음 저장할 때 만든다). */
export async function getLegalStatuses(): Promise<LegalStatus[]> {
  const { data } = await api.get<unknown>('/animal-manage/legal-status')

  if (!Array.isArray(data) || !data.every(isLegalStatusResponse)) {
    throw new Error('법정지정분류 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map(({ animalLegalStatusId, kind }) => ({
    id: animalLegalStatusId,
    name: kind,
  }))
}

export async function createLegalStatus(
  request: AnimalLegalStatusCreateRequest,
): Promise<AnimalMessageResponse> {
  const { data, status } = await api.post<unknown>(
    '/animal-manage/legal-status',
    request,
  )

  expectStatus(status, 201, '법정지정분류 생성')
  if (!isMessageResponse(data)) {
    throw new Error('법정지정분류 생성 응답 형식이 올바르지 않습니다.')
  }

  return data
}

/** 공용 목록에서 지운다. 이미 선택한 종에는 이름이 남는다. */
export async function deleteLegalStatus({
  animalLegalStatusId,
}: {
  animalLegalStatusId: number
}): Promise<AnimalMessageResponse> {
  assertPositiveId(
    animalLegalStatusId,
    '법정지정분류 삭제 요청 ID가 올바르지 않습니다.',
  )

  const { data, status } = await api.delete<unknown>(
    `/animal-manage/legal-status/${animalLegalStatusId}`,
  )

  expectStatus(status, 200, '법정지정분류 삭제')
  if (!isMessageResponse(data)) {
    throw new Error('법정지정분류 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isLegalStatusResponse(
  value: unknown,
): value is AnimalLegalStatusResponse {
  return (
    isRecord(value) &&
    Number.isInteger(value.animalLegalStatusId) &&
    typeof value.kind === 'string'
  )
}
