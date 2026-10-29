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
  /** 잔량. 잔량 도입 전 기록은 null 이거나 빠져 올 수 있다. */
  remainingAmount?: number | null
  /** 단위. 단위 도입 전 기록은 빠져 올 수 있어 kg 로 본다. */
  feedUnit?: FeedUnitCode
  /** ISO date-time */
  feedDateTime: string
  /** 특이사항. Swagger 목록 응답에는 아직 없어 빠질 수 있다(백엔드 추가 요청 중). */
  significant?: string | null
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
  /** 단위. 단위 도입 전 기록은 빠져 올 수 있어 kg 로 본다. */
  feedUnit?: FeedUnitCode
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
  /** 단위. 단위 도입 전 기록은 빠져 올 수 있어 kg 로 본다. */
  feedUnit?: FeedUnitCode
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
  /** 1부터 시작한다(급여 목록 — 개발자 결정). */
  page: number
  size: number
}

export interface FeedQueryRequest {
  feedLogId: number
}

/** 급여량·잔량 단위 */
export type FeedUnitCode = 'GML' | 'KGL'

/** `PUT /feed-log/admin/{feedLogId}` 요청(`FeedLogRequest`). 여섯 값 모두 필수다. */
export interface FeedLogUpdateRequest {
  /** 급여 일시. 화면에서 바꾸지 않으므로 상세 응답 원본을 그대로 보낸다. */
  feedDateTime: string
  feedType: string
  feedAmount: number
  /** 0 이상이다. */
  remainingAmount: number
  /** 기록의 원래 단위를 그대로 보낸다. */
  feedUnit: FeedUnitCode
  /** 특이사항. 비우면 빈 문자열 */
  significant: string
}

/** `PUT /feed-log/admin/{feedLogId}` 성공 응답(`MessageResponse`) */
export interface FeedLogMessageResponse {
  message: string
}

// staging OpenAPI(App 그룹, tag `fifth-floor-feed-log-controller`). 5층은 급여 날짜만 있고 잔량·특이사항이 없다.

/** `GET /feed-log/fifth-floor/admin` 의 배열 항목 */
export interface FifthFloorFeedLogListItemResponse {
  feedLogId: number
  staffName: string
  animalKind: string
  animalName: string
  animalDeleted: boolean
  feedType: string
  feedAmount: number
  feedUnit: FeedUnitCode
  /** YYYY-MM-DD */
  feedDate: string
}

/** `GET /feed-log/fifth-floor/admin` */
export interface FifthFloorFeedLogListResponse {
  feedLogs: FifthFloorFeedLogListItemResponse[]
  /** 총 페이지 수 */
  totalPageSize: number
}

/** `GET /feed-log/fifth-floor/admin/{feedLogId}`. `animalImageUrl` 은 화면에 쓰지 않아 두지 않는다. */
export interface FifthFloorFeedLogDetailResponse {
  animalId: number
  staffName: string
  animalKind: string
  animalName: string
  animalDeleted: boolean
  feedType: string
  feedAmount: number
  feedUnit: FeedUnitCode
  /** YYYY-MM-DD */
  feedDate: string
}

/** 5층 수정 요청. 급여 날짜는 화면에서 바꾸지 않는다. */
export interface FifthFloorFeedLogUpdateRequest {
  feedDate: string
  feedType: string
  feedAmount: number
  feedUnit: FeedUnitCode
}

/** `GET /feed-log/fifth-floor/admin/history/{animalManageId}` 의 배열 항목 */
export interface FifthFloorFeedLogHistoryItemResponse {
  feedLogId: number
  staffName: string
  feedType: string
  feedAmount: number
  feedUnit: FeedUnitCode
  /** YYYY-MM-DD */
  feedDate: string
}

/** `GET /feed-log/fifth-floor/admin/history/{animalManageId}` */
export interface FifthFloorFeedLogHistoryResponse {
  feedLogs: FifthFloorFeedLogHistoryItemResponse[]
}
