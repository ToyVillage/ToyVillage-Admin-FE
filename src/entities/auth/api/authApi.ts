import { isAxiosError } from 'axios'
import { api } from '@/shared/api/axios'
import type {
  AppAuthLoginRequest,
  AppAuthLoginResponse,
  AppAuthLogoutResponse,
  AppAuthReissueRequest,
  AppAuthReissueResponse,
  AppAuthRole,
} from './types'

// Contract: 인증이 필요 없는 공개 엔드포인트. 요청 인터셉터가 토큰을 붙이지 않는다.
export const appAuthLoginPath = '/app/auth/login'
export const appAuthReissuePath = '/app/auth/reissue'
// 로그아웃은 인증 API다. 요청 인터셉터가 access token 을 붙인다.
export const appAuthLogoutPath = '/app/auth/logout'

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

export async function logoutApp(): Promise<AppAuthLogoutResponse> {
  const { data } = await api.post<unknown>(appAuthLogoutPath)

  if (!isAppAuthLogoutResponse(data)) {
    throw new Error('앱 로그아웃 응답 형식이 올바르지 않습니다.')
  }

  return data
}

/** 아이디·비밀번호 불일치는 401 이다. 그 외 실패(500·네트워크·응답 형식)와 구분해 다루기 위한 판별이다. */
export function isLoginCredentialError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 401
}

function isAppAuthLoginResponse(value: unknown): value is AppAuthLoginResponse {
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

function isAppAuthLogoutResponse(
  value: unknown,
): value is AppAuthLogoutResponse {
  if (typeof value !== 'object' || value === null) return false

  return typeof (value as Record<string, unknown>).message === 'string'
}

function isAppAuthRole(value: unknown): value is AppAuthRole {
  return value === 'APP_ADMIN' || value === 'EMPLOYEE'
}
