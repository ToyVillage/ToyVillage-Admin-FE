import { api } from '@/shared/api/axios'

export interface DeleteReservationPermissionRequest {
  reservationId: number
  // 목록(RESERVATION_PERMISSION_QUERY_ALL)이 아직 userId를 주지 않아 합성 id가
  // 넘어올 수 있어 string|number 로 받아 path segment 로 그대로 전달한다.
  userId: string | number
}

export interface DeleteReservationPermissionResponse {
  message: string
}

// RESERVATION_PERMISSION_DELETE (DELETE /reservation/permission/{reservationId}/{userId})
// — 단체예약 페이지 권한에서 직원 한 명을 제거한다.
//
// 선행 의존: 삭제에는 실제 userId가 필요하나 권한 목록 응답에 userId가 없다(임시 매핑 B).
// 목록 응답에 userId가 추가되면 코드 변경 없이 실 userId가 전달된다.
export async function deleteReservationPermission({
  reservationId,
  userId,
}: DeleteReservationPermissionRequest): Promise<DeleteReservationPermissionResponse> {
  if (!Number.isSafeInteger(reservationId) || reservationId <= 0) {
    throw new Error('예약 ID가 올바르지 않습니다.')
  }
  if (userId === '' || userId === undefined || userId === null) {
    throw new Error('직원 ID가 올바르지 않습니다.')
  }

  const { data } = await api.delete<unknown>(
    `/reservation/permission/${reservationId}/${userId}`,
  )

  if (!isDeleteResponse(data)) {
    throw new Error('권한 삭제 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isDeleteResponse(
  value: unknown,
): value is DeleteReservationPermissionResponse {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as Record<string, unknown>).message === 'string'
}
