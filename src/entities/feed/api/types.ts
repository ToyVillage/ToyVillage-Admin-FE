// staging OpenAPI(App 그룹, tag `feed-log-controller`)에서 프론트가 쓰는 엔드포인트의 요청·응답 스키마.
// 런타임 값은 신뢰하지 않고 `unknown` 으로 받은 뒤 feedApi 에서 검증한다.

/** 목록·상세·이력이 공통으로 쓰는 개체 분류. 목록 필터 query 값이기도 하다. */
export const animalTaxonomics = [
  'MAMMALS',
  'REPTILES',
  'BIRDS',
  'FISH',
] as const
export type AnimalTaxonomic = (typeof animalTaxonomics)[number]

/** `GET /feed-log/admin` 의 배열 항목 */
export interface FeedLogListItemResponse {
  feedLogId: number
  /** 급여자명 */
  staffName: string
  animalKind: string
  animalName: string
  feedType: string
  feedAmount: number
  /** 잔량(kg). 잔량 도입 전 기록은 null 이거나 빠져 올 수 있다. */
  remainingAmount?: number | null
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
  /** 급여자명 */
  staffName: string
  animalKind: string
  animalName: string
  /** 개체 사진. `fileName`·`fileKey` 뿐이라 표시용 URL 은 없다. */
  animalImageUrl?: { fileName: string; fileKey: string } | null
  feedType: string
  feedAmount: number
  /** 잔량(kg). 잔량 도입 전 기록은 null 이거나 빠져 올 수 있다. */
  remainingAmount?: number | null
  feedDateTime: string
  /** 특이사항. 값이 없으면 null 이다. */
  significant: string | null
}

/** `GET /feed-log/admin/history/{animalManageId}` 의 배열 항목 */
export interface FeedLogHistoryItemResponse {
  feedLogId: number
  /** 급여자명 */
  staffName: string
  feedType: string
  feedAmount: number
  /** 잔량(kg). 잔량 도입 전 기록은 null 이거나 빠져 올 수 있다. */
  remainingAmount?: number | null
  feedDateTime: string
  /** 특이사항. 값이 없으면 null 이다. */
  significant: string | null
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

/** `PUT /feed-log/admin/{feedLogId}` 요청(`FeedLogRequest`). 네 값 모두 필수다. */
export interface FeedLogUpdateRequest {
  /** 급여 일시. 화면에서 바꾸지 않으므로 상세 응답 원본을 그대로 보낸다. */
  feedDateTime: string
  feedType: string
  /** kg 단위 실수 */
  feedAmount: number
  /** 특이사항. 비우면 빈 문자열 */
  significant: string
}

/** `PUT /feed-log/admin/{feedLogId}` 성공 응답(`MessageResponse`) */
export interface FeedLogMessageResponse {
  message: string
}
