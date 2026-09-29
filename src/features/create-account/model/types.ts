export interface CreateAccountInput {
  name: string
  username: string
}

export type CreateAccountSubmit = (input: CreateAccountInput) => Promise<void>
