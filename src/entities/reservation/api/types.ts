import type { Reservation, ReservationStatus } from '../model/types'

// 서버 상태 코드(요청 status 파라미터 및 응답 라벨 역매핑에 사용).
export type ReservationStatusCode =
  | 'BEFORE_SITE_VISIT'
  | 'SITE_VISIT_COMPLETED'
  | 'VISIT_COMPLETED'

// 서버 정렬 코드. 두 기준 모두 내림차순.
export type ReservationSortCode = 'COUNSEL_DATE' | 'RESERVATION_DATE'

// 응답 status 라벨(Contract enum allowedValues). 이외 값은 계약 위반이다.
export type ReservationStatusLabel =
  | '사전답사 전'
  | '사전답사 완료'
  | '방문 완료'

// GET /reservation (관리자 전체 조회) 요청 파라미터.
export interface ReservationAdminQueryAllRequest {
  status?: ReservationStatusCode
  title?: string
  sort?: ReservationSortCode
  page?: number
  size?: number
}

// 응답 content 항목(Contract 필드만).
export interface ReservationAdminQueryAllItem {
  id: number
  title: string
  counselDate: string
  reservationDate: string
  reservationTime: string
  location: string
  count: number
  status: ReservationStatusLabel
}

export interface ReservationAdminQueryAllPage {
  content: ReservationAdminQueryAllItem[]
  totalPages: number
}

// 200 응답 전체 형태(상태 카운트 + Spring Page).
export interface ReservationAdminQueryAllResponse {
  beforeVisitSite: number
  doneVisitSite: number
  doneVisit: number
  reservationAdminQueryListObjectResponse: ReservationAdminQueryAllPage
}

// 공통 오류 응답.
export interface ReservationAdminQueryAllErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

// 페이지가 소비하기 좋은 매핑 결과.
export interface ReservationAdminListResult {
  counts: Record<ReservationStatus, number>
  reservations: Reservation[]
  totalPages: number
}
