import type { InternalAxiosRequestConfig } from 'axios'
import {
  appAuthLoginPath,
  appAuthLogoutPath,
  appAuthReissuePath,
  reissueAppToken,
} from '@/entities/auth'
import { api } from '@/shared/api/axios'
import {
  endSession,
  readAccessToken,
  readRefreshToken,
  saveTokens,
} from '@/shared/api/session'

// 재발급 자신과 로그인은 인증 없이 호출한다. 이 경로의 401은 세션 만료가 아니다.
const publicAuthPaths = [appAuthLoginPath, appAuthReissuePath]

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  isSessionRetry?: boolean
}

// 동시에 401이 난 요청들이 재발급을 중복 호출하지 않도록 하나의 Promise를 공유한다.
let pendingReissue: Promise<string | null> | null = null

export function configureApiAuthentication(): void {
  api.interceptors.request.use((config) => {
    if (isPublicAuthPath(config.url)) return config

    const accessToken = readAccessToken()

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`)
    }

    return config
  })

  api.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      const status = readErrorStatus(error)
      const config = readErrorConfig(error)

      if (!config || isPublicAuthPath(config.url)) throw error

      // 로그아웃의 403(권한 거부)은 재발급해도 달라지지 않는다. 바로 세션을 끝낸다.
      // (로그아웃의 401 은 기존대로 재발급 후 재시도한다 — 아래 흐름을 탄다.)
      if (status === 403 && isLogoutPath(config.url)) {
        endSession()
        throw error
      }

      // 서버는 만료·누락 토큰에 401 이 아니라 403(빈 본문)을 준다.
      // 그래서 403 도 재발급 대상으로 본다 — 예전처럼 즉시 로그아웃하면
      // access token 이 만료될 때마다 재발급 없이 튕긴다.
      // 권한 거부로 인한 403 이면 재발급 후 재시도도 403 이라 아래에서 세션을 비운다.
      if (status !== 401 && status !== 403) throw error

      // 새 토큰으로 재시도했는데도 막히면 더 시도하지 않는다.
      if (config.isSessionRetry) {
        endSession()
        throw error
      }

      const accessToken = await reissueSharedAccessToken()

      if (!accessToken) {
        endSession()
        throw error
      }

      config.isSessionRetry = true
      config.headers.set('Authorization', `Bearer ${accessToken}`)

      return api.request(config)
    },
  )
}

async function reissueSharedAccessToken(): Promise<string | null> {
  pendingReissue ??= requestReissue().finally(() => {
    pendingReissue = null
  })

  return pendingReissue
}

async function requestReissue(): Promise<string | null> {
  const refreshToken = readRefreshToken()

  if (!refreshToken) return null

  try {
    const tokens = await reissueAppToken({ refresh_token: refreshToken })

    // 재발급에 성공하면 기존 refresh token은 무효화되므로 둘 다 교체한다.
    saveTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    })

    return tokens.access_token
  } catch {
    return null
  }
}

function isLogoutPath(url: string | undefined): boolean {
  return url !== undefined && url.startsWith(appAuthLogoutPath)
}

function isPublicAuthPath(url: string | undefined): boolean {
  if (!url) return false

  return publicAuthPaths.some((path) => url.startsWith(path))
}

function readErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined

  const response = (error as { response?: unknown }).response
  if (typeof response !== 'object' || response === null) return undefined

  const status = (response as { status?: unknown }).status
  return typeof status === 'number' ? status : undefined
}

function readErrorConfig(error: unknown): RetryableRequestConfig | undefined {
  if (typeof error !== 'object' || error === null) return undefined

  const config = (error as { config?: unknown }).config
  if (typeof config !== 'object' || config === null) return undefined

  return config as RetryableRequestConfig
}
