import { taxonGroups, type TaxonGroup } from '../model/types'
import type { AnimalKindImageResponse, AnimalMessageResponse } from './types'

// 개체관리 API(종·개체·관찰)가 함께 쓰는 응답 검사.

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isFileResponse(
  value: unknown,
): value is AnimalKindImageResponse {
  return (
    isRecord(value) &&
    typeof value.fileName === 'string' &&
    typeof value.fileKey === 'string'
  )
}

export function isMessageResponse(
  value: unknown,
): value is AnimalMessageResponse {
  return isRecord(value) && typeof value.message === 'string'
}

// 개명 전 값(`MAMMAL` 등)이 통과하면 분류군 라벨 조회가 빈 값이 된다.
export function isTaxonGroup(value: unknown): value is TaxonGroup {
  return taxonGroups.some((taxonGroup) => taxonGroup === value)
}

/** 개체관리 조회가 404 로 실패했다. 그 외 실패는 not-found 가 아니라 조회 오류로 보인다. */
export function isNotFoundError(error: unknown): boolean {
  if (!isRecord(error) || !isRecord(error.response)) return false
  return error.response.status === 404
}

export function assertPositiveId(value: number, message: string) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(message)
  }
}

export function assertPageRequest(page: number, size: number, label: string) {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new Error(`${label} 페이지 번호가 올바르지 않습니다.`)
  }

  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new Error(`${label} 페이지 크기가 올바르지 않습니다.`)
  }
}

export function expectStatus(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`${label} 응답 상태가 올바르지 않습니다.`)
  }
}

/** Spring Page 응답에서 화면이 쓰는 필드만 검사한다. */
export function isPageResponse<Item>(
  value: unknown,
  isItem: (item: unknown) => item is Item,
): value is { content: Item[]; totalPages: number; totalElements: number } {
  return (
    isRecord(value) &&
    Array.isArray(value.content) &&
    value.content.every(isItem) &&
    Number.isInteger(value.totalPages) &&
    Number.isInteger(value.totalElements)
  )
}
