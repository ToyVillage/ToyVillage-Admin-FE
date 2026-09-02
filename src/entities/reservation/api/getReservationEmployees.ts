import { api } from '@/shared/api/axios'
import type { Staff } from '../model/types'

export interface ReservationEmployeeQueryRequest {
  // 단체예약 id. 아직 저장 전(생성 화면)이면 -1 → 전원 assignable, assigned 빈 배열.
  reservationId: number
}

// 배정됨/배정가능 두 그룹(EMPLOYEE 권한 계정, 이름 오름차순).
export interface ReservationEmployeeGroups {
  assigned: Staff[]
  assignable: Staff[]
}

// RESERVATION_ADMIN_EMPLOYEE_QUERY_ALL 응답 항목 런타임 형태.
interface EmployeeItemRuntime {
  appAdminId?: unknown
  name?: unknown
}

// RESERVATION_ADMIN_EMPLOYEE_QUERY_ALL (GET /reservation/assigned-employee/{reservationId})
// — 단체예약별 배정됨·배정가능 직원 목록 조회(관리자). 서버 검색 없음(전원 반환, 이름 검색은 프론트).
export async function getReservationEmployees({
  reservationId,
}: ReservationEmployeeQueryRequest): Promise<ReservationEmployeeGroups> {
  // 저장 전(생성 화면)은 -1, 그 외는 양의 정수. 0/비정수는 거부.
  if (
    !Number.isSafeInteger(reservationId) ||
    (reservationId <= 0 && reservationId !== -1)
  ) {
    throw new Error('예약 ID가 올바르지 않습니다.')
  }

  const { data } = await api.get<unknown>(
    `/reservation/assigned-employee/${reservationId}`,
  )

  if (!isEmployeeGroupsResponse(data)) {
    throw new Error('직원 배정 목록 응답 형식이 올바르지 않습니다.')
  }

  return {
    assigned: data.assigned.map(toStaff),
    assignable: data.assignable.map(toStaff),
  }
}

// appAdminId → Staff.id(문자열). role 은 응답에 없어 생략.
function toStaff(item: { appAdminId: number; name: string }): Staff {
  return { id: String(item.appAdminId), name: item.name }
}

function isEmployeeGroupsResponse(
  value: unknown,
): value is { assigned: { appAdminId: number; name: string }[]; assignable: { appAdminId: number; name: string }[] } {
  if (typeof value !== 'object' || value === null) return false

  const groups = value as Record<string, unknown>
  return (
    Array.isArray(groups.assigned) &&
    groups.assigned.every(isEmployeeItem) &&
    Array.isArray(groups.assignable) &&
    groups.assignable.every(isEmployeeItem)
  )
}

function isEmployeeItem(
  value: unknown,
): value is { appAdminId: number; name: string } {
  if (typeof value !== 'object' || value === null) return false

  const item = value as EmployeeItemRuntime
  return (
    typeof item.appAdminId === 'number' &&
    Number.isFinite(item.appAdminId) &&
    typeof item.name === 'string'
  )
}
