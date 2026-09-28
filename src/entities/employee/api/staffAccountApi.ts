import { api } from '@/shared/api/axios'
import type { StaffAccount } from '../model/staffAccount'
import { appAdminEmployeesPath } from './employeeApi'
import type {
  AppAdminEmployeeResponseItem,
  AppAdminMessageResponse,
} from './types'

// 직원 계정 관리 화면의 API. Notion 명세에는 생성(`APP_ADMIN_EMPLOYEE_CREATE`)만 있어
// 조회·비밀번호 초기화·삭제는 staging Swagger app-admin-controller 를 기준으로 연동했다.

/** 직원 전체 조회(`APP_ADMIN_EMPLOYEE_QUERY_ALL`, GET `/app/admin/employees`). */
export async function getStaffAccounts(): Promise<StaffAccount[]> {
  const { data } = await api.get<unknown>(appAdminEmployeesPath)

  if (!Array.isArray(data) || !data.every(isEmployeeResponseItem)) {
    throw new Error('직원 목록 조회 응답 형식이 올바르지 않습니다.')
  }

  return data.map((item) => ({
    id: item.id,
    username: item.username,
    name: item.name,
    passwordChanged: item.passwordChanged,
    createdAt: item.createAt,
  }))
}

/** 직원 비밀번호 초기화(`APP_ADMIN_EMPLOYEE_PASSWORD_RESET`, PATCH `…/{appAdminId}/password`). */
export async function resetStaffAccountPassword(
  appAdminId: number,
): Promise<AppAdminMessageResponse> {
  assertAppAdminId(appAdminId)
  const { data } = await api.patch<unknown>(
    `${appAdminEmployeesPath}/${appAdminId}/password`,
  )
  return readMessage(data, '비밀번호 초기화')
}

/** 직원 계정 삭제(`APP_ADMIN_EMPLOYEE_DELETE`, DELETE `…/{appAdminId}`). */
export async function deleteStaffAccount(
  appAdminId: number,
): Promise<AppAdminMessageResponse> {
  assertAppAdminId(appAdminId)
  const { data } = await api.delete<unknown>(
    `${appAdminEmployeesPath}/${appAdminId}`,
  )
  return readMessage(data, '직원 계정 삭제')
}

function readMessage(data: unknown, label: string): AppAdminMessageResponse {
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as Record<string, unknown>).message !== 'string'
  ) {
    throw new Error(`${label} 응답 형식이 올바르지 않습니다.`)
  }
  return data as AppAdminMessageResponse
}

function assertAppAdminId(appAdminId: number) {
  if (!Number.isSafeInteger(appAdminId) || appAdminId <= 0) {
    throw new Error('직원 id 가 올바르지 않습니다.')
  }
}

function isEmployeeResponseItem(
  value: unknown,
): value is AppAdminEmployeeResponseItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    Number.isSafeInteger(item.id) &&
    typeof item.username === 'string' &&
    typeof item.name === 'string' &&
    typeof item.passwordChanged === 'boolean' &&
    typeof item.createAt === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.createAt)
  )
}
