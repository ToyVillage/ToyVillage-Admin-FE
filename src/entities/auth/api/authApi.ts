import { api } from '@/shared/api/axios'
import type {
  AppAuthLoginRequest,
  AppAuthLoginResponse,
  AppAuthReissueRequest,
  AppAuthReissueResponse,
  AppAuthRole,
} from './types'

// Contract: 인증이 필요 없는 공개 엔드포인트. 요청 인터셉터가 토큰을 붙이지 않는다.
export const appAuthLoginPath = '/app/auth/login'
export const appAuthReissuePath = '/app/auth/reissue'

export async function login(
  input: AppAuthLoginRequest,
): Promise<AppAuthLoginResponse> {
  const { data } = await api.post<unknown>(appAuthLoginPath, input)

  if (!isAppAuthLoginResponse(data)) {
    throw new Error('앱 로그인 응답 형식이 올바르지 않습니다.')
  }

  return data
}

export async function reissueAppToken(
  input: AppAuthReissueRequest,
): Promise<AppAuthReissueResponse> {
  const { data } = await api.post<unknown>(appAuthReissuePath, input)

  if (!isAppAuthReissueResponse(data)) {
    throw new Error('앱 토큰 재발급 응답 형식이 올바르지 않습니다.')
  }

  return data
}

function isAppAuthLoginResponse(
  value: unknown,
): value is AppAuthLoginResponse {
  if (typeof value !== 'object' || value === null) return false

  const response = value as Record<string, unknown>
  return (
    isAppAuthReissueResponse(value) &&
    typeof response.name === 'string' &&
    response.name.length > 0 &&
    isAppAuthRole(response.role)
  )
}

function isAppAuthReissueResponse(
  value: unknown,
): value is AppAuthReissueResponse {
  if (typeof value !== 'object' || value === null) return false

  const response = value as Record<string, unknown>
  return (
    typeof response.access_token === 'string' &&
    response.access_token.length > 0 &&
    typeof response.refresh_token === 'string' &&
    response.refresh_token.length > 0
  )
}

function isAppAuthRole(value: unknown): value is AppAuthRole {
  return value === 'APP_ADMIN' || value === 'EMPLOYEE'
}
