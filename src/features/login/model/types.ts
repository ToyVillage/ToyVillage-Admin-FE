export interface LoginCredentials {
  username: string
  password: string
}

// 자격증명 불일치(401)만 입력 아래에 알리고, 나머지 실패는 토스트로 알린다.
export type LoginFailureReason = 'credential' | 'unknown'

export class LoginSubmitError extends Error {
  readonly reason: LoginFailureReason

  constructor(reason: LoginFailureReason, options?: ErrorOptions) {
    super('로그인에 실패했습니다.', options)
    this.name = 'LoginSubmitError'
    this.reason = reason
  }
}

export type LoginSubmit = (credentials: LoginCredentials) => Promise<void>
