import type { TaxonGroup } from './types'

// 생성·수정·삭제 뒤 `all` 을 무효화한다. 종 삭제는 개체·관찰 query 도 함께 무효화한다(연쇄 삭제).
export const speciesQueryKeys = {
  all: ['species'] as const,
  lists: ['species', 'list'] as const,
  list: (params: { page: number; taxonGroup?: TaxonGroup; keyword?: string }) =>
    ['species', 'list', params] as const,
  detail: (speciesId: string) => ['species', speciesId] as const,
}

// 법정지정분류 생성·삭제 뒤 무효화한다. 삭제는 종 상세의 id 도 바꾸므로 종 query 도 무효화한다.
export const legalStatusQueryKeys = {
  all: ['legal-statuses'] as const,
}
