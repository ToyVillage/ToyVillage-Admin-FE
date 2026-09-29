import {
  assertPageRequest,
  assertPositiveId,
  expectStatus,
  isFileResponse,
  isMessageResponse,
  isPageResponse,
  isRecord,
  type AnimalMessageResponse,
} from '@/entities/species'
import { api } from '@/shared/api/axios'
import type { Observation, ObservationListItem } from '../model/types'

interface ObservationPath {
  animalManageId: number
  animalObservationId: number
}

interface AnimalObservationListItemResponse {
  animalObservationId: number
  title: string
  createdAt: string
  authorName: string
  files: { fileName: string; fileKey: string }[]
}

interface AnimalObservationQueryResponse
  extends AnimalObservationListItemResponse {
  content: string
}

export interface AnimalObservationUpdateRequest {
  /** 최대 100자 */
  title: string
  /** 최대 2000자 */
  content: string
  /** 남긴 첨부 + 새 업로드 키 전체. 서버가 통째로 교체한다. */
  fileKeys: string[]
}

export interface ObservationListPage {
  items: ObservationListItem[]
  totalPages: number
  totalElements: number
}

export async function getObservations({
  animalManageId,
  page,
  size,
}: {
  animalManageId: number
  /** 1부터 시작한다. */
  page: number
  size: number
}): Promise<ObservationListPage> {
  assertPositiveId(animalManageId, '개체 ID가 올바르지 않습니다.')
  assertPageRequest(page, size, '관찰 기록 목록')

  const { data } = await api.get<unknown>(
    `/animal-manage/${animalManageId}/observations`,
    { params: { page, size } },
  )

  if (!isPageResponse(data, isObservationListItemResponse)) {
    throw new Error('관찰 기록 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    items: data.content.map((item) => toObservationListItem(animalManageId, item)),
    totalPages: data.totalPages,
    totalElements: data.totalElements,
  }
}

export async function getObservation({
  animalManageId,
  animalObservationId,
}: ObservationPath): Promise<Observation> {
  assertObservationPath({ animalManageId, animalObservationId })

  const { data } = await api.get<unknown>(
    `/animal-manage/${animalManageId}/observations/${animalObservationId}`,
  )

  if (!isObservationQueryResponse(data)) {
    throw new Error('관찰 기록 상세 조회 응답 형식이 올바르지 않습니다.')
  }

  return {
    ...toObservationListItem(animalManageId, data),
    content: data.content,
  }
}

export async function updateObservation({
  animalManageId,
  animalObservationId,
  request,
}: ObservationPath & {
  request: AnimalObservationUpdateRequest
}): Promise<AnimalMessageResponse> {
  assertObservationPath({ animalManageId, animalObservationId })

  const { data, status } = await api.patch<unknown>(
    `/animal-manage/${animalManageId}/observations/${animalObservationId}`,
    request,
  )

  expectStatus(status, 200, '관찰 기록 수정')
  if (!isMessageResponse(data)) {
    throw new Error('관찰 기록 수정 응답 형식이 올바르지 않습니다.')
  }

  return data
}

export async function deleteObservation({
  animalManageId,
  animalObservationId,
}: ObservationPath): Promise<AnimalMessageResponse> {
  assertObservationPath({ animalManageId, animalObservationId })

  const { data, status } = await api.delete<unknown>(
    `/animal-manage/${animalManageId}/observations/${animalObservationId}`,
  )

  expectStatus(status, 200, '관찰 기록 삭제')
  if (!isMessageResponse(data)) {
    throw new Error('관찰 기록 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function assertObservationPath({
  animalManageId,
  animalObservationId,
}: ObservationPath) {
  assertPositiveId(animalManageId, '개체 ID가 올바르지 않습니다.')
  assertPositiveId(animalObservationId, '관찰 기록 ID가 올바르지 않습니다.')
}

// 서버 필드명은 api 계층에서 모델 필드명으로 바꾼다(2026-09-17 개발자 결정).
function toObservationListItem(
  animalManageId: number,
  item: AnimalObservationListItemResponse,
): ObservationListItem {
  return {
    id: String(item.animalObservationId),
    individualId: String(animalManageId),
    title: item.title,
    // 시간이 붙어 와도 날짜만 쓴다(표시 YYYY.MM.DD).
    observedAt: item.createdAt.slice(0, 10),
    observerName: item.authorName,
    attachments: item.files.map(({ fileName, fileKey }) => ({
      fileName,
      fileKey,
    })),
  }
}

function isObservationListItemResponse(
  value: unknown,
): value is AnimalObservationListItemResponse {
  return (
    isRecord(value) &&
    Number.isInteger(value.animalObservationId) &&
    typeof value.title === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.authorName === 'string' &&
    Array.isArray(value.files) &&
    value.files.every(isFileResponse)
  )
}

function isObservationQueryResponse(
  value: unknown,
): value is AnimalObservationQueryResponse {
  return (
    isRecord(value) &&
    typeof value.content === 'string' &&
    isObservationListItemResponse(value)
  )
}
