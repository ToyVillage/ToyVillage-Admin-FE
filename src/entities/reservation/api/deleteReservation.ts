import { api } from '@/shared/api/axios'

export interface ReservationDeleteResponse {
  message: string
}

// RESERVATION_ADMIN_DELETE (DELETE /reservation/{reservationId})
// — 관리자가 단체예약을 삭제(예약에 걸린 직원 배정도 서버가 함께 삭제).
export async function deleteReservation(
  id: number,
): Promise<ReservationDeleteResponse> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('예약 ID가 올바르지 않습니다.')
  }

  const { data, status } = await api.delete<unknown>(`/reservation/${id}`)

  if (status !== 200 && status !== 204) {
    throw new Error('단체예약 삭제 응답 상태가 올바르지 않습니다.')
  }
  if (!isDeleteResponse(data)) {
    throw new Error('단체예약 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isDeleteResponse(value: unknown): value is ReservationDeleteResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).message === 'string'
  )
}
