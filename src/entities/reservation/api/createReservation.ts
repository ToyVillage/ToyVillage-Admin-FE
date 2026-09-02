import { api } from '@/shared/api/axios'

// RESERVATION_ADMIN_CREATE (POST /reservation) 요청 바디.
// reservationDate/reservationTime/status 는 서버가 자동 입력하므로 포함하지 않는다.
export interface ReservationCreateRequest {
  title: string
  location: string
  counselDate: string // yyyy-MM-dd
  reservationName: string
  leaderPhoneNumber: string
  reservationCount: number
  leaderCount: number
  money: number
  visitDate: string // yyyy-MM-dd
  visitTime: string // HH:mm
  exitTime: string // HH:mm
  visitSiteCount: number
  visitSiteDate: string // yyyy-MM-dd
  visitSiteTime: string // HH:mm
  visitSiteExitTime: string // HH:mm
  // 배정할 직원 id 목록. 생략/빈 배열이면 배정 없이 생성.
  appAdminIds?: number[]
}

export interface ReservationCreateResponse {
  message: string
}

export async function createReservation(
  body: ReservationCreateRequest,
): Promise<ReservationCreateResponse> {
  const { data, status } = await api.post<unknown>('/reservation', body)

  if (status !== 201 && status !== 200) {
    throw new Error('단체예약 생성 응답 상태가 올바르지 않습니다.')
  }
  if (!isCreateResponse(data)) {
    throw new Error('단체예약 생성 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isCreateResponse(value: unknown): value is ReservationCreateResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).message === 'string'
  )
}
