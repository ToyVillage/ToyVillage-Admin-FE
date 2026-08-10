import { api } from '@/shared/api/axios'

export interface DeleteReservationPermissionRequest {
  reservationId: number
  // 권한 목록(RESERVATION_PERMISSION_QUERY_ALL)이 주는 appAdminId. 문자열 id로 넘어와도
  // path segment 로 그대로 전달한다.
  appAdminId: string | number
}

// RESERVATION_PERMISSION_DELETE (DELETE /reservation/permission/{reservationId}/{appAdminId})
// — 단체예약 조회 권한에서 직원 계정 하나를 제거한다. 성공 시 204 No Content(본문 없음).
export async function deleteReservationPermission({
  reservationId,
  appAdminId,
}: DeleteReservationPermissionRequest): Promise<void> {
  if (!Number.isSafeInteger(reservationId) || reservationId <= 0) {
    throw new Error('예약 ID가 올바르지 않습니다.')
  }
  if (appAdminId === '' || appAdminId === undefined || appAdminId === null) {
    throw new Error('직원 계정 ID가 올바르지 않습니다.')
  }

  await api.delete(`/reservation/permission/${reservationId}/${appAdminId}`)
}
