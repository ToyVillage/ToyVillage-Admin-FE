// 전체 활동 전용 조회 응답(staging Swagger `all-activities-controller`). 승인 계약(harness/api/approvals)의 필드만 둔다.

/** 급여량·잔량 단위 */
export type FeedUnitCode = 'GML' | 'KGL'

/** `GET /all-activities/feed-log/fourth-floor` 배열 항목 (APP_ALL_ACTIVITIES_FEED_LOG_QUERY_FOURTH_FLOOR) */
export interface FloorFourFeedLogResponse {
  feedLogId: number
  animalKind: string
  animalName: string
  animalDeleted: boolean
  /** `YYYY-MM-DDTHH:mm:ss` */
  feedDateTime: string
  feedType: string
  feedAmount: number
  /** 잔량 도입 전 기록은 null 일 수 있다. */
  remainingAmount: number | null
  feedUnit: FeedUnitCode
  /** 특이사항. 없으면 빠지거나 null 이다. */
  significant?: string | null
  staffName: string
}

/** `GET /all-activities/feed-log/fifth-floor` 배열 항목 (APP_ALL_ACTIVITIES_FEED_LOG_QUERY_FIFTH_FLOOR) */
export interface FloorFiveFeedLogResponse {
  feedLogId: number
  animalKind: string
  animalName: string
  animalDeleted: boolean
  feedType: string
  feedAmount: number
  feedUnit: FeedUnitCode
  staffName: string
}

/** `GET /all-activities/animal-observation` 배열 항목 (APP_ALL_ACTIVITIES_ANIMAL_OBSERVATION_QUERY_ALL) */
export interface ObservationResponse {
  animalObservationId: number
  animalManageId: number
  animalKind: string
  animalName: string
  animalDeleted: boolean
  /** `YYYY-MM-DDTHH:mm:ss` */
  createdAt: string
  title: string
  authorName: string
  fileCount: number
}
