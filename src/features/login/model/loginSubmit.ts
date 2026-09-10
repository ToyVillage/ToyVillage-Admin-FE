import { login } from '@/entities/auth'
import { clearSession, saveSession } from '@/shared/api/session'
import type { LoginSubmit } from './types'

export const loginSubmitEvent = 'toyvillage:login-submit'

export const submitLogin: LoginSubmit = async (credentials) => {
  window.dispatchEvent(new Event(loginSubmitEvent))

  try {
    const session = await login(credentials)

    saveSession({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      name: session.name,
      role: session.role,
    })
  } catch (error) {
    // 실패한 로그인이 이전 세션을 남기지 않게 한다.
    clearSession()
    throw error
  }
}
