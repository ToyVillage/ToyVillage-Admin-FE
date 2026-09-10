// 앱 인증 세션 저장소. 토큰과 사용자 정보를 한곳에서만 다룬다.
// 레이어 경계상 shared는 entities를 참조할 수 없으므로 역할 타입을 여기서 소유하고
// entities/auth가 이를 재사용한다.
export type AppSessionRole = 'APP_ADMIN' | 'EMPLOYEE'

export interface AppSessionUser {
  name: string
  role: AppSessionRole
}

export const accessTokenStorageKey = 'accessToken'
export const refreshTokenStorageKey = 'refreshToken'
export const sessionUserStorageKey = 'toyvillage.session.user'

export interface AppSession extends AppSessionUser {
  accessToken: string
  refreshToken: string
}

export function readAccessToken(): string | null {
  return localStorage.getItem(accessTokenStorageKey)
}

export function readRefreshToken(): string | null {
  return localStorage.getItem(refreshTokenStorageKey)
}

export function readSessionUser(): AppSessionUser | null {
  const raw = localStorage.getItem(sessionUserStorageKey)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    return isSessionUser(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveSession({
  accessToken,
  refreshToken,
  name,
  role,
}: AppSession): void {
  saveTokens({ accessToken, refreshToken })
  localStorage.setItem(sessionUserStorageKey, JSON.stringify({ name, role }))
}

// 재발급 응답은 사용자 정보를 주지 않는다. 토큰만 교체한다.
export function saveTokens({
  accessToken,
  refreshToken,
}: Pick<AppSession, 'accessToken' | 'refreshToken'>): void {
  localStorage.setItem(accessTokenStorageKey, accessToken)
  localStorage.setItem(refreshTokenStorageKey, refreshToken)
}

export function clearSession(): void {
  localStorage.removeItem(accessTokenStorageKey)
  localStorage.removeItem(refreshTokenStorageKey)
  localStorage.removeItem(sessionUserStorageKey)
}

export const loginPath = '/login'

// 인터셉터는 React Router 밖이라 useNavigate를 쓸 수 없다. 전체 이동으로 앱을 다시 띄운다.
export function endSession(): void {
  clearSession()

  if (window.location.pathname === loginPath) return

  window.location.replace(loginPath)
}

function isSessionUser(value: unknown): value is AppSessionUser {
  if (typeof value !== 'object' || value === null) return false

  const user = value as Record<string, unknown>
  return (
    typeof user.name === 'string' &&
    (user.role === 'APP_ADMIN' || user.role === 'EMPLOYEE')
  )
}
