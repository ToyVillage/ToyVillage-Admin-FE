export interface LoginCredentials {
  username: string
  password: string
}

export type LoginSubmit = (credentials: LoginCredentials) => Promise<void>
