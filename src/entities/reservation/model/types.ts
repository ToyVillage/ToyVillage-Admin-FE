export type ReservationStatus = 'pending' | 'approved' | 'rejected'

export interface Reservation {
  id: string
  status: ReservationStatus
  consultDate: string // 상담일 (예: 2026.07.02)
  reserveDate: string // 예약일 (예: 2026.07.13)
  reserveTime: string // 예약 시간 (예: 13 : 01)
  groupName: string // 단체명 (예: 대구어린이집)
  region: string // 지역 (예: 대구광역시)
  headcount: number // 인원 (예: 18)
}

export interface Staff {
  id: string
  name: string
  role?: string // 직급 표시용(예: 과장). 실제 직원 API 전까지 mock에서 부여.
}

// 상세 페이지 전용 확장 필드(목록 최소 필드 Reservation 위에 상세 정보를 더한다).
// 실제 필드 계약은 /api 슬라이스에서 확정한다.
export interface ReservationDetail extends Reservation {
  reserveTimeEnd: string // 예약 종료 시간 (예: 15 : 00) — 표시: reserveTime ~ reserveTimeEnd
  reserverName: string // 예약인 (예: 이승현)
  regionDetail: string // 상세 지역 (예: 대전광역시 유성구 장동)
  admissionFee: number // 입장료 (예: 200000 → 200,000원)
  surveyStatus: string // 상태 라벨 (예: 답사 완료)
  guideCount: number // 인솔자 인원 (예: 3)
  guideContact: string // 인솔자 연락처 (예: 010-7753-9698)
}

export interface GrantAccessInput {
  reservationIds: string[]
  staffIds: string[]
}

export interface RemoveAccessInput {
  reservationId: string
  staffId: string
}
