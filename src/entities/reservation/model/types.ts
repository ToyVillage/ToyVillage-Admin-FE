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
}

export interface GrantAccessInput {
  reservationIds: string[]
  staffIds: string[]
}
