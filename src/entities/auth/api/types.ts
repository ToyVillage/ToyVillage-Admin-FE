import type { AppSessionRole } from '@/shared/api/session'

export interface AppAuthLoginRequest {
  username: string
  password: string
}

export type AppAuthRole = AppSessionRole

export interface AppAuthLoginResponse {
  access_token: string
  refresh_token: string
  name: string
  role: AppAuthRole
}

export interface AppAuthLoginErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}

export interface AppAuthReissueRequest {
  refresh_token: string
}

export interface AppAuthReissueResponse {
  access_token: string
  refresh_token: string
}

export interface AppAuthReissueErrorResponse {
  message: string
  status: number
  timestamp: string
  description: string
}
