import type { LoginSubmit } from './types'

export const loginMockResultKey = 'toyvillage.login.mockResult'
export const loginMockSubmitEvent = 'toyvillage:login-submit'

export const submitMockLogin: LoginSubmit = async (credentials) => {
  if (!credentials.username || !credentials.password) {
    throw new Error('Mock login credentials are required')
  }

  window.dispatchEvent(new Event(loginMockSubmitEvent))
  await new Promise((resolve) => window.setTimeout(resolve, 300))

  if (window.sessionStorage.getItem(loginMockResultKey) === 'failure') {
    throw new Error('Mock login failed')
  }
}
