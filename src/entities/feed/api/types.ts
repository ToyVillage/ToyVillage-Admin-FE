// staging OpenAPI(App 그룹, tag `feed-log-controller`)에서 프론트가 쓰는 3개 엔드포인트의 응답 스키마.
// 런타임 값은 신뢰하지 않고 `unknown` 으로 받은 뒤 feedApi 에서 검증한다.

/** `GET /feed-log/admin`, `GET /feed-log/admin/history/{animalManageId}` 의 배열 항목 */
export interface FeedLogListItemResponse {
  feedId: number
  animalKind: string
  animalName: string
}

export interface FeedLogListResponse {
  feedLogs: FeedLogListItemResponse[]
}

/** `GET /feed-log/admin/{feedLogId}` */
export interface FeedLogAdminDetailResponse {
  /** 개체 id(`animalManageId`) */
  animalId: number
  /** 급여자명 */
  name: string
  animalKind: string
  animalName: string
  feedType: string
  feedAmount: number
  /** ISO date-time */
  feedDateTime: string
}

export interface FeedQueryAllRequest {
  /** YYYY-MM-DD */
  date: string
}

export interface FeedQueryRequest {
  feedLogId: number
}
