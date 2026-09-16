// staging OpenAPI(App 그룹, tag `feed-log-controller`)에서 프론트가 쓰는 3개 엔드포인트의 응답 스키마.
// 런타임 값은 신뢰하지 않고 `unknown` 으로 받은 뒤 feedApi 에서 검증한다.

/** 목록·상세·이력이 공통으로 쓰는 개체 분류. 목록 필터 query 값이기도 하다. */
export const animalTaxonomics = [
  'MAMMALS',
  'REPTILES',
  'BIRDS',
  'FISH',
] as const
export type AnimalTaxonomic = (typeof animalTaxonomics)[number]

/**
 * `GET /feed-log/admin` 의 배열 항목.
 * 급여자명은 Swagger 에 `name` 으로 적혀 있지만 실제 응답은 `staffName` 이다(2026-09-16 확인).
 * 서버가 문서에 맞출 수도 있어 둘 다 받는다.
 */
export interface FeedLogListItemResponse {
  feedLogId: number
  staffName?: string
  name?: string
  animalKind: string
  animalName: string
  feedType: string
  feedAmount: number
  /** ISO date-time */
  feedDateTime: string
}

export interface FeedLogListResponse {
  feedLogs: FeedLogListItemResponse[]
  totalPageSize: number
}

/** `GET /feed-log/admin/{feedLogId}` */
export interface FeedLogAdminDetailResponse {
  /** 개체 id(`animalManageId`) */
  animalId: number
  /** 급여자명. 목록과 같은 이유로 `staffName`·`name` 을 모두 받는다. */
  staffName?: string
  name?: string
  animalKind: string
  animalName: string
  /** 개체 사진. `fileName`·`fileKey` 뿐이라 표시용 URL 은 없다. */
  animalImageUrl?: { fileName: string; fileKey: string } | null
  feedType: string
  feedAmount: number
  feedDateTime: string
  significant: string
}

/** `GET /feed-log/admin/history/{animalManageId}` 의 배열 항목 */
export interface FeedLogHistoryItemResponse {
  feedLogId: number
  /** 급여자명. 목록과 같은 이유로 `staffName`·`name` 을 모두 받는다. */
  staffName?: string
  name?: string
  feedType: string
  feedAmount: number
  feedDateTime: string
  significant: string
}

export interface FeedLogHistoryResponse {
  feedLogs: FeedLogHistoryItemResponse[]
}

export interface FeedQueryAllRequest {
  /** YYYY-MM-DD */
  date: string
  /** 분류 탭. `전체` 는 보내지 않는다. */
  animalTaxonomic?: AnimalTaxonomic | null
  /** 0부터 시작한다. */
  page: number
  size: number
}

export interface FeedQueryRequest {
  feedLogId: number
}
