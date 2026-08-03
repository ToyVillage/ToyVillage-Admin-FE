import { api } from '@/shared/api/axios'
import type { Staff } from '../model/types'

interface ReservationPermissionRuntimeItem {
  name: string
}

// RESERVATION_PERMISSION_QUERY_ALL (GET /reseravtion/permission/{reservationId})
// — 예약에 접근 권한을 가진 직원명 목록을 조회한다.
//
// 주의(명세 그대로): 엔드포인트 문자열이 `reseravtion`(오타)이다. 백엔드가
// `reservation`으로 정정하면 경로만 바꾼다.
//
// 임시 매핑(B): 응답은 `{ name }`만 준다. UI(ReservationAccessCard)는 key/제거에
// `id`가, 표시에 `role`이 필요하나 응답에 없어 `id`는 합성(`perm-<index>`)하고
// `role`은 두지 않는다. 권한 제거(RESERVATION_PERMISSION_DELETE)는 userId가 필요해
// 이 응답만으로는 불가하므로 별도 과제로 남긴다.
export async function getReservationPermissions(
  reservationId: number,
): Promise<Staff[]> {
  if (!Number.isSafeInteger(reservationId) || reservationId <= 0) {
    throw new Error('예약 ID가 올바르지 않습니다.')
  }

  const { data } = await api.get<unknown>(
    `/reseravtion/permission/${reservationId}`,
  )

  if (!isReservationPermissionResponse(data)) {
    throw new Error('예약 권한 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map((item, index) => ({
    id: `perm-${index}`,
    name: item.name,
  }))
}

function isReservationPermissionResponse(
  value: unknown,
): value is ReservationPermissionRuntimeItem[] {
  return Array.isArray(value) && value.every(isReservationPermissionItem)
}

function isReservationPermissionItem(
  value: unknown,
): value is ReservationPermissionRuntimeItem {
  if (typeof value !== 'object' || value === null) return false

  const item = value as Record<string, unknown>
  return typeof item.name === 'string' && item.name.trim().length > 0
}
