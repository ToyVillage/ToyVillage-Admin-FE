import type { InternalAxiosRequestConfig } from 'axios'
import * as Sentry from '@sentry/react'
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
import { toPathPattern } from '@/shared/api/reportApiError'

// 재발급 자신과 로그인은 인증 없이 호출한다. 이 경로의 401은 세션 만료가 아니다.
const publicAuthPaths = [appAuthLoginPath, appAuthReissuePath]

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  isSessionRetry?: boolean
}

// 서버가 만료·토큰 없음·권한 없음을 모두 403 으로 줘 상태 코드로는 구분되지 않는다.
// 세션이 끝난 단계로 나눈다.
type SessionEndReason =
  'no-refresh-token' | 'reissue-failed' | 'rejected-after-reissue'

interface ReissueFailure {
  reason: 'no-refresh-token' | 'reissue-failed'
  status?: number
}

// 동시에 401이 난 요청들이 재발급을 중복 호출하지 않도록 하나의 Promise를 공유한다.
let pendingReissue: Promise<string | ReissueFailure> | null = null

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
        endExpiredSession('rejected-after-reissue', config.url, status)
        throw error
      }

      const reissued = await reissueSharedAccessToken()

      if (typeof reissued !== 'string') {
        endExpiredSession(reissued.reason, config.url, reissued.status)
        throw error
      }

      config.isSessionRetry = true
      config.headers.set('Authorization', `Bearer ${reissued}`)

      return api.request(config)
    },
  )
}

async function reissueSharedAccessToken(): Promise<string | ReissueFailure> {
  pendingReissue ??= requestReissue().finally(() => {
    pendingReissue = null
  })

  return pendingReissue
}

async function requestReissue(): Promise<string | ReissueFailure> {
  const refreshToken = readRefreshToken()

  if (!refreshToken) return { reason: 'no-refresh-token' }

  try {
    const tokens = await reissueAppToken({ refresh_token: refreshToken })

    // 재발급에 성공하면 기존 refresh token은 무효화되므로 둘 다 교체한다.
    saveTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    })

    return tokens.access_token
  } catch (error) {
    return { reason: 'reissue-failed', status: readErrorStatus(error) }
  }
}

// 사용자가 누르지 않은 로그아웃을 경고로 남긴다. 함께 실패한 요청들이 차례로 여기에 오므로
// 저장소가 아직 비지 않은, 세션을 처음 끝내는 요청만 보낸다. 다른 탭에서 로그아웃해
// 토큰이 이미 없는 경우도 여기서 걸러진다.
function endExpiredSession(
  reason: SessionEndReason,
  url: string | undefined,
  status: number | undefined,
): void {
  if (readAccessToken() || readRefreshToken()) {
    Sentry.captureMessage('인증 실패로 세션 종료', {
      level: 'warning',
      tags: {
        'session.end_reason': reason,
        'session.status': status ?? 'none',
        'api.path': toPathPattern(url),
      },
      fingerprint: ['session-end', reason],
    })
  }

  endSession()
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
