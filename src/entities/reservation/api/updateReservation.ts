import { api } from '@/shared/api/axios'
import type { ReservationCreateRequest } from './createReservation'

// RESERVATION_ADMIN_UPDATE 요청 바디는 생성과 동일(전체 필드 재전송).
export type ReservationUpdateRequest = ReservationCreateRequest

export interface ReservationUpdateResponse {
  message: string
}

// RESERVATION_ADMIN_UPDATE (PATCH /reservation/{reservationId})
// — 관리자가 단체예약 내용과 직원 배정을 수정(전체 필드 재전송, 배정 통째 교체).
export async function updateReservation({
  id,
  body,
}: {
  id: number
  body: ReservationUpdateRequest
}): Promise<ReservationUpdateResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('예약 ID가 올바르지 않습니다.')
  }

  const { data, status } = await api.patch<unknown>(`/reservation/${id}`, body)

  if (status !== 200 && status !== 204) {
    throw new Error('단체예약 수정 응답 상태가 올바르지 않습니다.')
  }
  if (!isUpdateResponse(data)) {
    throw new Error('단체예약 수정 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isUpdateResponse(value: unknown): value is ReservationUpdateResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).message === 'string'
  )
}
