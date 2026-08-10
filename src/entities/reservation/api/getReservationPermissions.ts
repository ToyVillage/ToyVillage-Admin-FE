import { api } from '@/shared/api/axios'
import type { Staff } from '../model/types'

interface ReservationPermissionRuntimeItem {
  appAdminId: number | string
  name: string
}

// RESERVATION_PERMISSION_QUERY_ALL (GET /reservation/permission/{reservationId})
// — 예약에 조회 권한을 가진 직원 목록(appAdminId, name)을 조회한다.
export async function getReservationPermissions(
  reservationId: number,
): Promise<Staff[]> {
  if (!Number.isSafeInteger(reservationId) || reservationId <= 0) {
    throw new Error('예약 ID가 올바르지 않습니다.')
  }

  const { data } = await api.get<unknown>(
    `/reservation/permission/${reservationId}`,
  )

  if (!isReservationPermissionResponse(data)) {
    throw new Error('예약 권한 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map((item) => ({
    id: String(item.appAdminId),
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
  const hasValidId =
    (typeof item.appAdminId === 'number' && Number.isFinite(item.appAdminId)) ||
    (typeof item.appAdminId === 'string' && item.appAdminId.trim().length > 0)

  return (
    hasValidId && typeof item.name === 'string' && item.name.trim().length > 0
  )
}
