import { api } from '@/shared/api/axios'
import type {
  AppAdminEmployeeCreateRequest,
  AppAdminEmployeeCreateResponse,
} from './types'

export async function createEmployee({
  username,
  name,
}: AppAdminEmployeeCreateRequest): Promise<AppAdminEmployeeCreateResponse> {
  if (!username || !name) {
    throw new Error('직원 계정 생성 요청 값이 비어 있습니다.')
  }

  const { data, status } = await api.post<unknown>('/app/admin/employees', {
    username,
    name,
  })

  if (status !== 201 || !isMessageResponse(data)) {
    throw new Error('직원 계정 생성 응답 형식이 올바르지 않습니다.')
  }

  return data
}

/** 같은 아이디의 계정이 이미 있다(409). */
export function isUsernameConflictError(error: unknown): boolean {
  if (!isRecord(error) || !isRecord(error.response)) return false
  return error.response.status === 409
}

function isMessageResponse(
  value: unknown,
): value is AppAdminEmployeeCreateResponse {
  return isRecord(value) && typeof value.message === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
