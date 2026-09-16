import type { AnimalSpecies } from '../model/types'

// staging OpenAPI(App 그룹, tag `feed-log-controller`)의 요청·응답 스키마.
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

/** `GET /feed-log/admin/{feedLogId}` — 특이사항(significant)은 이 응답에 없다. */
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

/** `GET /feed-log/{feedLogId}` — 특이사항이 있는 유일한 응답이다. */
export interface FeedLogDetailResponse {
  feedLogId: number
  feedType: string
  feedAmount: number
  feedDateTime: string
  significant: string
}

/** `GET /animal-manage/{animalManageId}` 중 급여 화면이 쓰는 필드만 선언한다. */
export const animalTaxonomics = [
  'MAMMALS',
  'REPTILES',
  'BIRDS',
  'FISH',
] as const
export type AnimalTaxonomic = (typeof animalTaxonomics)[number]

export interface AnimalManageQueryResponse {
  animalManageId: number
  animalTaxonomic: AnimalTaxonomic
}

/** `POST /feed-log/{animalManageId}`, `PUT /feed-log/{feedLogId}` 요청 바디 */
export interface FeedLogRequest {
  feedDateTime: string
  feedType: string
  feedAmount?: number
  significant?: string
}

export interface FeedLogMessageResponse {
  message: string
}

export interface FeedQueryAllRequest {
  /** YYYY-MM-DD */
  date: string
  /**
   * 분류 탭. 명세에 분류 필터가 없어 요청에는 싣지 않고,
   * 응답을 받은 뒤 개체 분류로 거른다.
   */
  species?: AnimalSpecies | null
}

export interface FeedQueryRequest {
  feedLogId: number
}

export interface FeedLogCreateRequest {
  animalManageId: number
  input: FeedLogRequest
}

export interface FeedLogUpdateRequest {
  feedLogId: number
  input: FeedLogRequest
}
