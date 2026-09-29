import { api } from '@/shared/api/axios'
import type { Employee } from '../model/types'
import type { AppAdminEmployeeQueryAllResponseItem } from './types'

export const appAdminEmployeesPath = '/app/admin/employees'

/**
 * 전체 직원 조회(`APP_ADMIN_EMPLOYEE_QUERY_ALL`).
 *
 * 팀 멤버 조회(`GET /team/{teamId}/members`)가 직급을 주지 않으므로, 팀 관리
 * 화면은 이 목록으로 직급을 채우고 팀원 추가 후보도 여기서 고른다.
 */
export async function getEmployees(): Promise<Employee[]> {
  const { data } = await api.get<unknown>(appAdminEmployeesPath)

  if (!Array.isArray(data) || !data.every(isEmployeeResponseItem)) {
    throw new Error('직원 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map((item) => ({
    id: item.id,
    username: item.username,
    name: item.name,
    position: item.position ?? null,
  }))
}

function isEmployeeResponseItem(
  value: unknown,
): value is AppAdminEmployeeQueryAllResponseItem {
  if (typeof value !== 'object' || value === null) return false

  const item = value as Record<string, unknown>

  return (
    Number.isInteger(item.id) &&
    typeof item.username === 'string' &&
    typeof item.name === 'string' &&
    (item.position == null || typeof item.position === 'string')
  )
}
